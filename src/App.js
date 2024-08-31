import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

import { LoadStep } from './StepLoader'
import { OrbitControls } from '@react-three/drei'

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x += delta))
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

function StepModel({ url, ...props }) {
  const [obj, setObj] = useState(null)
  useEffect(() => {
    async function load() {
      // const mainObject = LoadStep('https://github.com/kovacsv/occt-import-js/raw/main/test/testfiles/cax-if/as1_pe_203.stp')
      const mainObject = await LoadStep('/as1_pe_203.stp')
      // const mainObject = await LoadStep(url)
      console.log('mainObject', mainObject)
      setObj(mainObject)
    }
    load()
  }, [])
  if (!obj) {
    return null
  }
  return (
    <group {...props}>
      <primitive object={obj} />
    </group>
  )
}

export default function App() {
  return (
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      {/* <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} /> */}
      <StepModel
        scale={[0.1, 0.1, 0.1]}
        // url="/Gripper01.stp"
        url="/17HM08-1204S.STEP"
      />
    </Canvas>
  )
}
