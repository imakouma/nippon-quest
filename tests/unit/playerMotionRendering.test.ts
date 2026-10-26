import { describe, expect, it } from 'vitest';
import {
  DIRS,
  HERO_H,
  HERO_W,
  heroLook,
  walkFrame,
  walkFrames,
  type Dir,
} from '../../src/rendering/characters';
import { COSTUME_ART } from '../../src/rendering/costumes';
import { NQ, NQ48 } from '../../src/rendering/palette';
import { playerMotionPose, type PlayerMotionState } from '../../src/rendering/playerMotion';
import { presentPlayerMotion } from '../../src/scenes/overworld/playerMotionPresenter';

const idle = (facing: Dir = 'down'): PlayerMotionState => ({ phase: 'idle', facing, leadFoot: 'a' });

describe('主人公の移動ポーズ', () => {
  it.each(DIRS)('停止中と一歩の両端は %s 向きの接地コマに戻る', (facing) => {
    const planted = walkFrame(facing, 1);

    expect(playerMotionPose(idle(facing))).toMatchObject({ frame: planted, offsetX: 0, offsetY: 0 });
    expect(playerMotionPose({ phase: 'stepping', facing, progress: 0, leadFoot: 'a' })).toMatchObject({
      frame: planted,
      offsetX: 0,
      offsetY: 0,
      shadowScale: 1,
    });
    expect(playerMotionPose({ phase: 'stepping', facing, progress: 1, leadFoot: 'a' })).toMatchObject({
      frame: planted,
      offsetX: 0,
      offsetY: 0,
      shadowScale: 1,
    });
  });

  it('歩行中は進行率から接地足を選び、連続する一歩で左右を交互にする', () => {
    const step = (leadFoot: 'a' | 'b', progress: number): PlayerMotionState => ({
      phase: 'stepping',
      facing: 'right',
      progress,
      leadFoot,
    });

    expect(playerMotionPose(step('a', 0.001)).frame).toBe(walkFrame('right', 0));
    expect(playerMotionPose(step('a', 0.5))).toMatchObject({
      frame: walkFrame('right', 0),
      offsetY: -1,
    });
    expect(playerMotionPose(step('b', 0.999)).frame).toBe(walkFrame('right', 2));
    expect(playerMotionPose(step('a', 0.5)).frame).not.toBe(playerMotionPose(step('b', 0.5)).frame);
  });

  it('方向転換と壁衝突は論理位置を変えず、1px以内の整数オフセットになる', () => {
    const states: PlayerMotionState[] = [
      { phase: 'turning', facing: 'left', elapsedMs: 20 },
      { phase: 'turning', facing: 'up', elapsedMs: 40 },
      { phase: 'bumping', facing: 'right', progress: 0.5 },
      { phase: 'bumping', facing: 'down', progress: 0.5 },
    ];

    for (const state of states) {
      const pose = playerMotionPose(state);
      expect(Number.isInteger(pose.offsetX)).toBe(true);
      expect(Number.isInteger(pose.offsetY)).toBe(true);
      expect(Math.abs(pose.offsetX)).toBeLessThanOrEqual(1);
      expect(Math.abs(pose.offsetY)).toBeLessThanOrEqual(1);
      expect(pose).not.toEqual(playerMotionPose(idle(state.facing)));
    }
  });

  it('方向転換と壁衝突を同じ向きでも別のポーズとして描く', () => {
    expect(playerMotionPose({ phase: 'turning', facing: 'right', elapsedMs: 40 })).not.toEqual(
      playerMotionPose({ phase: 'bumping', facing: 'right', progress: 0.5 }),
    );
  });

  it('衝突の開始と終了、scripted/frozen は接地ポーズを保つ', () => {
    for (const progress of [0, 1]) {
      expect(playerMotionPose({ phase: 'bumping', facing: 'up', progress })).toEqual(
        playerMotionPose(idle('up')),
      );
    }
    expect(playerMotionPose({ phase: 'scripted', facing: 'left' })).toEqual(playerMotionPose(idle('left')));
    expect(playerMotionPose({ phase: 'frozen', facing: 'right' })).toEqual(playerMotionPose(idle('right')));
  });
});

