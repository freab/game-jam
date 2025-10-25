import React, { useRef, Suspense } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { Terminal } from './Terminal';

export function PCScreen(props) {
  const { nodes, materials } = useGLTF('/pc screen.glb');
  
  // Calculate the screen dimensions based on the mesh size
  const screenWidth = 1.5; // Adjust based on your screen mesh size
  const screenHeight = 1;  // Adjust based on your screen mesh size

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Screen_Screen1_0.geometry}
        material={materials.Screen1}
        position={[2.96, 5.608, -12.622]}
        rotation={[Math.PI, 0, Math.PI]}
        scale={1.884}
      >
        <Html
          transform
          wrapperClass="screen-html"
          distanceFactor={0.5}
          position={[0.01, 0, 0.01]}
          rotation={[0, -Math.PI,0]}
          style={{
            width: `${screenWidth * 1075}px`,
            height: `${screenHeight * 1120}px`,
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
        >
          <Suspense fallback={<div>Loading terminal...</div>}>
            <Terminal />
          </Suspense>
        </Html>
      </mesh>
    </group>
  );
}

useGLTF.preload('/pc screen.glb');
export default PCScreen;