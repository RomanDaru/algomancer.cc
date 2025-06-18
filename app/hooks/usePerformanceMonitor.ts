import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiCallTime?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Mark component mount time
    const mountTime = Date.now() - startTime.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${componentName} Performance:`, {
        mountTime: `${mountTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Report to analytics in production (if needed)
    if (process.env.NODE_ENV === 'production' && mountTime > 2000) {
      // Log slow components
      console.warn(`⚠️ Slow component detected: ${componentName} took ${mountTime}ms to mount`);
    }
  }, [componentName]);

  const measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const apiStartTime = Date.now();
    
    try {
      const result = await apiCall();
      const apiTime = Date.now() - apiStartTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 API Call ${apiName}:`, {
          duration: `${apiTime}ms`,
          status: 'success',
        });
      }
      
      // Warn about slow API calls
      if (apiTime > 1000) {
        console.warn(`⚠️ Slow API call: ${apiName} took ${apiTime}ms`);
      }
      
      return result;
    } catch (error) {
      const apiTime = Date.now() - apiStartTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Call ${apiName} failed:`, {
          duration: `${apiTime}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      throw error;
    }
  };

  return { measureApiCall };
}

// Hook for measuring render performance
export function useRenderPerformance(componentName: string, dependencies: any[] = []) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    if (process.env.NODE_ENV === 'development' && renderCount.current > 1) {
      console.log(`🔄 ${componentName} re-render #${renderCount.current}:`, {
        timeSinceLastRender: `${timeSinceLastRender}ms`,
        dependencies: dependencies.length,
      });

      // Warn about frequent re-renders
      if (timeSinceLastRender < 100 && renderCount.current > 5) {
        console.warn(`⚠️ Frequent re-renders detected in ${componentName}`);
      }
    }
  }, dependencies);
}
