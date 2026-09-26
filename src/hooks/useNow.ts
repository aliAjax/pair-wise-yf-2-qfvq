import { useEffect, useState } from 'react';

/**
 * 返回当前时间，并按指定间隔刷新（默认 30 秒），
 * 用于让开放状态随时间自动更新。
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
