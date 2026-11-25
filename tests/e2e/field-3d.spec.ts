import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import { completeNewGameSetup } from './newGame';

test('field terrain and billboards stay projected across camera movement', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');

  const meshState = async () =>
    page.evaluate(() => {
      const game = (window as unknown as { __nq: Phaser.Game }).__nq;
      const scene = game.scene.getScene('Overworld');
      const camera = scene.cameras.main;
      return {
        camera: {
          scrollX: camera.scrollX,
          scrollY: camera.scrollY,
          zoom: camera.zoom,
          width: camera.width / camera.zoom,
          height: camera.height / camera.zoom,
        },
        orchardProps: scene.children.list.filter(
          (child) =>
            'texture' in child &&
            (child as Phaser.GameObjects.Image).texture?.key === 'overworld-3d-orchard-props',
        ).length,
        meshes: scene.children.list
          .filter((child): child is Phaser.GameObjects.Mesh => child.type === 'Mesh')
          .map((mesh) => ({
            vertices: mesh.vertices.length,
            faces: mesh.faces.length,
            visible: mesh.visible,
            x: mesh.x,
            y: mesh.y,
            minX: Math.min(...mesh.vertices.map((vertex) => vertex.vx)),
            maxX: Math.max(...mesh.vertices.map((vertex) => vertex.vx)),
            minY: Math.min(...mesh.vertices.map((vertex) => vertex.vy)),
            maxY: Math.max(...mesh.vertices.map((vertex) => vertex.vy)),
          })),
      };
    });

  const rightCenterPixel = async () =>
    page.evaluate(
      () =>
        new Promise<{ red: number; green: number; blue: number }>((resolve) => {
          const game = (window as unknown as { __nq: Phaser.Game }).__nq;
          game.renderer.snapshotPixel(
            Math.floor(game.renderer.width * 0.82),
            Math.floor(game.renderer.height * 0.5),
            (snapshot) => {
              const color = snapshot as Phaser.Display.Color;
              resolve({ red: color.red, green: color.green, blue: color.blue });
            },
          );
        }),
    );

  const projectedTownMarker = async () =>
    page.evaluate(
      () =>
        new Promise<{ moved: boolean; scaled: boolean }>((resolve) => {
          const game = (window as unknown as { __nq: Phaser.Game }).__nq;
          const scene = game.scene.getScene('Overworld');
          const marker = scene.children.list.find(
            (child): child is Phaser.GameObjects.Image =>
              child.type === 'Image' && (child as Phaser.GameObjects.Image).texture.key === 'fld.icon.town',
          );
          if (!marker) return resolve({ moved: false, scaled: false });
          const before = { x: marker.x, y: marker.y, scaleX: marker.scaleX, scaleY: marker.scaleY };
          scene.events.once('prerender', () =>
            resolve({
              moved: marker.x !== before.x || marker.y !== before.y,
              scaled: marker.scaleX !== before.scaleX || marker.scaleY !== before.scaleY,
            }),
          );
        }),
    );

  const before = await meshState();
  expect(before.meshes[0]?.faces).toBeGreaterThan(0);
  expect(before.meshes[0]!.minX).toBeLessThan(-before.camera.width / 2);
  expect(before.meshes[0]!.maxX).toBeGreaterThan(before.camera.width / 2);
  const pixel = await rightCenterPixel();
  expect(pixel.red + pixel.green + pixel.blue).toBeGreaterThan(40);
  expect(await projectedTownMarker()).toEqual({ moved: true, scaled: true });
  expect(before.orchardProps).toBeGreaterThan(0);
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    const gl = renderer.gl;
    const pixel = new Uint8Array(4);
    const frames: Array<{ average: number; darkFraction: number }> = [];
    const sample = () => {
      let luminance = 0;
      let dark = 0;
      let count = 0;
      for (let row = 1; row <= 4; row += 1)
        for (let column = 1; column <= 6; column += 1) {
          const x = Math.floor((gl.drawingBufferWidth * column) / 7);
          const y = Math.floor((gl.drawingBufferHeight * row) / 5);
          gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          const value = pixel[0]! * 0.2126 + pixel[1]! * 0.7152 + pixel[2]! * 0.0722;
          luminance += value;
          if (value < 24) dark += 1;
          count += 1;
        }
      frames.push({
        average: luminance / count,
        darkFraction: dark / count,
      });
    };
    game.events.on('postrender', sample);
    (
      window as unknown as {
        __stopFieldLuminanceSampling: () => {
          frames: number;
          maxDarkFraction: number;
          maxRelativeDrop: number;
        };
      }
    ).__stopFieldLuminanceSampling = () => {
      game.events.off('postrender', sample);
      let maxRelativeDrop = 0;
      for (let index = 1; index < frames.length; index += 1) {
        const previous = frames[index - 1]!.average;
        const current = frames[index]!.average;
        maxRelativeDrop = Math.max(maxRelativeDrop, (previous - current) / Math.max(1, previous));
      }
      return {
        frames: frames.length,
        maxDarkFraction: Math.max(0, ...frames.map((frame) => frame.darkFraction)),
        maxRelativeDrop,
      };
    };
  });
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const scene = game.scene.getScene('Overworld');
    const camera = scene.cameras.main;
    const player = (scene as Phaser.Scene & { player: Phaser.GameObjects.Sprite }).player;
    const originalPreRender = camera.preRender;
    const samples: number[] = [];
    let offscreenFrames = 0;
    camera.preRender = function () {
      const before = { x: camera.scrollX, y: camera.scrollY };
      const result = originalPreRender.call(this);
      samples.push(Math.max(Math.abs(camera.scrollX - before.x), Math.abs(camera.scrollY - before.y)));
      const viewWidth = camera.width / camera.zoom;
      const viewHeight = camera.height / camera.zoom;
      const viewLeft = camera.scrollX + (camera.width - viewWidth) / 2;
      const viewTop = camera.scrollY + (camera.height - viewHeight) / 2;
      const screenX = (player.x - viewLeft) * camera.zoom;
      const screenY = (player.y - viewTop) * camera.zoom;
      if (screenX < 0 || screenX > camera.width || screenY < 0 || screenY > camera.height)
        offscreenFrames += 1;
      return result;
    };
    (
      window as unknown as {
        __stopCameraRenderSampling: () => {
          maxShift: number;
          offscreenFrames: number;
          samples: number;
        };
      }
    ).__stopCameraRenderSampling = () => {
      camera.preRender = originalPreRender;
      return { maxShift: Math.max(0, ...samples), offscreenFrames, samples: samples.length };
    };
  });
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowDown');
  const renderSync = await page.evaluate(() =>
    (
      window as unknown as {
        __stopCameraRenderSampling: () => {
          maxShift: number;
          offscreenFrames: number;
          samples: number;
        };
      }
    ).__stopCameraRenderSampling(),
  );
  expect(renderSync.samples).toBeGreaterThan(0);
  expect(renderSync.maxShift).toBeLessThanOrEqual(0.01);
  expect(renderSync.offscreenFrames).toBe(0);
  await page.waitForTimeout(500);
  const luminance = await page.evaluate(() =>
    (
      window as unknown as {
        __stopFieldLuminanceSampling: () => {
          frames: number;
          maxDarkFraction: number;
          maxRelativeDrop: number;
        };
      }
    ).__stopFieldLuminanceSampling(),
  );
  expect(luminance.frames).toBeGreaterThan(10);
  expect(luminance.maxDarkFraction).toBeLessThan(0.75);
  expect(luminance.maxRelativeDrop).toBeLessThan(0.45);

  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const scene = game.scene.getScene('Overworld');
    const camera = scene.cameras.main;
    const player = (scene as Phaser.Scene & { player: Phaser.GameObjects.Sprite }).player;
    let frames = 0;
    const cameraOffsetSamples: number[] = [];
    const terrainSamples: number[] = [];
    let meshRebuilds = 0;
    const meshes = scene.children.list.filter(
      (child): child is Phaser.GameObjects.Mesh => child.type === 'Mesh',
    );
    let firstTerrainVertex = meshes[0]?.vertices[0];
    const terrainListeners = scene.events.listeners('prerender');
    for (const listener of terrainListeners) scene.events.off('prerender', listener as () => void);
    const measureTerrain = () => {
      const started = performance.now();
      for (const listener of terrainListeners) (listener as () => void)();
      terrainSamples.push(performance.now() - started);
      const nextFirstTerrainVertex = meshes[0]?.vertices[0];
      if (nextFirstTerrainVertex && nextFirstTerrainVertex !== firstTerrainVertex) {
        meshRebuilds += 1;
        firstTerrainVertex = nextFirstTerrainVertex;
      }
    };
    scene.events.on('prerender', measureTerrain);
    const sample = () => {
      frames += 1;
      const viewWidth = camera.width / camera.zoom;
      const viewHeight = camera.height / camera.zoom;
      const viewLeft = camera.scrollX + (camera.width - viewWidth) / 2;
      const viewTop = camera.scrollY + (camera.height - viewHeight) / 2;
      const screenX = (player.x - viewLeft) * camera.zoom;
      const screenY = (player.y - viewTop) * camera.zoom;
      cameraOffsetSamples.push(
        Math.max(Math.abs(screenX - camera.width / 2), Math.abs(screenY - camera.height / 2)),
      );
    };
    game.events.on('postrender', sample);
    (
      scene as Phaser.Scene & {
        checkRandomEncounter: () => void;
      }
    ).checkRandomEncounter = () => {};
    (
      window as unknown as {
        __stopFieldFrameSampling: () => {
          frames: number;
          terrainP95Ms: number;
          vertices: number;
          cameraOffsetP95Px: number;
          meshRebuilds: number;
        };
      }
    ).__stopFieldFrameSampling = () => {
      game.events.off('postrender', sample);
      scene.events.off('prerender', measureTerrain);
      for (const listener of terrainListeners) scene.events.on('prerender', listener as () => void);
      const sortedTerrain = terrainSamples.slice(2).sort((left, right) => left - right);
      const sortedCameraOffsets = cameraOffsetSamples.slice(2).sort((left, right) => left - right);
      return {
        frames: Math.max(0, frames - 2),
        terrainP95Ms: sortedTerrain[Math.floor((sortedTerrain.length - 1) * 0.95)] ?? 0,
        vertices: meshes.reduce((total, mesh) => total + mesh.vertices.length, 0),
        cameraOffsetP95Px: sortedCameraOffsets[Math.floor((sortedCameraOffsets.length - 1) * 0.95)] ?? 0,
        meshRebuilds,
      };
    };
  });
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown']) {
    await page.keyboard.down(key);
    await page.waitForTimeout(360);
    await page.keyboard.up(key);
  }
  const frameTiming = await page.evaluate(() =>
    (
      window as unknown as {
        __stopFieldFrameSampling: () => {
          frames: number;
          terrainP95Ms: number;
          vertices: number;
          cameraOffsetP95Px: number;
          meshRebuilds: number;
        };
      }
    ).__stopFieldFrameSampling(),
  );
  expect(frameTiming.frames).toBeGreaterThan(40);
  expect(frameTiming.terrainP95Ms).toBeLessThan(15);
  expect(frameTiming.vertices).toBeLessThan(6_500);
  expect(frameTiming.cameraOffsetP95Px).toBeLessThan(2);
  expect(frameTiming.meshRebuilds).toBeLessThanOrEqual(4);

  const after = await meshState();
  expect(after.meshes[0]?.faces).toBeGreaterThan(0);
  expect(after.meshes[0]!.minY).toBeLessThan(-after.camera.height / 2);
  expect(after.meshes[0]!.maxY).toBeGreaterThan(after.camera.height / 2);
  expect(errors).toEqual([]);
});
