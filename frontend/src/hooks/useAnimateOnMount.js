import { useState, useEffect } from 'react';

/**
 * Hook to trigger staggered entrance animations on mount.
 * Returns `mounted` boolean — when true, apply animation classes.
 * @param {number} delay - Delay in ms before setting mounted to true (default 50).
 * @returns {boolean}
 */
const useAnimateOnMount = (delay = 50) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return mounted;
};

export default useAnimateOnMount;
