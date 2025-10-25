import { OrbitControls } from "@react-three/drei";
import PCScreen from "./screen";
import PCCamera from "./PCCamera";
import { Environment } from "@react-three/drei";
import Room from "./Room";
export const Experience = () => {
  return (
    <>
      <OrbitControls />
      <Environment preset="dawn"/>
      {/* <mesh>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh> */}
      <Room />
      <PCScreen />
      <PCCamera />   
    </>
  );
};
