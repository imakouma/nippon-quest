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
              child.type === 'Image' &&
              (child as Phaser.GameObjects.Image).texture.key === 'fld.icon.town',
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
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(500);

  const after = await meshState();
  expect(after.meshes[0]?.faces).toBeGreaterThan(0);
  expect(after.meshes[0]!.minY).toBeLessThan(-after.camera.height / 2);
  expect(after.meshes[0]!.maxY).toBeGreaterThan(after.camera.height / 2);
  expect(errors).toEqual([]);
});
