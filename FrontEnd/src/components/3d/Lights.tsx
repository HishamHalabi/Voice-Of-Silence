import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { useTheme } from '@/stores/useTheme';

export const Lights = () => {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const pointLight1Ref = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const theme = useTheme((state) => state.theme);

  // Theme-based lighting config
  const isLight = theme === 'light';
  const ambientIntensity = isLight ? 0.8 : 0.1; // Much brighter ambient for light mode
  const mainLightColor = isLight ? "#06B6D4" : "#00d4ff"; // Vibrant cyan for both
  const secondaryLightColor = isLight ? "#EC4899" : "#a855f7"; // Magenta/Purple
  const rimLightColor = isLight ? "#ffffff" : "#ffffff";
  const lightIntensityMult = isLight ? 1.5 : 1.0; // Boost key lights in light mode

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Animate spot light
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(time * 0.5) * 3;
      spotLightRef.current.position.z = Math.cos(time * 0.5) * 3;
      spotLightRef.current.intensity = (2 + Math.sin(scrollProgress * Math.PI * 2) * 0.5) * lightIntensityMult;
    }

    // Animate point lights
    if (pointLight1Ref.current) {
      pointLight1Ref.current.position.x = Math.sin(time * 0.3) * 5;
      pointLight1Ref.current.position.y = Math.cos(time * 0.4) * 3;
      pointLight1Ref.current.intensity = (1.5 + scrollProgress * 0.5) * lightIntensityMult;
    }

    if (pointLight2Ref.current) {
      pointLight2Ref.current.position.x = Math.cos(time * 0.3) * 5;
      pointLight2Ref.current.position.z = Math.sin(time * 0.4) * 5;
      pointLight2Ref.current.intensity = (1.5 + scrollProgress * 0.5) * lightIntensityMult;
    }
  });

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={ambientIntensity} />

      {/* Key light - main spotlight */}
      <spotLight
        ref={spotLightRef}
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={2 * lightIntensityMult}
        color={mainLightColor}
        castShadow
      />

      {/* Fill light - cyan point light */}
      <pointLight
        ref={pointLight1Ref}
        position={[-5, 0, -5]}
        intensity={1.5 * lightIntensityMult}
        color={mainLightColor}
        distance={20}
        decay={2}
      />

      {/* Rim light - purple point light */}
      <pointLight
        ref={pointLight2Ref}
        position={[5, 0, -5]}
        intensity={1.5 * lightIntensityMult}
        color={secondaryLightColor}
        distance={20}
        decay={2}
      />

      {/* Back light for depth */}
      <pointLight
        position={[0, 5, -10]}
        intensity={1 * lightIntensityMult}
        color={rimLightColor}
        distance={30}
        decay={2}
      />
    </>
  );
};
