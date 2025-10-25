import { OrbitControls } from "@react-three/drei";
import PCScreen from "./screen";
import PCCamera from "./PCCamera";
import { Environment } from "@react-three/drei";
import Room from "./Room";
import Wall from "./wall";
import MainCamera from "./MainCamera";
import Floor from "./floor";
import Roof from "./roof";
export const Experience = () => {
  return (
    <>
      {/* <OrbitControls /> */}
      <Environment preset="dawn" environmentIntensity={0.3} />
      {/* <mesh>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh> */}
      <Room />
      <PCScreen />
      <PCCamera />
      <Wall />
      <MainCamera />
      <Floor />
      <Roof />
    </>
  );
};
