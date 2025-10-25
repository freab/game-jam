import React, { useRef, Suspense } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { Terminal } from "./Terminal";
import useCameraStore from "../store/cameraStore";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";

const getShortestRotation = (current, target) => {
  let diff = target - current;
  diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;

  if (Math.abs(diff) > Math.PI - 1e-6) {
    if (diff > 0) {
      diff = -(2 * Math.PI - diff);
    } else {
      diff = 2 * Math.PI + diff;
    }
  }

  return diff;
};

const eulerToQuaternion = (x, y, z, order = "XYZ") => {
  const euler = new THREE.Euler(x, y, z, order);
  return new THREE.Quaternion().setFromEuler(euler);
};

const calculateAnimationDuration = (
  currentPos,
  targetPos,
  currentRot,
  targetRot
) => {
  const distance = Math.sqrt(
    Math.pow(targetPos.x - currentPos.x, 2) +
      Math.pow(targetPos.y - currentPos.y, 2) +
      Math.pow(targetPos.z - currentPos.z, 2)
  );

  const rotDiff =
    Math.abs(targetRot.y - currentRot.y) +
    Math.abs(targetRot.x - currentRot.x) +
    Math.abs(targetRot.z - currentRot.z);

  const baseDuration = 1.2;
  const distanceFactor = Math.min(distance / 10, 1.5);
  const rotationFactor = Math.min(rotDiff / Math.PI, 1.3);

  return baseDuration + distanceFactor * 0.8 + rotationFactor * 0.6;
};

const animateCameraWithQuaternion = (
  camera,
  targetPosition,
  targetRotation,
  baseDuration,
  onComplete
) => {
  const startPosition = camera.position.clone();
  const startQuaternion = camera.quaternion.clone();
  const targetQuaternion = eulerToQuaternion(
    targetRotation.x,
    targetRotation.y,
    targetRotation.z
  );

  const duration = calculateAnimationDuration(
    startPosition,
    targetPosition,
    camera.rotation,
    targetRotation
  );

  const distance = startPosition.distanceTo(
    new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
  );
  const shouldUseArcPath = distance > 5;

  let intermediatePosition = null;
  if (shouldUseArcPath) {
    const midPoint = new THREE.Vector3().lerpVectors(
      startPosition,
      new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
      0.5
    );
    midPoint.y += Math.min(distance * 0.1, 2);
    intermediatePosition = midPoint;
  }

  const animationData = {
    progress: 0
  };

  const tl = gsap.timeline({
    onComplete: () => {
      camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
      camera.quaternion.copy(targetQuaternion);
      if (onComplete) onComplete();
    }
  });

  tl.to(animationData, {
    progress: 1,
    duration: duration,
    ease: "power3.inOut",
    onUpdate: () => {
      const progress = animationData.progress;

      if (shouldUseArcPath) {
        const t = progress;
        const invT = 1 - t;

        const currentPos = new THREE.Vector3(
          invT * invT * startPosition.x +
            2 * invT * t * intermediatePosition.x +
            t * t * targetPosition.x,
          invT * invT * startPosition.y +
            2 * invT * t * intermediatePosition.y +
            t * t * targetPosition.y,
          invT * invT * startPosition.z +
            2 * invT * t * intermediatePosition.z +
            t * t * targetPosition.z
        );

        camera.position.copy(currentPos);
      } else {
        camera.position.lerpVectors(
          startPosition,
          new THREE.Vector3(
            targetPosition.x,
            targetPosition.y,
            targetPosition.z
          ),
          progress
        );
      }

      camera.quaternion.slerpQuaternions(
        startQuaternion,
        targetQuaternion,
        progress
      );
    }
  });
};

export function PCScreen(props) {
  const { nodes, materials } = useGLTF("/pc screen.glb");
  const { camera } = useThree();
  const {
    setCameraPosition,
    setCameraRotation,
    setIsWalking,
    setActiveCamera,
    isWalking,
    setTargetCameraPosition,
    setTargetCameraRotation
  } = useCameraStore();

  // Calculate the screen dimensions based on the mesh size
  const screenWidth = 1.5; // Adjust based on your screen mesh size
  const screenHeight = 1; // Adjust based on your screen mesh size

  const handleScreenClick = () => {
    setActiveCamera(null);

    const targetPosition = new THREE.Vector3(0, 0, 0); // Set the target position for the PC camera
    const targetRotation = new THREE.Euler(0, 0, 0); // Set the target rotation for the PC camera

    animateCameraWithQuaternion(
      camera,
      targetPosition,
      targetRotation,
      1.2,
      () => {
        setCameraPosition([
          targetPosition.x,
          targetPosition.y,
          targetPosition.z
        ]);
        setCameraRotation([
          targetRotation.x,
          targetRotation.y,
          targetRotation.z
        ]);
        setIsWalking(false);
      }
    );
  };

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Screen_Screen1_0.geometry}
        material={materials.Screen1}
        position={[2.96, 5.608, -12.422]}
        rotation={[Math.PI, 0, Math.PI]}
        scale={1.884}
      >
        <Html
          transform
          wrapperClass="screen-html"
          distanceFactor={0.5}
          position={[0.07, -0.02, -0.14]}
          rotation={[0, -Math.PI, 0]}
          style={{
            width: `${screenWidth * 1090}px`,
            height: `${screenHeight * 1150}px`,
            overflow: "hidden",
            pointerEvents: "auto"
          }}
          onClick={handleScreenClick}
        >
          <Suspense fallback={<div>Loading terminal...</div>}>
            <Terminal />
          </Suspense>
        </Html>
      </mesh>
    </group>
  );
}

useGLTF.preload("/pc screen.glb");
export default PCScreen;
