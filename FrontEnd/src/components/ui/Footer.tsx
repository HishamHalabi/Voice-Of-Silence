import { motion } from 'framer-motion';
import { useScrollStore } from '@/stores/useScrollStore';

export const Footer = () => {
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const isVisible = scrollProgress > 0.85;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50 px-6 py-6 pointer-events-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          © 2024 Voice of Silence. All rights reserved.
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          {['Twitter', 'Discord', 'GitHub'].map((link) => (
            <motion.a
              key={link}
              href="#"
              whileHover={{ scale: 1.1, color: 'hsl(185, 100%, 50%)' }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {link}
            </motion.a>
          ))}
        </div>
      </div>
    </motion.footer>
  );
};
