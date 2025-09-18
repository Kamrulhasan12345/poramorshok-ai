import { useState, useEffect, RefObject, useRef } from 'react';

type ScrollDirection = 'up' | 'down';

interface ScrollState {
  isScrolled: boolean;
  scrollDirection: ScrollDirection;
}

const useScroll = (ref: RefObject<HTMLElement>): ScrollState => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('up');
  const lastScrollTopRef = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger a direction change

  useEffect(() => {
    const element = ref.current;

    const handleScroll = () => {
      if (!element) return;
      
      const scrollTop = element.scrollTop;
      
      // Determine if scrolled at all (for the header style change)
      setIsScrolled(scrollTop > 20);

      // Determine scroll direction
      const scrollDelta = scrollTop - lastScrollTopRef.current;

      // Only change direction if scrolled more than the threshold
      if (Math.abs(scrollDelta) < scrollThreshold) {
        return;
      }
      
      // Don't hide header if we're at the very top of the page
      if (scrollTop <= 0) {
          if (scrollDirection !== 'up') {
            setScrollDirection('up');
          }
          lastScrollTopRef.current = 0;
          return;
      }

      if (scrollDelta > 0) { // Scrolling down
        if (scrollDirection !== 'down') {
            setScrollDirection('down');
        }
      } else { // Scrolling up
        if (scrollDirection !== 'up') {
            setScrollDirection('up');
        }
      }

      lastScrollTopRef.current = scrollTop;
    };

    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [ref, scrollDirection]);

  return { isScrolled, scrollDirection };
};

export default useScroll;