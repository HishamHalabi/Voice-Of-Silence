import { motion, AnimatePresence } from 'framer-motion';
import { useScrollStore, SCENES, getCurrentScene } from '@/stores/useScrollStore';

const sceneContent = [
  {
    title: 'Voice of Silence',
    subtitle: 'The Future of Gesture Recognition',
    description: 'Transform silence into action. Our neural interface reads your gestures with unprecedented precision.',
    cta: 'Scroll to Explore',
  },
  {
    title: 'Gesture Recognition',
    subtitle: 'Sub-millisecond Response',
    description: 'Advanced machine learning algorithms detect and interpret hand movements in real-time with 99.7% accuracy.',
    stats: [
      { label: 'Accuracy', value: '99.7%' },
      { label: 'Latency', value: '<1ms' },
    ],
  },
  {
    title: 'Real-time Processing',
    subtitle: 'Edge Computing Power',
    description: 'On-device neural processing ensures instant response without cloud dependency. Your data stays with you.',
    stats: [
      { label: 'Processing', value: '120fps' },
      { label: 'Privacy', value: '100%' },
    ],
  },
  {
    title: 'Neural Interface',
    subtitle: 'Seamless Integration',
    description: 'Connect with any device. Our universal API makes integration effortless across platforms and ecosystems.',
    stats: [
      { label: 'Platforms', value: '50+' },
      { label: 'SDK Support', value: '12' },
    ],
  },
  {
    title: 'Experience the Future',
    subtitle: 'Join the Revolution',
    description: 'Be among the first to access Voice of Silence. Transform how you interact with technology.',
    cta: 'Request Early Access',
  },
];

export const SceneOverlay = () => {
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const currentSceneIndex = getCurrentScene(scrollProgress);
  const content = sceneContent[Math.max(0, currentSceneIndex)];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <div className="h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSceneIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-xl"
            >
              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-primary text-sm md:text-base font-medium tracking-wider uppercase mb-3"
              >
                {content.subtitle}
              </motion.p>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
              >
                <span className="text-gradient">{content.title}</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg md:text-xl mb-8 leading-relaxed"
              >
                {content.description}
              </motion.p>

              {/* Stats */}
              {content.stats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-8 mb-8"
                >
                  {content.stats.map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl md:text-4xl font-display font-bold text-gradient">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* CTA */}
              {content.cta && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="pointer-events-auto"
                >
                  {currentSceneIndex === 0 ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex items-start justify-center pt-2"
                      >
                        <motion.div
                          animate={{ opacity: [1, 0], y: [0, 8] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-1 h-2 bg-primary rounded-full"
                        />
                      </motion.div>
                      <span className="text-sm">{content.cta}</span>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-full text-primary-foreground font-semibold text-lg glow-primary transition-all hover:glow-primary-lg"
                    >
                      {content.cta}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
