import { useEffect, useState } from 'react';

/**
 * 返回一个按固定间隔刷新的「当前时间」，用于驱动可坐状态的实时展示。
 * 页面重新可见时也会立即刷新一次，避免从后台切回时显示过期状态。
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') setNow(new Date());
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs]);

  return now;
}
