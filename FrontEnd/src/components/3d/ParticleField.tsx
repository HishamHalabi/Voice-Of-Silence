import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '@/stores/useScrollStore';

interface ParticleFieldProps {
  count?: number;
  radius?: number;
}

export const ParticleField = ({ count = 2000, radius = 15 }: ParticleFieldProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const scrollProgress = useScrollStore((state) => state.scrollProgress);

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const colorPrimary = new THREE.Color('hsl(185, 100%, 50%)');
    const colorSecondary = new THREE.Color('hsl(280, 80%, 60%)');

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Mix colors
      const mixFactor = Math.random();
      const color = colorPrimary.clone().lerp(colorSecondary, mixFactor);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.5 + 0.1;
    }

    return [positions, colors, sizes];
  }, [count, radius]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.elapsedTime;
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    const positionArray = positionAttribute.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      // Flowing motion based on scroll
      const flowSpeed = 0.5 + scrollProgress * 0.5;
      const offset = time * flowSpeed + i * 0.001;
      
      positionArray[i3] = x + Math.sin(offset) * 0.3;
      positionArray[i3 + 1] = y + Math.cos(offset * 0.8) * 0.3;
      positionArray[i3 + 2] = z + Math.sin(offset * 0.6) * 0.3;
    }

    positionAttribute.needsUpdate = true;

    // Rotate the entire field slowly
    pointsRef.current.rotation.y = time * 0.02 + scrollProgress * Math.PI * 0.5;
    pointsRef.current.rotation.x = Math.sin(time * 0.01) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
