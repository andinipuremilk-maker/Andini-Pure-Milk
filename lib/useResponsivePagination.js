'use client';
import { useState, useEffect } from 'react';

/**
 * Custom hook to dynamically calculate items per page based on viewport size.
 * - Mobile (< 768px): 5 items (compact, saves scrolling on smartphone)
 * - Tablet (768px - 1199px): 8 items (balanced for iPad / tablet screens)
 * - Desktop (>= 1200px): 12 items (maximizes wide screen space and reduces clicks)
 *
 * @param {number} mobileCount - Default items per page for mobile screens (< 768px)
 * @param {number} tabletCount - Default items per page for tablet screens (768px - 1199px)
 * @param {number} desktopCount - Default items per page for desktop screens (>= 1200px)
 * @returns {number} itemsPerPage
 */
export function useResponsivePagination(mobileCount = 5, tabletCount = 8, desktopCount = 12) {
  const [itemsPerPage, setItemsPerPage] = useState(desktopCount);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsPerPage(mobileCount);
      } else if (width < 1200) {
        setItemsPerPage(tabletCount);
      } else {
        setItemsPerPage(desktopCount);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileCount, tabletCount, desktopCount]);

  return itemsPerPage;
}
