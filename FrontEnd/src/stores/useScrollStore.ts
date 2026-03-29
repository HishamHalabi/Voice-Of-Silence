import { create } from 'zustand';

interface ScrollState {
  scrollProgress: number;
  currentScene: number;
  setScrollProgress: (progress: number) => void;
  setCurrentScene: (scene: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scrollProgress: 0,
  currentScene: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setCurrentScene: (scene) => set({ currentScene: scene }),
}));

// Scene configuration
export const SCENES = [
  { id: 'hero', start: 0, end: 0.2, title: 'Voice of Silence' },
  { id: 'feature-1', start: 0.2, end: 0.4, title: 'Gesture Recognition' },
  { id: 'feature-2', start: 0.4, end: 0.6, title: 'Real-time Processing' },
  { id: 'feature-3', start: 0.6, end: 0.8, title: 'Neural Interface' },
  { id: 'cta', start: 0.8, end: 1, title: 'Experience the Future' },
] as const;

export const getCurrentScene = (progress: number) => {
  return SCENES.findIndex(
    (scene) => progress >= scene.start && progress < scene.end
  );
};
