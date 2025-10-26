import React, { useState, useEffect } from 'react';

const Crosshair = () => {
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = 
        document.pointerLockElement !== null ||
        document.mozPointerLockElement !== null ||
        document.webkitPointerLockElement !== null;
      setIsPointerLocked(isLocked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
    };
  }, []);

  return (
    <div className={`crosshair ${!isPointerLocked ? 'hidden' : ''}`}>
      <div className="crosshair-inner">
        <div className="crosshair-line crosshair-horizontal"></div>
        <div className="crosshair-line crosshair-vertical"></div>
        <div className="crosshair-dot"></div>
      </div>
    </div>
  );
};

export default Crosshair;
