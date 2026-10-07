import type Phaser from 'phaser';

/** Phaserが完了通知を落としても、演出だけを打ち切ってゲーム進行を継続する。 */
export function tweenPromise(
  manager: Phaser.Tweens.TweenManager,
  cfg: Phaser.Types.Tweens.TweenBuilderConfig,
): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    let guard = 0;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(guard);
      resolve();
    };
    const duration = typeof cfg.duration === 'number' ? cfg.duration : 1000;
    const delay = typeof cfg.delay === 'number' ? cfg.delay : 0;
    const repeat = typeof cfg.repeat === 'number' && cfg.repeat > 0 ? cfg.repeat + 1 : 1;
    const passes = cfg.yoyo ? 2 : 1;
    const tween = manager.add({ ...cfg, onComplete: finish, onStop: finish });
    guard = window.setTimeout(
      () => {
        if (!done) tween.stop();
        finish();
      },
      delay + duration * repeat * passes + 1200,
    );
  });
}
