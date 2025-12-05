'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface FirstVisitConfettiProps {
  userId: string;
}

export function FirstVisitConfetti({ userId }: FirstVisitConfettiProps) {
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  useEffect(() => {
    // Check if we've already shown confetti for this user
    const confettiKey = `dashboard_confetti_shown_${userId}`;
    const alreadyShown = localStorage.getItem(confettiKey);

    if (!alreadyShown && !hasShownConfetti) {
      // Wait a moment for the page to fully load
      setTimeout(() => {
        shootConfetti();
        // Mark as shown so it doesn't repeat
        localStorage.setItem(confettiKey, 'true');
        setHasShownConfetti(true);
      }, 800);
    }
  }, [userId, hasShownConfetti]);

  const shootConfetti = () => {
    const duration = 4000; // 4 seconds as requested
    const end = Date.now() + duration;
    const colors = ['#8B5CF6', '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // This component doesn't render anything visible
  return null;
}

