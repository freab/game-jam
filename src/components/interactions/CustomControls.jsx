"use client";

import { useThree } from "@react-three/fiber";
import { Vector3, Euler, Raycaster } from "three";
import useCameraStore from "../../store/cameraStore";
import { useEffect, useRef } from "react";

const CustomControls = ({ onCollision }) => {
  const { camera, gl, scene } = useThree();
  const { setIsDragging, setCameraPosition, setCameraRotation, isWalking } =
    useCameraStore();
  const controlsRef = useRef({
    isDragging: false,
    phi: 0,
    theta: 0,
    keys: {},
    animationId: null,
    raycaster: new Raycaster(),
    lastUpdate: 0,
    isAnimating: false,
    velocity: new Vector3(0, 0, 0),
    acceleration: 0.05,
    damping: 0.85,
    maxSpeed: 0.25,
    zoomLevel: 1,
    minZoom: 0.5,
    maxZoom: 2,
    zoomSensitivity: 0.05,
    lastRotationUpdate: 0,
    rotationSpeed: 0.003, // Adjust this to control rotation sensitivity
    cachedWallObjects: null,
    lastCacheUpdate: 0,
    pointerLocked: false,
    sensitivity: 0.0015 // Mouse sensitivity - slightly reduced for better control
  });

  // OPTIMIZED: Cache wall objects to avoid repeated scene traversal
  const getWallObjects = () => {
    const now = performance.now();

    // Update cache every 5 seconds or if not cached
    if (
      !controlsRef.current.cachedWallObjects ||
      now - controlsRef.current.lastCacheUpdate > 5000
    ) {
      const walls = [];
      scene.traverse((obj) => {
        if (obj.name && obj.name.toLowerCase().includes("wall")) {
          walls.push(obj);
        }
      });

      controlsRef.current.cachedWallObjects = walls;
      controlsRef.current.lastCacheUpdate = now;
    }

    return controlsRef.current.cachedWallObjects;
  };

  // IMPROVED: Better collision detection - no throttling, optimized raycasts
  const checkCollision = (direction, distance = 0.5) => {
    if (!scene) return false;

    const raycaster = controlsRef.current.raycaster;
    const origin = camera.position.clone();

    // Use 5 raycasts for thorough collision detection (center, sides, diagonals)
    // This ensures we don't clip through walls at angles
    const directions = [
      direction.clone(), // Center (most important)
      direction.clone().add(new Vector3(0.25, 0, 0)), // Right
      direction.clone().add(new Vector3(-0.25, 0, 0)), // Left
      direction.clone().add(new Vector3(0.15, 0, 0.15)), // Diagonal 1
      direction.clone().add(new Vector3(-0.15, 0, 0.15)) // Diagonal 2
    ];

    // Use cached wall objects instead of scene.children
    const wallObjects = getWallObjects();

    for (let dir of directions) {
      raycaster.set(origin, dir.normalize());

      // Only raycast against cached wall objects, not recursive
      const intersects = raycaster.intersectObjects(wallObjects, false);

      if (intersects.length > 0 && intersects[0].distance < distance) {
        return true; // Collision detected
      }
    }

    return false;
  };

  const getEventPosition = (event) => {
    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
    return { x: event.clientX, y: event.clientY };
  };

  const handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      controlsRef.current.touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        time: Date.now()
      };
    } else if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      controlsRef.current.pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (event) => {
    if (isWalking) return;

    if (event.touches.length === 1) {
      const touchEnd = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };

      const dx = touchEnd.x - controlsRef.current.touchStart.x;
      const dy = touchEnd.y - controlsRef.current.touchStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const time = Date.now() - controlsRef.current.touchStart.time;

      if (distance > 50 && time < 300) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            controlsRef.current.keys["d"] = true;
            setTimeout(() => {
              controlsRef.current.keys["d"] = false;
            }, 100);
          } else {
            controlsRef.current.keys["a"] = true;
            setTimeout(() => {
              controlsRef.current.keys["a"] = false;
            }, 100);
          }
        } else {
          if (dy > 0) {
            controlsRef.current.keys["s"] = true;
            setTimeout(() => {
              controlsRef.current.keys["s"] = false;
            }, 100);
          } else {
            controlsRef.current.keys["w"] = true;
            setTimeout(() => {
              controlsRef.current.keys["w"] = false;
            }, 100);
          }
        }
      }
    } else if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const pinchDelta = distance - controlsRef.current.pinchStartDistance;
      const zoomChange = pinchDelta * 0.005;

      controlsRef.current.zoomLevel += zoomChange;
      controlsRef.current.zoomLevel = Math.max(
        controlsRef.current.minZoom,
        Math.min(controlsRef.current.maxZoom, controlsRef.current.zoomLevel)
      );

      camera.zoom = controlsRef.current.zoomLevel;
      camera.updateProjectionMatrix();

      controlsRef.current.pinchStartDistance = distance;
    }
  };

  useEffect(() => {
    const euler = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
    controlsRef.current.phi = euler.x;
    controlsRef.current.theta = euler.y;

    const handlePointerLockChange = () => {
      controlsRef.current.pointerLocked =
        document.pointerLockElement === gl.domElement ||
        document.mozPointerLockElement === gl.domElement ||
        document.webkitPointerLockElement === gl.domElement;
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange, false);
    document.addEventListener("mozpointerlockchange", handlePointerLockChange, false);
    document.addEventListener("webkitpointerlockchange", handlePointerLockChange, false);

    const handlePointerDown = (event) => {
      if (isWalking) return;

      // Request pointer lock on click
      if (!controlsRef.current.pointerLocked) {
        gl.domElement.requestPointerLock = gl.domElement.requestPointerLock || 
          gl.domElement.mozRequestPointerLock || 
          gl.domElement.webkitRequestPointerLock;
        
        if (gl.domElement.requestPointerLock) {
          gl.domElement.requestPointerLock();
        }
      }
    };

    const handlePointerMove = (event) => {
      if (isWalking || !controlsRef.current.pointerLocked) return;

      const now = performance.now();
      if (now - controlsRef.current.lastUpdate < 16) return;
      controlsRef.current.lastUpdate = now;

      // Get movement deltas directly from the event
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      // Update rotation based on mouse movement
      controlsRef.current.theta -= movementX * controlsRef.current.sensitivity;
      controlsRef.current.phi -= movementY * controlsRef.current.sensitivity;

      // Limit vertical rotation to prevent over-rotation
      const maxPhi = Math.PI / 2 - 0.1;
      controlsRef.current.phi = Math.max(
        -maxPhi,
        Math.min(maxPhi, controlsRef.current.phi)
      );

      // Apply rotation to camera
      camera.rotation.order = "YXZ";
      camera.rotation.y = controlsRef.current.theta;
      camera.rotation.x = controlsRef.current.phi;
      camera.rotation.z = 0;

      // Update camera rotation in store
      if (now - controlsRef.current.lastRotationUpdate > 100) {
        setCameraRotation([
          camera.rotation.x,
          camera.rotation.y,
          camera.rotation.z
        ]);
        controlsRef.current.lastRotationUpdate = now;
      }
    };

    const handlePointerUp = () => {
      controlsRef.current.isDragging = false;
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    const animate = (timestamp) => {
      if (isWalking) {
        const euler = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
        controlsRef.current.phi = euler.x;
        controlsRef.current.theta = euler.y;

        if (
          Object.values(controlsRef.current.keys).some((pressed) => pressed)
        ) {
          controlsRef.current.animationId = requestAnimationFrame(animate);
        } else {
          controlsRef.current.animationId = null;
          controlsRef.current.isAnimating = false;
        }
        return;
      }

      if (!controlsRef.current.isAnimating) {
        controlsRef.current.isAnimating = true;

        const rotationSpeed = 0.005;
        let moved = false;

        const forward = new Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;

        if (forward.lengthSq() < 0.001) {
          forward.set(
            -Math.sin(controlsRef.current.theta),
            0,
            -Math.cos(controlsRef.current.theta)
          );
        } else {
          forward.normalize();
        }

        // Calculate right vector for strafing
        const right = new Vector3();
        right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

        const targetVelocity = new Vector3();

        // Forward/Backward movement (W/S)
        if (
          controlsRef.current.keys["w"] ||
          controlsRef.current.keys["ArrowUp"]
        ) {
          targetVelocity.addScaledVector(forward, 1);
        }
        if (
          controlsRef.current.keys["s"] ||
          controlsRef.current.keys["ArrowDown"]
        ) {
          targetVelocity.addScaledVector(forward, -1);
        }

        // Strafing movement (A/D)
        if (
          controlsRef.current.keys["a"] ||
          controlsRef.current.keys["ArrowLeft"]
        ) {
          targetVelocity.addScaledVector(right, -1);
        }
        if (
          controlsRef.current.keys["d"] ||
          controlsRef.current.keys["ArrowRight"]
        ) {
          targetVelocity.addScaledVector(right, 1);
        }

        // Normalize diagonal movement to prevent faster movement and apply acceleration
        if (targetVelocity.lengthSq() > 0) {
          targetVelocity.normalize().multiplyScalar(controlsRef.current.acceleration);
        }

        controlsRef.current.velocity.multiplyScalar(
          controlsRef.current.damping
        );
        controlsRef.current.velocity.add(targetVelocity);

        const speed = controlsRef.current.velocity.length();
        if (speed > controlsRef.current.maxSpeed) {
          controlsRef.current.velocity.multiplyScalar(
            controlsRef.current.maxSpeed / speed
          );
        }

        // NO THROTTLING on collision checks - check every frame for solid walls
        if (controlsRef.current.velocity.lengthSq() > 0.001) {
          const movementDirection = controlsRef.current.velocity
            .clone()
            .normalize();
          const checkDistance = controlsRef.current.velocity.length() + 0.4;

          const hasCollision = checkCollision(movementDirection, checkDistance);

          if (!hasCollision) {
            camera.position.add(controlsRef.current.velocity);
            moved = true;
          } else {
            if (onCollision) {
              onCollision();
            }
            // Stop completely on collision
            controlsRef.current.velocity.set(0, 0, 0);
          }
        }

        // Rotation controls (Q/E for vertical look, mouse for horizontal)
        if (controlsRef.current.keys["q"]) {
          controlsRef.current.phi += rotationSpeed;
          moved = true;
        }
        if (controlsRef.current.keys["e"]) {
          controlsRef.current.phi -= rotationSpeed;
          moved = true;
        }

        if (moved) {
          const maxPhi = Math.PI / 2 - 0.1;
          controlsRef.current.phi = Math.max(
            -maxPhi,
            Math.min(maxPhi, controlsRef.current.phi)
          );

          camera.rotation.order = "YXZ";
          camera.rotation.y = controlsRef.current.theta;
          camera.rotation.x = controlsRef.current.phi;
          camera.rotation.z = 0;

          const now = performance.now();
          if (now - controlsRef.current.lastUpdate > 100) {
            setCameraPosition([
              camera.position.x,
              camera.position.y,
              camera.position.z
            ]);
            setCameraRotation([
              camera.rotation.x,
              camera.rotation.y,
              camera.rotation.z
            ]);
            controlsRef.current.lastUpdate = now;
          }
        }

        controlsRef.current.isAnimating = false;
      }

      if (Object.values(controlsRef.current.keys).some((pressed) => pressed)) {
        controlsRef.current.animationId = requestAnimationFrame(animate);
      } else {
        controlsRef.current.animationId = null;
      }
    };

    const handleKeyDown = (event) => {
      if (isWalking) return;

      const key = event.key.toLowerCase();

      if (
        [
          "w",
          "a",
          "s",
          "d",
          "q",
          "e",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight"
        ].includes(event.key)
      ) {
        event.preventDefault();
      }

      controlsRef.current.keys[event.key] = true;
      controlsRef.current.keys[key] = true;

      if (!controlsRef.current.animationId) {
        controlsRef.current.animationId = requestAnimationFrame(animate);
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();

      controlsRef.current.keys[event.key] = false;
      controlsRef.current.keys[key] = false;

      if (
        !isWalking &&
        !Object.values(controlsRef.current.keys).some((pressed) => pressed)
      ) {
        const euler = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
        controlsRef.current.phi = euler.x;
        controlsRef.current.theta = euler.y;
      }
    };

    gl.domElement.addEventListener("mousedown", handlePointerDown);
    gl.domElement.addEventListener("touchstart", handleTouchStart);
    gl.domElement.addEventListener("mousemove", handlePointerMove);
    gl.domElement.addEventListener("touchmove", handleTouchMove);
    gl.domElement.addEventListener("mouseup", handlePointerUp);
    gl.domElement.addEventListener("touchend", handlePointerUp);
    gl.domElement.addEventListener("contextmenu", handleContextMenu);
    gl.domElement.addEventListener("mouseleave", handlePointerUp);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      if (controlsRef.current.animationId) {
        cancelAnimationFrame(controlsRef.current.animationId);
      }

      // Exit pointer lock when unmounting
      if (document.exitPointerLock) {
        document.exitPointerLock();
      } else if (document.mozExitPointerLock) {
        document.mozExitPointerLock();
      } else if (document.webkitExitPointerLock) {
        document.webkitExitPointerLock();
      }

      // Remove event listeners
      document.removeEventListener('pointerlockchange', handlePointerLockChange, false);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange, false);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange, false);
      
      gl.domElement.removeEventListener("mousedown", handlePointerDown);
      gl.domElement.removeEventListener("touchstart", handlePointerDown);
      gl.domElement.removeEventListener("mousemove", handlePointerMove);
      gl.domElement.removeEventListener("touchmove", handlePointerMove);
      gl.domElement.removeEventListener("mouseup", handlePointerUp);
      gl.domElement.removeEventListener("touchend", handlePointerUp);
      gl.domElement.removeEventListener("contextmenu", handleContextMenu);
      gl.domElement.removeEventListener("mouseleave", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [camera, gl, isWalking, scene]);

  // Cursor management is now handled by CSS in index.css

  return null;
};

export default CustomControls;
