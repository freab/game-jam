import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { Loader, OrbitControls, Preload } from "@react-three/drei";
import { Suspense } from "react";
import Crosshair from "./components/ui/Crosshair";

function App() {
  return (
    <div className="w-full h-full">
      <Loader />
      <Crosshair />
      <Canvas shadows>
        <color attach="background" args={["#ececec"]} />
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
