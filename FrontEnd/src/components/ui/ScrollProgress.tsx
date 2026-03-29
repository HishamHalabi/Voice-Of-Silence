import { motion } from 'framer-motion';
import { useScrollStore, SCENES } from '@/stores/useScrollStore';

export const ScrollProgress = () => {
  const scrollProgress = useScrollStore((state) => state.scrollProgress);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
      <div className="flex flex-col items-center gap-4">
        {SCENES.map((scene, i) => {
          const isActive = scrollProgress >= scene.start && scrollProgress < scene.end;
          const isPast = scrollProgress >= scene.end;
          
          return (
            <div key={scene.id} className="flex items-center gap-3">
              <motion.div
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary border-primary glow-primary' 
                    : isPast 
                      ? 'bg-primary/50 border-primary/50' 
                      : 'bg-transparent border-muted-foreground/30'
                }`}
                whileHover={{ scale: 1.5 }}
              />
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ 
                  opacity: isActive ? 1 : 0,
                  x: isActive ? 0 : 10 
                }}
                className="text-xs text-primary font-medium whitespace-nowrap"
              >
                {scene.title}
              </motion.span>
            </div>
          );
        })}
      </div>
      
      {/* Progress line */}
      <div className="absolute left-1.5 top-0 w-0.5 h-full bg-muted-foreground/20 -z-10 rounded-full overflow-hidden">
        <motion.div
          className="w-full bg-gradient-to-b from-primary to-secondary"
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  );
};
