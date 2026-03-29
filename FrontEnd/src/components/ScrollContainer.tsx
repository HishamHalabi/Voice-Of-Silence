import { useEffect, useRef, useCallback } from 'react';
import { useScrollStore } from '@/stores/useScrollStore';

interface ScrollContainerProps {
  children: React.ReactNode;
  showSpacer?: boolean;
}

export const ScrollContainer = ({ children, showSpacer = true }: ScrollContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setScrollProgress = useScrollStore((state) => state.setScrollProgress);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;

    setScrollProgress(progress);
  }, [setScrollProgress]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} className="relative">
      {children}
      {/* Scroll spacer - only if requested (e.g. for 3D home) */}
      {showSpacer && <div className="h-[500vh]" />}
    </div>
  );
};
