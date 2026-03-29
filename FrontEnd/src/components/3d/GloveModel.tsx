import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { useTheme } from '@/stores/useTheme';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
    nodes: { [key: string]: THREE.Mesh };
    materials: { [key: string]: THREE.Material };
};

export const GloveModel = () => {
    const groupRef = useRef<THREE.Group>(null);
    const scrollProgress = useScrollStore((state) => state.scrollProgress);
    const theme = useTheme((state) => state.theme);

    // Load the glove model
    const { scene } = useGLTF('/models/smart_glove.glb') as GLTFResult;
    const modelRef = useRef<THREE.Group>(scene.clone());

    useEffect(() => {
        if (!modelRef.current) return;

        // Traverse the model and update materials based on theme
        modelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Clone the material to avoid modifying the original
                const material = child.material as THREE.MeshStandardMaterial;

                if (material) {
                    const newMaterial = material.clone();

                    if (theme === 'light') {
                        // Light theme: Black glove with Cyan/Magenta glow (Vibrant)
                        newMaterial.color = new THREE.Color('#000000');

                        // Alternate between Cyan and Magenta glow
                        const brightness = material.color.r + material.color.g + material.color.b;
                        if (brightness > 1.5) {
                            newMaterial.emissive = new THREE.Color('#06B6D4'); // Cyan
                            newMaterial.emissiveIntensity = 0.3;
                        } else {
                            newMaterial.emissive = new THREE.Color('#EC4899'); // Magenta
                            newMaterial.emissiveIntensity = 0.25;
                        }
                    } else {
                        // Dark theme: White glove with cyan/magenta glow
                        newMaterial.color = new THREE.Color('#FFFFFF');

                        const brightness = material.color.r + material.color.g + material.color.b;
                        if (brightness > 1.5) {
                            newMaterial.emissive = new THREE.Color('#00d4ff'); // Cyan
                            newMaterial.emissiveIntensity = 0.3;
                        } else {
                            newMaterial.emissive = new THREE.Color('#a855f7'); // Magenta
                            newMaterial.emissiveIntensity = 0.2;
                        }
                    }

                    // Enhance metallic look
                    newMaterial.metalness = Math.max(newMaterial.metalness, 0.8);
                    newMaterial.roughness = Math.min(newMaterial.roughness, 0.3);

                    child.material = newMaterial;
                }
            }
        });
    }, [theme]); // Re-run when theme changes

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        // Rotate based on scroll - full 360° rotation
        groupRef.current.rotation.y = scrollProgress * Math.PI * 2;
        groupRef.current.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.3;

        // Scale based on scroll section - grows as you scroll
        // Base scale is 2.5x, grows to 3.5x with scroll
        const targetScale = 2.5 + scrollProgress * 1.0;
        groupRef.current.scale.setScalar(
            THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05)
        );

        // Position moves with scroll
        groupRef.current.position.y = Math.sin(scrollProgress * Math.PI * 2) * 0.5;
        groupRef.current.position.z = -scrollProgress * 3;

        // Subtle continuous rotation for dynamic feel
        groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.1;
    });

    return (
        <group ref={groupRef}>
            <Float speed={2} rotationIntensity={0.3} floatIntensity={0.4}>
                <primitive object={modelRef.current} />
            </Float>
        </group>
    );
};

// Preload the model
useGLTF.preload('/models/smart_glove.glb');
