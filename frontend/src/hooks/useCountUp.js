import { useState, useEffect, useRef } from 'react';

/**
 * Hook to animate a number counting up from 0 to target.
 * @param {number} target - The target number to count up to.
 * @param {number} duration - Duration of animation in ms (default 1200).
 * @param {number} delay - Delay before starting in ms (default 0).
 * @returns {number} The current animated value.
 */
const useCountUp = (target, duration = 1200, delay = 0) => {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === 0 || target === null || target === undefined) {
      setValue(0);
      return;
    }

    const timeout = setTimeout(() => {
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
        
        // Ease-out cubic for natural deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      startTimeRef.current = null;
      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, delay]);

  return value;
};

export default useCountUp;
