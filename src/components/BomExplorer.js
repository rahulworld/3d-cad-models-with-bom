import * as THREE from "three";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import initOpenCascade from 'opencascade.js';

import { Float, OrbitControls } from "@react-three/drei";
import { extractGeometries, extractMeshData, getObjectFromShape, getUpdatedStepModel, initializeOpenCascade, readAndParseStepArrayBuffer } from "./StepLoader";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import SpinnerLoader from "./SpinnerLoader";
import SideBar from "./SideBar";
import { Form, InputGroup } from "react-bootstrap";

const StepModelExplorer = () => {
  const mountRef = useRef(null);
  const [stepModelObj, setStepModelObj] = useState(null);
  const [rawModel, setRowModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [uncheckedMeshes, setUncheckedMeshes] = useState([]);
  const [scaleVector, setScaleVector] = useState([0.1, 0.1, 0.1]);

  const handleStepFileUploadChange = async (e) => {
    // const openCascade = await initializeOpenCascade();
    const openCascade = await initOpenCascade();
    setIsModelLoading(true);
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(e.target.files[0]);
    fileReader.onload = (e) => {
      readAndParseStepArrayBuffer(openCascade, e.target.result).then(async (parsedStepModel) => {
        const objectShape = await getObjectFromShape(openCascade, parsedStepModel);
        setRowModel(objectShape);
      });
    };
  };

  //LOAD FROM PULIC URL
  //   const loadStepModelMemory = async () => {
  //     readStepModel(url).then((loadedModel) => {
  //       setRowModel(loadedModel);
  //     });
  //   };

  const resetModel = useCallback(() => {
    console.log('HEREER 00000');
    if (rawModel && rawModel.geometry.faces.length > 0) {
      // getUpdatedStepModel(rawModel).then((transformedStepModel) => {
      //   setStepModelObj(transformedStepModel);
      //   setIsModelLoading(false);
      // });
      console.log('HEREER 111111');
      const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // // Convert meshData to BufferGeometry
    // const geometry = new THREE.BufferGeometry();

    // const vertices = new Float32Array(rawModel.vertices.flat());
    // const indices = new Uint32Array(rawModel.faces.flat());

    // geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    // geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // const material = new THREE.MeshStandardMaterial({ color: 0x0077be, side: THREE.DoubleSide });
    // const mesh = new THREE.Mesh(geometry, material);
    // console.log("THREE.Mesh ", rawModel);

    scene.add(rawModel);

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(20, 20, 20).normalize();
    scene.add(light);

    camera.position.z = 20;

    const animate = () => {
        // requestAnimationFrame(animate);
        // rawModel.rotation.y += 0.01; // Rotate for better visualization
        renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
        mountRef.current.removeChild(renderer.domElement);
    };


    }
  }, [rawModel]);

  const updateModel = useCallback(() => {
    const targetObject = new THREE.Object3D();

    for (let [currentIndex, resultMesh] of rawModel.meshes.entries()) {
      if (!uncheckedMeshes.includes(currentIndex)) {
        let geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            resultMesh.attributes.position.array,
            3
          )
        );
        if (resultMesh.attributes.normal) {
          geometry.setAttribute(
            "normal",
            new THREE.Float32BufferAttribute(
              resultMesh.attributes.normal.array,
              3
            )
          );
        }
        const index = Uint16Array.from(resultMesh.index.array);
        geometry.setIndex(new THREE.BufferAttribute(index, 1));

        let material = null;
        if (currentIndex === hoveredIndex) {
          material = new THREE.MeshPhongMaterial({ color: 0x74789d });
        } else if (resultMesh.color) {
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
    }
    setStepModelObj(targetObject);
  }, [rawModel, hoveredIndex, uncheckedMeshes, scaleVector]);

  useEffect(() => {
    resetModel();
  }, [rawModel, resetModel]);

  useEffect(() => {
    if (hoveredIndex > -1 || uncheckedMeshes.length > 0) {
      updateModel();
    }
  }, [hoveredIndex, uncheckedMeshes, updateModel, scaleVector]);

  const onClickReset = () => {
    setHoveredIndex(-1);
    setUncheckedMeshes([]);
    resetModel();
  };

  const onChangeText = (index, value) => {
    let tempScale = [...scaleVector];
    tempScale[index] = parseFloat(value) > 0 ? parseFloat(value) : value;
    setScaleVector(tempScale);
  };

  if (!rawModel && !isModelLoading) {
    return (
      <Container fluid>
        <Row className="vh-100">
          <Col
            lg={5}
            className="justify-center items-center"
            style={{ height: "100%", margin: "auto" }}
          >
            <div style={{ height: "30%", width: 100 }}></div>
            <p
              className="fs-3 text-center"
              style={{
                fontSize: 30,
                fontFamily: "bold",
                marginBottom: 100,
                fontFamily: "monospace",
              }}
            >
              3D Cad model viewer & interact with BOM
            </p>
            <label htmlFor="formFileLg" className="form-label">
              Upload Step/Stp file
            </label>
            <input
              className="form-control form-control-lg"
              id="formFileLg"
              onChange={handleStepFileUploadChange}
              type="file"
            ></input>
          </Col>
        </Row>
      </Container>
    );
  }

  if (isModelLoading) {
    return (
      <Container fluid>
        <div ref={mountRef} />
        <Row className="vh-100">
          <Col
            lg={12}
            className="justify-center items-center"
            style={{ height: "100%" }}
          >
            <div style={{ height: "40%", width: 100 }}></div>
            <SpinnerLoader />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      <div ref={mountRef} />
      <Row key={"body_row"} className="vh-100">
        <Col
          key={"SideBarCol"}
          lg={3}
          className="vh-100"
          style={{ overflow: "scroll" }}
        >
          <SideBar
            key={"SideBar"}
            rawModel={rawModel}
            uncheckedMeshes={uncheckedMeshes}
            setUncheckedMeshes={(arr) => {
              setUncheckedMeshes(arr);
            }}
            onClickReset={onClickReset}
            setHoveredIndex={(index) => setHoveredIndex(index)}
            hoveredIndex={hoveredIndex}
          />
        </Col>
        <Col key={3} lg={9} className="bg-white vh-100">
          <Row className="h-40">
            <Col style={{ margin: 8 }}>
              <InputGroup size="sm" className="mb-3">
                <InputGroup.Text id="inputGroup-sizing-lg">
                  3D Scale Vector - X :
                </InputGroup.Text>
                <input
                  className="form-control"
                  type="text"
                  value={scaleVector[0]}
                  onChange={(e) => {
                    onChangeText(0, e.target.value);
                  }}
                />
              </InputGroup>
            </Col>
            <Col style={{ margin: 8 }}>
              <InputGroup size="sm" className="mb-3">
                <InputGroup.Text id="inputGroup-sizing-lg">
                  3D Scale Vector - Y :
                </InputGroup.Text>
                <input
                  className="form-control"
                  type="text"
                  value={scaleVector[1]}
                  onChange={(e) => {
                    onChangeText(1, e.target.value);
                  }}
                />
              </InputGroup>
            </Col>
            <Col style={{ margin: 8 }}>
              <InputGroup size="sm" className="mb-3">
                <InputGroup.Text id="inputGroup-sizing-lg">
                  3D Scale Vector - Z :
                </InputGroup.Text>
                <input
                  className="form-control"
                  type="text"
                  value={scaleVector[2]}
                  onChange={(e) => {
                    onChangeText(2, e.target.value);
                  }}
                />
              </InputGroup>
            </Col>
          </Row>
          <Row className="vh-100">
            {isModelLoading ? (
              <SpinnerLoader />
            ) : (
              <div ref={mountRef} />
              // {<Canvas shadows camera={{ position: [50, 50, 50], fov: 50 }}>
              //   <OrbitControls />
              //   <ambientLight intensity={0.5} />
              //   <directionalLight intensity={0.5} />
              //   <Suspense fallback={null}>
              //     <group
              //       {...{
              //         scale: [
              //           scaleVector[0] ? scaleVector[0] : 0.1,
              //           scaleVector[1] ? scaleVector[1] : 0.1,
              //           scaleVector[2] ? scaleVector[2] : 0.1,
              //         ],
              //       }}
              //     >
              //       <primitive object={stepModelObj} />
              //     </group>
              //   </Suspense>
              //   {/* <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} /> */}
              //   {/* <pointLight position={[-10, -10, -10]} /> */}
              // </Canvas>}
            )}
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

const BomExplorer = () => {
  return (
    <StepModelExplorer
      key={"StepModelExplorer"}
      //   scale={scaleVector}
      //   setScaleVector={(vector) => setScaleVector(vector)}
      //   url="/Gripper01.stp"
      //   scale={[0.01, 0.01, 0.01]}
      //   url="/as1_pe_204.stp"
      //   scale={[0.01, 0.01, 0.01]}
      //   url="/Motor4.stp"
      //   url="/17HM08-1204S.STEP"
      // url="/gimbaltopplate.stp"
    />
  );
};

export default BomExplorer;
