import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore, SCENES } from '@/stores/useScrollStore';

// Camera positions for each scene
const CAMERA_POSITIONS = [
  { position: [0, 0, 8], target: [0, 0, 0] },      // Hero
  { position: [4, 2, 6], target: [0, 0, 0] },      // Feature 1
  { position: [-3, -1, 5], target: [0, 0, 0] },    // Feature 2
  { position: [0, 3, 4], target: [0, 0, 0] },      // Feature 3
  { position: [0, 0, 6], target: [0, 0, 0] },      // CTA
];

const easeInOutCubic = (t: number) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const CameraController = () => {
  const { camera } = useThree();
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const targetPosition = useRef(new THREE.Vector3(0, 0, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    // Find current scene and interpolation progress
    let sceneIndex = 0;
    let localProgress = 0;

    for (let i = 0; i < SCENES.length; i++) {
      if (scrollProgress >= SCENES[i].start && scrollProgress < SCENES[i].end) {
        sceneIndex = i;
        localProgress = (scrollProgress - SCENES[i].start) / (SCENES[i].end - SCENES[i].start);
        break;
      }
    }

    // Handle last scene
    if (scrollProgress >= SCENES[SCENES.length - 1].start) {
      sceneIndex = SCENES.length - 1;
      localProgress = (scrollProgress - SCENES[sceneIndex].start) / (SCENES[sceneIndex].end - SCENES[sceneIndex].start);
    }

    const currentPos = CAMERA_POSITIONS[sceneIndex];
    const nextPos = CAMERA_POSITIONS[Math.min(sceneIndex + 1, CAMERA_POSITIONS.length - 1)];
    
    const easedProgress = easeInOutCubic(localProgress);

    // Interpolate position
    targetPosition.current.set(
      THREE.MathUtils.lerp(currentPos.position[0], nextPos.position[0], easedProgress),
      THREE.MathUtils.lerp(currentPos.position[1], nextPos.position[1], easedProgress),
      THREE.MathUtils.lerp(currentPos.position[2], nextPos.position[2], easedProgress)
    );

    // Interpolate look-at target
    targetLookAt.current.set(
      THREE.MathUtils.lerp(currentPos.target[0], nextPos.target[0], easedProgress),
      THREE.MathUtils.lerp(currentPos.target[1], nextPos.target[1], easedProgress),
      THREE.MathUtils.lerp(currentPos.target[2], nextPos.target[2], easedProgress)
    );

    // Smooth camera movement
    camera.position.lerp(targetPosition.current, 0.05);
    
    // Smooth look-at
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.copy(targetLookAt.current);
    camera.lookAt(lookAtTarget);
  });

  return null;
};
