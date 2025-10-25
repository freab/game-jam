import { create } from "zustand";

const useCameraStore = create((set) => ({
  cameraPosition: [0, 0, 0],
  cameraRotation: [0, 0, 0],
  targetCameraPosition: [0, 0, 0],
  targetCameraRotation: [0, 0, 0],
  activeCamera: null,
  isWalking: false,
  isDragging: false,
  setCameraPosition: (position) => set({ cameraPosition: position }),
  setCameraRotation: (rotation) => set({ cameraRotation: rotation }),
  setTargetCameraPosition: (position) =>
    set({ targetCameraPosition: position }),
  setTargetCameraRotation: (rotation) =>
    set({ targetCameraRotation: rotation }),
  setActiveCamera: (camera) => set({ activeCamera: camera }),
  setIsWalking: (walking) => set({ isWalking: walking }),
  setIsDragging: (dragging) => set({ isDragging: dragging })
}));

export default useCameraStore;
