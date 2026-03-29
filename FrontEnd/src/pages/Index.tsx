import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Scene3D } from '@/components/3d/Scene3D';
import { Navigation } from '@/components/ui/Navigation';
import { SceneOverlay } from '@/components/ui/SceneOverlay';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { Footer } from '@/components/ui/Footer';
import { ScrollContainer } from '@/components/ScrollContainer';
import { LoadingScreen } from '@/components/LoadingScreen';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
        const data = await response.json();
        if (data.success) {
          setBackendStatus('connected');
          console.log('Backend connected:', data.message);
        } else {
          setBackendStatus('error');
        }
      } catch (err) {
        console.error('Backend connection failed:', err);
        setBackendStatus('error');
      }
    };

    checkBackend();

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <title>Voice of Silence | Sign Language Interface</title>
      <meta name="description" content="Voice to Silence - Real-time sign language recognition and speech synthesis." />

      <AnimatePresence>
        {isLoading && <LoadingScreen progress={loadingProgress} />}
      </AnimatePresence>

      <main className="relative overflow-x-hidden bg-background">
        <Scene3D />

        <SceneOverlay />
        <ScrollProgress />

        <ScrollContainer showSpacer={true}>
          <div className="relative z-0" />
        </ScrollContainer>
      </main>
    </>
  );
};


export default Index;
