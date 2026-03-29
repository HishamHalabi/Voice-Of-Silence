import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollStore } from '@/stores/useScrollStore';
import { ThemeToggle } from './ThemeToggle';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from './button';
import { LogOut, User } from 'lucide-react';

export const Navigation = () => {
  const scrollProgress = useScrollStore((state) => state.scrollProgress);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Speak', path: '/speak' },
    { name: 'Practice', path: '/videos' },
    { name: 'Chat', path: '/chat' },
  ];

  const shouldShowBg = !isHome || isScrolled || scrollProgress > 0.05;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${shouldShowBg ? 'bg-background/80 backdrop-blur-md border-b border-border/50' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">V</span>
            </div>
            <span className="font-display font-semibold text-lg text-foreground">
              Voice of Silence
            </span>
          </motion.div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative group"
              >
                <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`}>
                  {link.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side: Theme toggle + Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="rounded-full gap-2 transition-all hover:bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                  <span className="hidden lg:inline">{user.name}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} className="rounded-full text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm" className="rounded-full px-6 glow-primary">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
