import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Automatically scrolls the window to the very top (0, 0)
 * whenever the route (pathname) changes.
 * 
 * This creates the feel of navigating to a "new page" rather 
 * than just swapping components in place.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top instantly
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // This component renders nothing visibly
};

export default ScrollToTop;