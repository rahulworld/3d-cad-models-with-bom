import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import occtimportjs from "occt-import-js";
// import occtimportWasm from 'occt-import-js/dist/occt-import-js.wasm'

// const wasmBlob = dataURItoBlob(occtimportWasm)
// const wasmUrl = URL.createObjectURL(wasmBlob)
const wasmUrl =
  "https://cdn.jsdelivr.net/npm/occt-import-js@0.0.12/dist/occt-import-js.wasm";

export const readStepModel = async (fileUrl) => {
  const occt = await occtimportjs({
    locateFile: (name) => {
      console.log("name", name);
      return wasmUrl;
    },
  });

  let response = await fetch(fileUrl);
  let buffer = await response.arrayBuffer();

  let fileBuffer = new Uint8Array(buffer);
  let stepModel = occt.ReadStepFile(fileBuffer);
  return stepModel;
};

export const readAndParseStepArrayBuffer = async (stepArrayBuffer) => {
  const occt = await occtimportjs({
    locateFile: (name) => {
      console.log("name", name);
      return wasmUrl;
    },
  });
  let fileBuffer = new Uint8Array(stepArrayBuffer);
  let stepModel = occt.ReadStepFile(fileBuffer);
  return stepModel;
};

export const getUpdatedStepModel = async (stepModel) => {
  let loadedModel = stepModel;
  const targetObject = new THREE.Object3D();

  for (let resultMesh of loadedModel.meshes) {
    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3)
    );
    if (resultMesh.attributes.normal) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3)
      );
    }
    const index = Uint16Array.from(resultMesh.index.array);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));

    let material = null;
    if (resultMesh.color) {
      const color = new THREE.Color(
        resultMesh.color[0],
        resultMesh.color[1],
        resultMesh.color[2]
      );
      material = new THREE.MeshPhongMaterial({ color: color });
    } else {
      material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    }

    const mesh = new THREE.Mesh(geometry, material);
    targetObject.add(mesh);
  }
  return targetObject;
};

export async function LoadStep(fileUrl) {
  // const occtimportWasm = await import('occt-import-js/dist/occt-import-js.wasm').then((res) => res.default)

  // console.log('occtimportWasm', occtimportWasm)
  const targetObject = new THREE.Object3D();

  // init occt-import-js
  const occt = await occtimportjs({
    locateFile: (name) => {
      console.log("name", name);
      // return occtimportWasm
      return wasmUrl;
    },
  });

  // download a step file
  // let fileUrl = '../test/testfiles/cax-if/as1_pe_203.stp';
  let response = await fetch(fileUrl);
  let buffer = await response.arrayBuffer();

  // read the imported step file
  let fileBuffer = new Uint8Array(buffer);
  let result = occt.ReadStepFile(fileBuffer);
  console.log("result", result);

  // process the geometries of the result
  for (let resultMesh of result.meshes) {
    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3)
    );
    if (resultMesh.attributes.normal) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3)
      );
    }
    const index = Uint16Array.from(resultMesh.index.array);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));

    let material = null;
    if (resultMesh.color) {
      const color = new THREE.Color(
        resultMesh.color[0],
        resultMesh.color[1],
        resultMesh.color[2]
      );
      material = new THREE.MeshPhongMaterial({ color: color });
    } else {
      material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    }

    const mesh = new THREE.Mesh(geometry, material);
    targetObject.add(mesh);
  }
  return targetObject;
}