describe('24×32 主人公フレーム', () => {
  it('全装備の全歩行コマが寸法内・NQ-48内・透明ありを保つ', () => {
    const appearance = { hair: 7, skin: 6, cloth: 9, hairStyle: 3, eyes: 2 };
    const equipmentSets = [{}, ...Object.entries(COSTUME_ART).map(([id, art]) => ({ [art.slot]: id }))];
    const palette = new Set<string>(NQ48);

    for (const equipment of equipmentSets) {
      const frames = walkFrames(heroLook(appearance, equipment), true);
      expect(frames).toHaveLength(12);
      for (const frame of frames) {
        expect(frame).toHaveLength(HERO_H);
        expect(frame.every((row) => row.length === HERO_W)).toBe(true);
        expect(frame.some((row) => row.includes(null))).toBe(true);
        expect(frame.flat().every((color) => color === null || palette.has(color))).toBe(true);
      }
    }
  });

  it.each(DIRS)('%s 向きで左右の腕を1pxだけ交互に振る', (facing) => {
    const frames = walkFrames(heroLook({ hair: 0, skin: 0, cloth: 0 }), true);
    const observedSide = facing === 'right' ? 'right' : 'left';
    const handRows = (column: 0 | 1 | 2, side: 'left' | 'right') =>
      frames[walkFrame(facing, column)]!.flatMap((row, y) =>
        row.flatMap((color, x) =>
          color === NQ.cream && y >= 20 && (side === 'left' ? x < HERO_W / 2 : x >= HERO_W / 2) ? [y] : [],
        ),
      ).sort((a, b) => a - b);

    const idleLeft = handRows(1, observedSide);
    const stepALeft = handRows(0, observedSide);
    const stepBLeft = handRows(2, observedSide);
    expect(stepALeft).not.toEqual(idleLeft);
    expect(stepBLeft).not.toEqual(idleLeft);
    expect(stepALeft).not.toEqual(stepBLeft);
    expect(Math.abs(stepALeft[0]! - idleLeft[0]!)).toBeLessThanOrEqual(1);
    expect(Math.abs(stepBLeft[0]! - idleLeft[0]!)).toBeLessThanOrEqual(1);
  });

  it('肌と同じ色の装備でも胴体を腕として動かさない', () => {
    const frames = walkFrames(
      heroLook({ hair: 0, skin: 3, cloth: 0 }, { chest: 'ibaraki-meisan-natto' }),
      true,
    );
    const torso = (column: 0 | 1 | 2) =>
      frames[walkFrame('down', column)]!.slice(19, 26).map((row) => row.slice(5, 19));

    expect(torso(0)).toEqual(torso(1));
    expect(torso(2)).toEqual(torso(1));
  });
});

describe('playerMotionPresenter', () => {
  it('見た目変更中も現在の歩行コマを新テクスチャへ適用し、影は足元アンカーに残す', () => {
    const sprite = {
      texture: { key: 'hero.old' },
      frame: -1,
      x: 0,
      y: 0,
      setTexture(key: string) {
        this.texture.key = key;
        this.frame = -1;
        return this;
      },
      setFrame(frame: number) {
        this.frame = frame;
        return this;
      },
      setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
      },
    };
    const shadow = {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
      },
      setScale(x: number, y: number) {
        this.scaleX = x;
        this.scaleY = y;
        return this;
      },
    };
    const state: PlayerMotionState = {
      phase: 'stepping',
      facing: 'left',
      progress: 0.5,
      leadFoot: 'b',
    };

    const pose = presentPlayerMotion({
      sprite,
      shadow,
      textureKey: 'hero.new',
      state,
      anchorX: 40,
      anchorY: 56,
    });

    expect(sprite.texture.key).toBe('hero.new');
    expect(sprite.frame).toBe(walkFrame('left', 2));
    expect([sprite.x, sprite.y]).toEqual([40 + pose.offsetX, 56 + pose.offsetY]);
    expect([shadow.x, shadow.y]).toEqual([40, 62]);
    expect([shadow.scaleX, shadow.scaleY]).toEqual([pose.shadowScale, pose.shadowScale]);
  });
});
