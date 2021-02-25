import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { FreeCameraKeyboardMoveInput } from '@babylonjs/core/Cameras/Inputs/freeCameraKeyboardMoveInput';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { GridMaterial } from '@babylonjs/materials/grid';
import '@babylonjs/core/Meshes/meshBuilder';

import './App.scss';
import { terrain } from './utils/terrain';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

const engine = new Engine(canvas);
const scene = new Scene(engine);

const material = new GridMaterial('grid', scene);

const moveInput = new FreeCameraKeyboardMoveInput();
moveInput.keysUp = [87];
moveInput.keysDown = [83];
moveInput.keysLeft = [65];
moveInput.keysRight = [68];

const camera = new FreeCamera('playerCamera', new Vector3(0, 1, 0), scene);
camera.setTarget(Vector3.Zero());
camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
camera.inputs.add(moveInput);
camera.attachControl(canvas, true);

const playerBox = Mesh.CreateBox('player', 1, scene);
playerBox.position = new Vector3(10.5, 34.5, 10.5);
playerBox.material = material;

camera.parent = playerBox;

const light = new HemisphericLight('light1', new Vector3(0, 35, 0), scene);
light.intensity = 10;

const map = new Array(32)
  .fill(undefined)
  .map((_, x) =>
    new Array(32)
      .fill(undefined)
      .map((_, y) =>
        new Array(32)
          .fill(undefined)
          .map((_, z) => terrain(1234, x, y, z) > 0.1)
      )
  );

for (let x = 0; x < 32; x++) {
  for (let y = 0; y < 32; y++) {
    for (let z = 0; z < 32; z++) {
      if (map[x][y][z]) {
        const box = Mesh.CreateBox('box', 0.8, scene);
        box.position = new Vector3(x, y, z);
        box.material = material;
      }
    }
  }
}

engine.runRenderLoop(() => {
  scene.render();
});
