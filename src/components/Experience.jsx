import { OrbitControls } from "@react-three/drei";
import PC from "./PC";
import PCScreen from "./screen";
import PCCamera from "./PCCamera";
import { Environment } from "@react-three/drei";
export const Experience = () => {
  return (
    <>
      {/* <OrbitControls /> */}
      <Environment preset="dawn"/>
      {/* <mesh>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh> */}
      <PC />
      <PCScreen />
      <PCCamera />   
    </>
  );
};
