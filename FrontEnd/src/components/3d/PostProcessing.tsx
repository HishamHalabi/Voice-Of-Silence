import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useScrollStore } from '@/stores/useScrollStore';
import { useTheme } from '@/stores/useTheme'; // Import useTheme

export const PostProcessing = () => {
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const theme = useTheme((state) => state.theme);

  const isLight = theme === 'light';

  // Conditionally adjust bloom intensity
  // Light mode needs VERY subtle bloom to avoid "foggy" look on white background
  const baseBloom = isLight ? 0.3 : 1.5;
  const bloomIntensity = baseBloom + scrollProgress * (isLight ? 0.2 : 0.5);

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={isLight ? 0.6 : 0.2} // Higher threshold for light mode
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      {/* Reduced noise for cleaner light theme */}
      <Noise
        opacity={isLight ? 0.01 : 0.02}
        blendFunction={BlendFunction.OVERLAY}
      />

      {/* Subtle or no vignette for light theme */}
      <Vignette
        offset={0.3}
        darkness={isLight ? 0.2 : (0.5 + scrollProgress * 0.2)}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};
