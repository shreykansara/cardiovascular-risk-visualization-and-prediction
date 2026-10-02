/**
 * Smooth Animated Number Ticker Hook
 * Perfusion3D Clinical Spatial UI
 */

import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(targetValue: number, duration: number = 800, decimals: number = 1): string {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const currentValRef = useRef(targetValue);
  const startValRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startValRef.current = currentValRef.current;
    startTimeRef.current = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out cubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValRef.current + (targetValue - startValRef.current) * ease;
      
      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        currentValRef.current = targetValue;
        setDisplayValue(targetValue);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, duration]);

  return displayValue.toFixed(decimals);
}
