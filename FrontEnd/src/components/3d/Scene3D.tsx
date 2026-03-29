import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { ParticleField } from './ParticleField';
import { GloveModel } from './GloveModel';
import { CameraController } from './CameraController';
import { Lights } from './Lights';
import { PostProcessing } from './PostProcessing';
import { Environment, Stars } from '@react-three/drei';
import { useTheme } from '@/stores/useTheme';

export const Scene3D = () => {
  const theme = useTheme((state) => state.theme);

  // Theme-based colors (Cool Blue-Gray for Light Mode)
  const bgColor = theme === 'light' ? '#F8FAFC' : '#050810';
  const fogColor = '#050810'; // Only used in dark mode now

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance", // Prefer performance
          failIfMajorPerformanceCaveat: true
        }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
      >
        <Suspense fallback={null}>
          <color attach="background" args={[bgColor]} />

          {/* Environment - Fog only in dark mode */}
          {theme === 'dark' && <fog attach="fog" args={[fogColor, 10, 30]} />}
          <Stars
            radius={100}
            depth={50}
            count={theme === 'light' ? 1000 : 3000} // Reduced counts
            factor={4}
            saturation={theme === 'light' ? 0.3 : 0}
            fade
            speed={1}
          />

          {/* Lighting */}
          <Lights />

          {/* 3D Objects */}
          <GloveModel />
          <ParticleField count={1500} radius={20} /> // Reduced from 3000 to 1500

          {/* Camera */}
          <CameraController />

          {/* Post-processing effects */}
          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
};
