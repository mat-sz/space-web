import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { FreeCameraKeyboardMoveInput } from '@babylonjs/core/Cameras/Inputs/freeCameraKeyboardMoveInput';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { GridMaterial } from '@babylonjs/materials/grid';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
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

const points: number[] = [];
const indices: number[] = [];
const normals: number[] = [];
let index = 0;

enum FaceType {
  TOP,
  BOTTOM,
  FRONT,
  BACK,
  LEFT,
  RIGHT,
}

function face(x: number, y: number, z: number, type: FaceType) {
  switch (type) {
    case FaceType.TOP:
      points.push(
        x,
        y + 1,
        z,
        x,
        y + 1,
        z + 1,
        x + 1,
        y + 1,
        z,
        x + 1,
        y + 1,
        z,
        x,
        y + 1,
        z + 1,
        x + 1,
        y + 1,
        z + 1
      );
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      break;
    case FaceType.BOTTOM:
      points.push(
        x,
        y,
        z,
        x,
        y,
        z + 1,
        x + 1,
        y,
        z,
        x + 1,
        y,
        z,
        x,
        y,
        z + 1,
        x + 1,
        y,
        z + 1
      );
      normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0);
      break;
    case FaceType.LEFT:
      points.push(
        x,
        y,
        z,
        x,
        y,
        z + 1,
        x,
        y + 1,
        z,
        x,
        y + 1,
        z,
        x,
        y,
        z + 1,
        x,
        y + 1,
        z + 1
      );
      normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
      break;
    case FaceType.RIGHT:
      points.push(
        x + 1,
        y,
        z,
        x + 1,
        y,
        z + 1,
        x + 1,
        y + 1,
        z,
        x + 1,
        y + 1,
        z,
        x + 1,
        y,
        z + 1,
        x + 1,
        y + 1,
        z + 1
      );
      normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
      break;
    case FaceType.BACK:
      points.push(
        x,
        y,
        z,
        x + 1,
        y,
        z,
        x,
        y + 1,
        z,
        x,
        y + 1,
        z,
        x + 1,
        y,
        z,
        x + 1,
        y + 1,
        z
      );
      normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
      break;
    case FaceType.FRONT:
      points.push(
        x,
        y,
        z + 1,
        x + 1,
        y,
        z + 1,
        x,
        y + 1,
        z + 1,
        x,
        y + 1,
        z + 1,
        x + 1,
        y,
        z + 1,
        x + 1,
        y + 1,
        z + 1
      );
      normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
      break;
  }

  if (
    type === FaceType.TOP ||
    type === FaceType.FRONT ||
    type === FaceType.LEFT
  ) {
    for (let i = 5; i >= 0; i--) {
      indices.push(index + i);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      indices.push(index + i);
    }
  }
  index += 6;
}

function checkAndPaint(x: number, y: number, z: number, type: FaceType) {
  let val: boolean;
  switch (type) {
    case FaceType.TOP:
      val = map[x]?.[y + 1]?.[z];
      break;
    case FaceType.BOTTOM:
      val = map[x]?.[y - 1]?.[z];
      break;
    case FaceType.LEFT:
      val = map[x - 1]?.[y]?.[z];
      break;
    case FaceType.RIGHT:
      val = map[x + 1]?.[y]?.[z];
      break;
    case FaceType.BACK:
      val = map[x]?.[y]?.[z - 1];
      break;
    case FaceType.FRONT:
      val = map[x]?.[y]?.[z + 1];
      break;
  }
  if (!val) {
    face(x, y, z, type);
  }
}

for (let x = 0; x < 32; x++) {
  for (let y = 0; y < 32; y++) {
    for (let z = 0; z < 32; z++) {
      const p = map[x][y][z];
      if (p) {
        checkAndPaint(x, y, z, FaceType.TOP);
        checkAndPaint(x, y, z, FaceType.BOTTOM);
        checkAndPaint(x, y, z, FaceType.LEFT);
        checkAndPaint(x, y, z, FaceType.RIGHT);
        checkAndPaint(x, y, z, FaceType.BACK);
        checkAndPaint(x, y, z, FaceType.FRONT);
      }
    }
  }
}

const customMesh = new Mesh('block', scene);
customMesh.material = material;
const vertexData = new VertexData();
vertexData.positions = points;
vertexData.indices = indices;
vertexData.normals = normals;
vertexData.applyToMesh(customMesh);

engine.runRenderLoop(() => {
  scene.render();
});
