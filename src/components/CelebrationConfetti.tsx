import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  vx: number;
  vy: number;
}

export const CelebrationConfetti: React.FC<{ active: boolean; onComplete: () => void }> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        x: 50,
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 4,
        rotation: Math.random() * 360,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40 - 10,
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: '50vw', y: '50vh', opacity: 1, scale: 1, rotate: 0 }}
            animate={{ 
              x: `calc(50vw + ${p.vx * 10}vw)`, 
              y: `calc(50vh + ${p.vy * 10}vh)`, 
              opacity: 0,
              scale: 0.5,
              rotate: p.rotation + 720
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
