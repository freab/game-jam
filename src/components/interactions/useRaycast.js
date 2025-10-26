"use client";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import useCameraStore from "../../store/cameraStore";

export function useRaycast() {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const { setIsWalking } = useCameraStore();

  // Cache interactive objects to avoid repeated scene traversal
  const cachedObjects = useRef({
    walls: [],
    interactive: [], // floor, posters, etc.
    lastUpdate: 0
  });

  // Throttling refs
  const throttleRefs = useRef({
    lastMouseMove: 0,
    mouseMoveInterval: 50, // Only update every 50ms
    lastForwardCheck: 0,
    forwardCheckInterval: 100 // Only check forward every 100ms
  });

  // OPTIMIZED: Cache objects by type to avoid scene traversal on every raycast
  const updateObjectCache = useCallback(() => {
    const now = performance.now();

    // Only update cache every 5 seconds
    if (now - cachedObjects.current.lastUpdate < 5000) {
      return;
    }

    const walls = [];
    const interactive = [];

    scene.traverse((obj) => {
      if (!obj.name) return;

      const nameLower = obj.name.toLowerCase();

      if (nameLower.includes("wall")) {
        walls.push(obj);
      } else if (
        nameLower.includes("floor") ||
        nameLower.includes("intro_poster") ||
        nameLower.includes("mp") ||
        nameLower.includes("mfp") ||
        nameLower.includes("vinyl") ||
        nameLower.includes("telephone") ||
        nameLower.includes("pc") ||
        nameLower.includes("paper") ||
        nameLower.includes("art") ||
        nameLower.includes("canvas") ||
        nameLower.includes("key") ||
        nameLower.includes("piano") ||
        nameLower.includes("clock")
      ) {
        interactive.push(obj);
      }
    });

    cachedObjects.current.walls = walls;
    cachedObjects.current.interactive = interactive;
    cachedObjects.current.lastUpdate = now;
  }, [scene]);

  // OPTIMIZED: Throttled forward obstruction check with cached objects
  const checkForwardObstruction = useCallback(() => {
    const now = performance.now();

    // Throttle to every 100ms
    if (
      now - throttleRefs.current.lastForwardCheck <
      throttleRefs.current.forwardCheckInterval
    ) {
      return false;
    }

    throttleRefs.current.lastForwardCheck = now;

    // Update cache if needed
    updateObjectCache();

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Reuse the same raycaster instance
    raycaster.current.set(camera.position, cameraDirection);

    // Only check against cached wall objects
    const intersects = raycaster.current.intersectObjects(
      cachedObjects.current.walls,
      false // Don't recurse since we already have the objects
    );

    // Early exit if no intersections
    if (intersects.length === 0) return false;

    // Check first intersection only (it's the closest)
    return intersects[0].distance < 2;
  }, [camera, updateObjectCache]);

  // OPTIMIZED: Combined click check to avoid duplicate raycasts
  const checkClick = useCallback(
    (event) => {
      // Update cache if needed
      updateObjectCache();

      // Calculate mouse position in normalized device coordinates
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the raycaster with the camera and mouse position
      raycaster.current.setFromCamera(mouse.current, camera);

      // Check walls first (most common case)
      const wallIntersects = raycaster.current.intersectObjects(
        cachedObjects.current.walls,
        false
      );

      if (wallIntersects.length > 0) {
        return { type: "wall", intersection: wallIntersects[0] };
      }

      // Then check interactive objects
      const interactiveIntersects = raycaster.current.intersectObjects(
        cachedObjects.current.interactive,
        false
      );

      if (interactiveIntersects.length > 0) {
        return { type: "interactive", intersection: interactiveIntersects[0] };
      }

      return { type: "none", intersection: null };
    },
    [camera, updateObjectCache]
  );

  useEffect(() => {
    // Initial cache update
    updateObjectCache();

    // OPTIMIZED: Throttled mouse move handler
    const handleMouseMove = (event) => {
      const now = performance.now();

      // Throttle to every 50ms
      if (
        now - throttleRefs.current.lastMouseMove <
        throttleRefs.current.mouseMoveInterval
      ) {
        return;
      }

      throttleRefs.current.lastMouseMove = now;

      // Calculate mouse position
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      // Check walls first (fast path)
      const wallIntersects = raycaster.current.intersectObjects(
        cachedObjects.current.walls,
        false
      );

      if (wallIntersects.length > 0) {
        document.body.style.cursor = "default";
        return;
      }

      // Then check interactive objects
      const interactiveIntersects = raycaster.current.intersectObjects(
        cachedObjects.current.interactive,
        false
      );

      if (interactiveIntersects.length > 0) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    };

    // OPTIMIZED: Click handler using combined check
    const handleClick = (event) => {
      const clickResult = checkClick(event);

      if (clickResult.type === "wall") {
        // Prevent any walk animation
        event.stopPropagation();
        event.preventDefault();
        setIsWalking(false);
        return false;
      }

      if (clickResult.type === "interactive") {
        // Allow the click to proceed normally for interactive objects
        return;
      }

      // For anything else (type === "none"), prevent action
      if (clickResult.type === "none") {
        event.stopPropagation();
        event.preventDefault();
        setIsWalking(false);
        return false;
      }
    };

    // Add event listeners with passive flag for better performance
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);

      // Reset cursor on cleanup
      document.body.style.cursor = "default";
    };
  }, [camera, scene, checkClick, setIsWalking, updateObjectCache]);

  return { checkForwardObstruction };
}
