import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import occtimportjs from "occt-import-js";
import initOpenCascade from 'opencascade.js';
import openCascadeHelper from "./openCascadeHelper";

import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Color,
  Geometry,
  Mesh,
  MeshStandardMaterial,
} from 'three';


let openCascadeInstance;

export const initializeOpenCascade = async () => {
    if (!openCascadeInstance) {
        openCascadeInstance = await initOpenCascade();
    }
    return openCascadeInstance;
};
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

export const readAndParseStepArrayBuffer = async (openCascade, stepArrayBuffer, filename = "file.step") => {
  // const occt = await occtimportjs({
  //   locateFile: (name) => {
  //     console.log("name", name);
  //     return wasmUrl;
  //   },
  // });
  // const occt = await initializeOpenCascade().then(openCascade => {
  //   console.log("openCascade");
  //   console.log(openCascade);
  //   // var reader = new openCascade.STEPControl_Reader_1();
  //   // occt.FS_createDataFile(".", "file.step", uint8Array, true, true);
  //   return openCascade;
  // });
  // const openCascade = await initOpenCascade();
  const FS = openCascade.FS || openCascade.Module.FS;
  if (!FS) {
      throw new Error("Emscripten FS API not found in the OpenCascade.js instance.");
  }
  let fileBuffer = new Uint8Array(stepArrayBuffer);
  // openCascade.FS_createDataFile(".", filename, stepArrayBuffer, true, true);
  FS.writeFile(filename, fileBuffer);
  // const reader = new openCascade.STEPControl_Reader();
  const reader = new openCascade.STEPControl_Reader_1();


  const status = reader.ReadFile(filename);
  let stepShape;
  if (status == openCascade.IFSelect_ReturnStatus.IFSelect_RetDone) {
    console.log("file loaded successfully!     Converting to OCC now...");
    const numRootsTransferred = reader.TransferRoots(new openCascade.Message_ProgressRange_1());    // Translate all transferable roots to OpenCascade
    stepShape = reader.OneShape();         // Obtain the results of translation in one OCCT shape
    console.log("stepShape ", stepShape);
    console.log(filename.name + " converted successfully!  Triangulating now...");

    // Out with the old, in with the new!
    // scene.remove(scene.getObjectByName("shape"));
    // await addFunction(openCascade, stepShape, scene);
    // console.log(inputFile.name + " triangulated and added to the scene!");
  } else {
    throw new Error(`Failed to read STEP file: ${status}`);
  }

  // 5. Transfer the STEP data to a TopoDS_Shape
  // const shape = new openCascade.TopoDS_Shape();
  // if (reader.TransferRoot(1)) {
  //     shape.assign(reader.OneShape());
  // } else {
  //     throw new Error("Failed to transfer STEP data to shape.");
  // }

  // 6. Optionally clean up the virtual file
  FS.unlink(filename);
  // console.log("shape");
  // console.log(shape);
  // let stepModel = occt.ReadStepFile(fileBuffer);
  // return stepModel;
  // return shape;
  return stepShape;
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


export function extractMeshData(openCascade, shape) {
  const meshData = { vertices: [], faces: [] };

  // Initialize a BRepMesh_IncrementalMesh to triangulate the shape
  // const mesh = new openCascade.BRepMesh_IncrementalMesh_1(shape, 0.1, false, 0.5, true);
  // const mesh = new openCascade.BRepMesh_IncrementalMesh_1(shape, 0.1, false, 0.5, true);
  // console.log(Object.keys(openCascade.BRepMesh_IncrementalMesh));
  // console.log(Object.keys(openCascade));
  // console.log(Object.keys(openCascade.BRepTools));
// console.log(Object.keys(openCascade.BRepMesh));

  const mesh = new openCascade.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, true);
  // const mesh = new openCascade.BRepMesh_IncrementalMesh_1();
  // mesh.ini
  // mesh.
  // Use TopExp_Explorer to iterate through faces
  const explorer = new openCascade.TopExp_Explorer_1();
  explorer.Init(shape, openCascade.TopAbs_ShapeEnum.TopAbs_FACE, openCascade.TopAbs_ShapeEnum.TopAbs_SHAPE);
  while (explorer.More()) {
      const face = openCascade.TopoDS.Face_1(explorer.Current());

      // Get the triangulation for the face
      const location = new openCascade.TopLoc_Location_1();
      const triangulation = openCascade.BRep_Tool.Triangulation(face, location, 0);
      // if (myT.IsNull()) {
      //   continue;
      // }
      // const triangulation = myT.get();
      // const triangulation = openCascade.BRep_Tool.Triangulation(face, location, 0);

      if (triangulation.IsNull()) {
          explorer.Next();
          continue;
      }

      const myTriangulation = triangulation.get();
      const nodes = myTriangulation.NbNodes();
      const triangles = myTriangulation.NbTriangles();

      // Extract vertices
      for (let i = 1; i <= nodes.length; i++) {
          const point = nodes.Value(i);
          meshData.vertices.push([point.X(), point.Y(), point.Z()]);
      }

      // Extract faces (triangle indices)
      for (let i = 1; i <= triangles.length; i++) {
          const triangle = triangles.Value(i).Get();
          meshData.faces.push([triangle[0] - 1, triangle[1] - 1, triangle[2] - 1]);
      }

      explorer.Next();
  }
  console.log("meshData ", meshData);
  return meshData;
}


