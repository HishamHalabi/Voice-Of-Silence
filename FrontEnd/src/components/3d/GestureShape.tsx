import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Torus, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '@/stores/useScrollStore';

export const GestureShape = () => {
  const groupRef = useRef<THREE.Group>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const scrollProgress = useScrollStore((state) => state.scrollProgress);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Rotate based on scroll
    groupRef.current.rotation.y = scrollProgress * Math.PI * 2;
    groupRef.current.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.3;
    
    // Scale based on scroll section
    const targetScale = 1 + scrollProgress * 0.5;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05)
    );

    // Position moves with scroll
    groupRef.current.position.y = Math.sin(scrollProgress * Math.PI * 2) * 0.5;
    groupRef.current.position.z = -scrollProgress * 3;

    if (torusRef.current) {
      torusRef.current.rotation.x = time * 0.5;
      torusRef.current.rotation.z = time * 0.3;
    }

    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Central sphere with distortion */}
        <Sphere ref={sphereRef} args={[1, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#00d4ff"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.1}
            metalness={0.9}
            emissive="#00d4ff"
            emissiveIntensity={0.3}
          />
        </Sphere>

        {/* Outer torus ring */}
        <Torus ref={torusRef} args={[2, 0.1, 16, 100]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </Torus>

        {/* Inner torus ring */}
        <Torus args={[1.5, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </Torus>

        {/* Floating boxes */}
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 3;
          const z = Math.sin(angle) * 3;
          return (
            <Float key={i} speed={1 + i * 0.2} floatIntensity={0.3}>
              <Box
                args={[0.3, 0.3, 0.3]}
                position={[x, Math.sin(angle) * 0.5, z]}
                rotation={[angle, angle, 0]}
              >
                <meshStandardMaterial
                  color={i % 2 === 0 ? '#00d4ff' : '#a855f7'}
                  emissive={i % 2 === 0 ? '#00d4ff' : '#a855f7'}
                  emissiveIntensity={0.3}
                  metalness={0.8}
                  roughness={0.2}
                />
              </Box>
            </Float>
          );
        })}
      </Float>
    </group>
  );
};
