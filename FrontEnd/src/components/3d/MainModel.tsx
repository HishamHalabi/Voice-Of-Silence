import { useGLTF, Float } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

export const MainModel = () => {
    const { scene } = useGLTF('/models/smart+glove+3d+model.glb');
    const modelRef = useRef<THREE.Group>(null);

    return (
        <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.4}>
            <primitive ref={modelRef} object={scene} scale={2} />
        </Float>
    );
};

useGLTF.preload('/models/smart+glove+3d+model.glb');
