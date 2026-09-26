import type { Bench, SittingPeriod } from '@/types';

export const DAY_MINUTES = 24 * 60;

/** 将 "HH:MM" 转换为当天的分钟数（0 - 1439）。 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/** 将分钟数补零格式化为 "HH:MM"。 */
export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * 规整化时段列表：丢弃起止时间不完整或零长度（起止相同）的时段，
 * 并按开始时间排序，保证保存后的顺序稳定。
 */
export function normalizePeriods(periods: SittingPeriod[]): SittingPeriod[] {
  return periods
    .filter((period) => {
      if (!period.start || !period.end) return false;
      return period.start !== period.end;
    })
    .map((period) => ({ start: period.start, end: period.end }))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

/** 是否为全天开放：未登记任何有效时段。 */
export function isAllDay(bench: Pick<Bench, 'sittingHours'>): boolean {
  return normalizePeriods(bench.sittingHours ?? []).length === 0;
}

/**
 * 展开单个时段在指定基准日上的闭开区间（单位：分钟，可跨午夜）。
 * 返回 [起始绝对分钟, 结束绝对分钟)，不完整或零长度时段返回 null。
 */
function expandPeriod(period: SittingPeriod, baseDay: number): [number, number] | null {
  if (!period.start || !period.end || period.start === period.end) return null;
  const start = timeToMinutes(period.start) + baseDay * DAY_MINUTES;
  let end = timeToMinutes(period.end) + baseDay * DAY_MINUTES;
  if (end <= start) end += DAY_MINUTES;
  return [start, end];
}

/**
 * 校验一组时段是否可保存。
 * - 起止时间必须完整
 * - 起止时间不能相同（零长度时段无意义）
 * - 任意两个时段（含跨午夜展开后）不能重叠；首尾相接是允许的
 *
 * 通过返回 null，否则返回错误提示文案。
 */
export function validatePeriods(periods: SittingPeriod[]): string | null {
  for (const period of periods) {
    if (!period.start || !period.end) {
      return '请补全每个时段的开始和结束时间';
    }
    if (period.start === period.end) {
      return '时段的开始和结束时间不能相同（需要跨午夜时结束时间应早于开始时间）';
    }
  }

  // 每个时段在相邻两天各展开一次，以覆盖跨午夜的情况
  const intervals: Array<[number, number]> = [];
  for (const period of periods) {
    for (let day = 0; day <= 1; day++) {
      const interval = expandPeriod(period, day);
      if (interval) intervals.push(interval);
    }
  }
  intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) {
      return '时段之间存在重叠，请调整后再保存';
    }
  }
  return null;
}

export interface ScheduleStatus {
  /** 当前是否可坐 */
  isOpen: boolean;
  /** 是否全天开放 */
  allDay: boolean;
  /** 当前所处开放时段的关闭时间（仅 isOpen 时有值） */
  closesAt: Date | null;
  /** 下一次开放的开始时间（仅 !isOpen 且非全天时有值） */
  nextOpenAt: Date | null;
}

/**
 * 计算某张长椅在给定时刻的可坐状态，支持一天多段与跨午夜时段。
 */
export function getScheduleStatus(
  bench: Pick<Bench, 'sittingHours'>,
  now: Date = new Date(),
): ScheduleStatus {
  const periods = normalizePeriods(bench.sittingHours ?? []);

  if (periods.length === 0) {
    return { isOpen: true, allDay: true, closesAt: null, nextOpenAt: null };
  }

  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  const elapsedMs =
    ((now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds()) * 1000 +
    now.getMilliseconds();
  const nowMs = midnight.getTime() + elapsedMs;

  let closesAt: Date | null = null;
  let nextOpenAt: Date | null = null;

  // 扫描前一天到一周后，足以覆盖跨午夜与每天重复的情况
  for (let day = -1; day <= 7; day++) {
    const dayStartMs = midnight.getTime() + day * DAY_MINUTES * 60 * 1000;
    for (const period of periods) {
      const interval = expandPeriod(period, 0);
      if (!interval) continue;
      // interval 已含跨午夜带来的额外一天
      const startMs = dayStartMs + interval[0] * 60 * 1000;
      const endMs = dayStartMs + interval[1] * 60 * 1000;

      // 闭开区间 [start, end)：结束时刻视为已关闭
      if (nowMs >= startMs && nowMs < endMs) {
        closesAt = new Date(endMs);
      } else if (startMs > nowMs) {
        if (nextOpenAt === null || startMs < nextOpenAt.getTime()) {
          nextOpenAt = new Date(startMs);
        }
      }
    }
  }

  return {
    isOpen: closesAt !== null,
    allDay: false,
    closesAt,
    nextOpenAt: closesAt !== null ? null : nextOpenAt,
  };
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** "HH:MM" */
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * 将某个未来时刻格式化为带相对日期的时间，例如「今天 18:00」「明天 06:00」「周三 08:00」。
 */
export function formatRelativeDateTime(date: Date, now: Date = new Date()): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((target.getTime() - today.getTime()) / (DAY_MINUTES * 60 * 1000));
  const dayLabel =
    dayDiff === 0
      ? '今天'
      : dayDiff === 1
        ? '明天'
        : dayDiff === 2
          ? '后天'
          : WEEKDAY_LABELS[date.getDay()];

  return `${dayLabel} ${formatTime(date)}`;
}

/**
 * 展示单个时段，跨午夜的结束时间追加「次日」标注。
 * 例如 08:00 - 18:00、18:00 - 次日 06:00。
 */
export function formatPeriod(period: SittingPeriod): string {
  const wraps = timeToMinutes(period.end) <= timeToMinutes(period.start);
  return `${period.start} - ${wraps ? '次日 ' : ''}${period.end}`;
}
