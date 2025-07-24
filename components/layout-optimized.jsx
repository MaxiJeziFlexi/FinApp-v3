import { useContext, useEffect, useState, memo } from "react";
import { DataContext } from "../utilities/DataContext";
import SideNavOptimized from "./side-nav-optimized";
import { usePerformanceMonitor, ErrorBoundary } from "./optimized/PerformanceOptimizer";

const LayoutOptimized = memo(({ children }) => {
  usePerformanceMonitor('LayoutOptimized');
  
  const { navIsOpen, setNavIsOpen } = useContext(DataContext);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Auto-close nav on mobile when screen size changes
      if (mobile && navIsOpen) {
        setNavIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    setIsLoading(false);

    return () => window.removeEventListener('resize', checkMobile);
  }, [navIsOpen, setNavIsOpen]);

  // Handle click outside to close nav on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && navIsOpen) {
        const nav = document.getElementById('side-navigation');
        const hamburger = document.getElementById('hamburger-button');
        
        if (nav && !nav.contains(event.target) && 
            hamburger && !hamburger.contains(event.target)) {
          setNavIsOpen(false);
        }
      }
    };

    if (isMobile && navIsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, navIsOpen, setNavIsOpen]);

  // Prevent scroll when mobile nav is open
  useEffect(() => {
    if (isMobile && navIsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, navIsOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Mobile overlay */}
        {isMobile && navIsOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setNavIsOpen(false)}
          />
        )}

        {/* Side Navigation */}
        <aside
          id="side-navigation"
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-xl
            transform transition-transform duration-300 ease-in-out lg:translate-x-0
            ${navIsOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isMobile ? 'lg:w-80' : 'lg:w-80'}
          `}
        >
          <div className="flex flex-col h-full">
            <SideNavOptimized />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div className="min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Performance monitoring in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <PerformanceMonitor />
        </div>
      )}
    </ErrorBoundary>
  );
});

LayoutOptimized.displayName = 'LayoutOptimized';

// Performance monitor component for development
const PerformanceMonitor = memo(() => {
  const [metrics, setMetrics] = useState({
    memory: 0,
    timing: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      if (performance.memory) {
        setMetrics({
          memory: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          timing: Math.round(performance.now())
        });
      }
    };

    const interval = setInterval(updateMetrics, 2000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black bg-opacity-75 text-white text-xs p-2 rounded">
      <div>Memory: {metrics.memory}MB</div>
      <div>Runtime: {metrics.timing}ms</div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default LayoutOptimized;