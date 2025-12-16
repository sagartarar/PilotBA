import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useUIStore } from '../../store';

export interface PerformanceMonitorProps {
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const { showPerformanceMonitor, performanceMetrics, updatePerformanceMetrics } = useUIStore();
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const framesRef = useRef<number>(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!showPerformanceMonitor) return;

    let animationId: number;

    const measureFPS = () => {
      framesRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const fps = (framesRef.current / elapsed) * 1000;
        const frameTime = elapsed / framesRef.current;

        // Get memory info if available
        let memoryUsed = 0;
        if ('memory' in performance) {
          const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
          memoryUsed = memory.usedJSHeapSize;
        }

        updatePerformanceMetrics({
          fps: Math.round(fps),
          frameTime: Math.round(frameTime * 100) / 100,
          memoryUsed,
        });

        framesRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [showPerformanceMonitor, updatePerformanceMetrics]);

  if (!showPerformanceMonitor) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return 'text-success';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <div
      className={clsx(
        'fixed bottom-4 right-4 z-50 font-mono text-xs',
        'bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg',
        'transition-all duration-200',
        expanded ? 'w-64' : 'w-auto',
        className
      )}
    >
      {/* Header */}
      <button
        className="flex items-center justify-between w-full px-3 py-2 hover:bg-accent/50 rounded-t-lg"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', getFPSColor(performanceMetrics.fps))} />
          <span className={clsx('font-bold', getFPSColor(performanceMetrics.fps))}>
            {performanceMetrics.fps} FPS
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={clsx('transition-transform', expanded && 'rotate-180')}
        >
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frame Time</span>
            <span className="text-foreground">{performanceMetrics.frameTime.toFixed(2)} ms</span>
          </div>
          
          {performanceMetrics.memoryUsed > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory</span>
              <span className="text-foreground">{formatBytes(performanceMetrics.memoryUsed)}</span>
            </div>
          )}
          
          {performanceMetrics.renderTime > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Render</span>
              <span className="text-foreground">{performanceMetrics.renderTime.toFixed(2)} ms</span>
            </div>
          )}
          
          {performanceMetrics.dataLoadTime > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Load</span>
              <span className="text-foreground">{performanceMetrics.dataLoadTime.toFixed(0)} ms</span>
            </div>
          )}
          
          {performanceMetrics.drawCalls > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Draw Calls</span>
              <span className="text-foreground">{performanceMetrics.drawCalls}</span>
            </div>
          )}

          {/* FPS Graph placeholder */}
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="h-8 bg-muted/30 rounded flex items-end px-0.5 gap-px">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex-1 rounded-t transition-all',
                    i === 29 ? getFPSColor(performanceMetrics.fps).replace('text-', 'bg-') : 'bg-muted'
                  )}
                  style={{
                    height: `${Math.min(100, Math.random() * 60 + 40)}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

