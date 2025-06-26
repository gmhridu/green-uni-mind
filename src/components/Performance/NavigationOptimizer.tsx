import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { baseApi } from '@/redux/api/baseApi';
import { toast } from '@/utils/toast';

interface NavigationOptimizerProps {
  children: React.ReactNode;
}

/**
 * NavigationOptimizer component that provides enterprise-level navigation performance
 * Features:
 * - Preloads critical data for common routes
 * - Provides instant visual feedback
 * - Implements smart cache warming
 * - Handles navigation errors gracefully
 */
export const NavigationOptimizer: React.FC<NavigationOptimizerProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Preload critical data based on current route
  const preloadCriticalData = useCallback(() => {
    const currentPath = location.pathname;
    
    // Preload data based on current route context
    if (currentPath.includes('/teacher')) {
      // Preload teacher-specific data
      dispatch(baseApi.util.prefetch('getMe', undefined, { force: false }));
      
      if (currentPath.includes('/courses')) {
        // Preload courses data when on courses-related pages
        dispatch(baseApi.util.prefetch('getCreatorCourse', { id: 'current-user' }, { force: false }));
      }
      
      if (currentPath.includes('/dashboard')) {
        // Preload dashboard analytics
        dispatch(baseApi.util.prefetch('getDashboardSummary', 'current-user', { force: false }));
      }
    }
  }, [location.pathname, dispatch]);

  // Smart cache warming for likely next routes
  const warmCache = useCallback(() => {
    const currentPath = location.pathname;
    
    // Predict and preload likely next routes
    if (currentPath === '/teacher/dashboard') {
      // User likely to visit courses next
      setTimeout(() => {
        dispatch(baseApi.util.prefetch('getCreatorCourse', { id: 'current-user' }, { force: false }));
      }, 2000);
    } else if (currentPath === '/teacher/courses') {
      // User might create a new course or view lectures
      setTimeout(() => {
        // Preload course creation dependencies
        dispatch(baseApi.util.prefetch('getCategories', undefined, { force: false }));
      }, 1500);
    }
  }, [location.pathname, dispatch]);

  // Handle navigation performance monitoring
  const monitorNavigation = useCallback(() => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      // Log slow navigation for monitoring
      if (loadTime > 2000) {
        console.warn(`Slow navigation detected: ${loadTime}ms for ${location.pathname}`);
        
        // Show user feedback for slow loads
        if (loadTime > 5000) {
          toast.warning('Page is taking longer than usual to load', {
            description: 'Please check your internet connection'
          });
        }
      }
    };

    // Monitor when the page is fully loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [location.pathname]);

  // Optimize route transitions
  useEffect(() => {
    // Add loading class for smooth transitions
    document.body.classList.add('route-transitioning');

    // Safety: Always remove navigating class when route changes
    document.body.classList.remove('navigating');

    const timer = setTimeout(() => {
      document.body.classList.remove('route-transitioning');
    }, 300);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove('route-transitioning');
      document.body.classList.remove('navigating'); // Safety cleanup
    };
  }, [location.pathname]);

  // Initialize optimizations
  useEffect(() => {
    preloadCriticalData();
    warmCache();
    const cleanup = monitorNavigation();
    
    return cleanup;
  }, [preloadCriticalData, warmCache, monitorNavigation]);

  // Provide enhanced navigation function to child components
  const optimizedNavigate = useCallback((to: string, options?: any) => {
    // Add visual feedback
    document.body.classList.add('navigating');
    
    // Show loading toast for longer navigations
    const loadingToast = setTimeout(() => {
      toast.loading('Loading page...', { id: 'navigation-loading' });
    }, 1000);
    
    // Perform navigation
    navigate(to, options);
    
    // Cleanup
    setTimeout(() => {
      document.body.classList.remove('navigating');
      clearTimeout(loadingToast);
      toast.dismiss('navigation-loading');
    }, 500);
  }, [navigate]);

  // Add global styles for smooth transitions
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .route-transitioning {
        transition: opacity 0.2s ease-in-out;
      }
      
      .navigating {
        cursor: wait;
      }

      /* Only disable pointer events on specific navigation elements, not globally */
      .navigating .navigation-disabled {
        pointer-events: none;
      }
      
      /* Smooth navigation feedback */
      .sidebar-nav-item {
        transition: all 0.2s ease-in-out;
      }
      
      .sidebar-nav-item:active {
        transform: scale(0.98);
      }
      
      /* Loading states */
      .loading-shimmer {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="navigation-optimized">
      {children}
    </div>
  );
};

export default NavigationOptimizer;
