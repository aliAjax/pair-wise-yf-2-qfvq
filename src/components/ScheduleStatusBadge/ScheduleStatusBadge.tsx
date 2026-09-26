import { getScheduleStatus, formatRelativeDateTime, formatTime } from '@/utils/schedule';
import type { Bench } from '@/types';

interface ScheduleStatusBadgeProps {
  bench: Pick<Bench, 'sittingHours'>;
  now?: Date;
  /** sm：纯状态点+文字；md：附带下一次开放/关闭时间 */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * 长椅当前可坐状态徽标。
 * 全天开放与登记时段且当前开放均显示为「开放中」，关闭显示「已关闭」。
 */
export default function ScheduleStatusBadge({
  bench,
  now = new Date(),
  size = 'sm',
  className = '',
}: ScheduleStatusBadgeProps) {
  const status = getScheduleStatus(bench, now);

  if (status.isOpen) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-moss-green/10 text-moss-green font-medium ${
          size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
        } ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-green opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-moss-green" />
        </span>
        开放中
        {size === 'md' && status.closesAt && !status.allDay && (
          <span className="text-moss-green/70 font-normal">· {formatTime(status.closesAt)} 关闭</span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-ink-light/10 text-ink-light font-medium ${
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      } ${className}`}
    >
      <span className="inline-flex rounded-full h-2 w-2 bg-ink-light/60" />
      已关闭
      {size === 'md' && status.nextOpenAt && (
        <span className="text-ink-light/70 font-normal">
          · {formatRelativeDateTime(status.nextOpenAt, now)} 开放
        </span>
      )}
    </span>
  );
}