export function extractGeometries(openCascade, shape) {
  let geometries = []
  const ExpFace = new openCascade.TopExp_Explorer_1();
  for (ExpFace.Init(shape, openCascade.TopAbs_ShapeEnum.TopAbs_FACE, openCascade.TopAbs_ShapeEnum.TopAbs_SHAPE); ExpFace.More(); ExpFace.Next()) {
    const myShape = ExpFace.Current();
    const myFace = openCascade.TopoDS.Face_1(myShape);
    let inc;
    try {
      //in case some of the faces can not been visualized
      inc = new openCascade.BRepMesh_IncrementalMesh_2(myFace, 0.1, false, 0.5, false);
    } catch (e) {
      console.error('face visualizi<ng failed');
      continue;
    }

    const aLocation = new openCascade.TopLoc_Location_1();
    const myT = openCascade.BRep_Tool.Triangulation(myFace, aLocation, 0 /* == Poly_MeshPurpose_NONE */);
    if (myT.IsNull()) {
      continue;
    }

    const pc = new openCascade.Poly_Connect_2(myT);
    const triangulation = myT.get();

    let vertices = new Float32Array(triangulation.NbNodes() * 3);

    // write vertex buffer
    for (let i = 1; i <= triangulation.NbNodes(); i++) {
      const t1 = aLocation.Transformation();
      const p = triangulation.Node(i);
      const p1 = p.Transformed(t1);
      vertices[3 * (i - 1)] = p1.X();
      vertices[3 * (i - 1) + 1] = p1.Y();
      vertices[3 * (i - 1) + 2] = p1.Z();
      p.delete();
      t1.delete();
      p1.delete();
    }

    // write normal buffer
    const myNormal = new openCascade.TColgp_Array1OfDir_2(1, triangulation.NbNodes());
    openCascade.StdPrs_ToolTriangulatedShape.Normal(myFace, pc, myNormal);

    let normals = new Float32Array(myNormal.Length() * 3);
    for (let i = myNormal.Lower(); i <= myNormal.Upper(); i++) {
      const t1 = aLocation.Transformation();
      const d1 = myNormal.Value(i);
      const d = d1.Transformed(t1);

      normals[3 * (i - 1)] = d.X();
      normals[3 * (i - 1) + 1] = d.Y();
      normals[3 * (i - 1) + 2] = d.Z();

      t1.delete();
      d1.delete();
      d.delete();
    }

    myNormal.delete();

    // write triangle buffer
    const orient = myFace.Orientation_1();
    const triangles = myT.get().Triangles();
    let indices;
    let triLength = triangles.Length() * 3;
    if (triLength > 65535)
      indices = new Uint32Array(triLength);
    else
      indices = new Uint16Array(triLength);

    for (let nt = 1; nt <= myT.get().NbTriangles(); nt++) {
      const t = triangles.Value(nt);
      let n1 = t.Value(1);
      let n2 = t.Value(2);
      let n3 = t.Value(3);
      if (orient !== openCascade.TopAbs_Orientation.TopAbs_FORWARD) {
        let tmp = n1;
        n1 = n2;
        n2 = tmp;
      }

      indices[3 * (nt - 1)] = n1 - 1;
      indices[3 * (nt - 1) + 1] = n2 - 1;
      indices[3 * (nt - 1) + 2] = n3 - 1;
      t.delete();
    }
    triangles.delete();

    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometries.push(geometry);

    pc.delete();
    aLocation.delete();
    myT.delete();
    inc.delete();
    myFace.delete();
    myShape.delete();
  }
  ExpFace.delete();
  return geometries;
}


const getObjectFromShape = async (openCascade, shape) => {
  openCascadeHelper.setOpenCascade(openCascade);
  const facelist = await openCascadeHelper.tessellate(shape);
  const [locVertexcoord, locNormalcoord, locTriIndices] = await openCascadeHelper.joinPrimitives(facelist);
  const tot_triangle_count = facelist.reduce((a, b) => a + b.number_of_triangles, 0);
  const [vertices, faces] = await openCascadeHelper.generateGeometry(tot_triangle_count, locVertexcoord, locNormalcoord, locTriIndices);

  const objectMat = new MeshStandardMaterial({
    color: new Color(0.9, 0.9, 0.9)
  });
  const geometry = new Geometry();
  geometry.vertices = vertices;
  geometry.faces = faces;
  const object = new Mesh(geometry, objectMat);
  object.name = "shape";
  object.rotation.x = -Math.PI / 2;
  return object
}
export { getObjectFromShape };
