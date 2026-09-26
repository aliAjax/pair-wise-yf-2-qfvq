import type { Bench, OpenTimeWindow } from '@/types';

const MINUTES_PER_DAY = 24 * 60;

/** 将 "HH:MM" 解析为当天分钟数，非法格式返回 null */
export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 未登记时段（无字段或空数组）视为全天开放 */
export function isAllDayOpen(bench: Bench): boolean {
  return !bench.openHours || bench.openHours.length === 0;
}

/** 判断某个时间点长椅是否可坐 */
export function isOpenAt(bench: Bench, date: Date): boolean {
  if (isAllDayOpen(bench)) return true;
  const nowMin = date.getHours() * 60 + date.getMinutes();
  return bench.openHours!.some((window) => {
    const start = parseTimeToMinutes(window.start);
    const end = parseTimeToMinutes(window.end);
    if (start === null || end === null || start === end) return false;
    if (end > start) {
      return nowMin >= start && nowMin < end;
    }
    // 跨午夜：如 22:00–02:00
    return nowMin >= start || nowMin < end;
  });
}

export interface OpenStatus {
  isOpen: boolean;
  isAllDay: boolean;
  /** 当前关闭时，下一次开放时间；全天开放或无法确定时为 null */
  nextOpen: Date | null;
  /** 当前开放时，本次开放的结束时间；全天开放时为 null */
  closesAt: Date | null;
}

/** 获取长椅当前的开放状态 */
export function getOpenStatus(bench: Bench, now: Date): OpenStatus {
  if (isAllDayOpen(bench)) {
    return { isOpen: true, isAllDay: true, nextOpen: null, closesAt: null };
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isOpen = isOpenAt(bench, now);

  if (isOpen) {
    // 计算本次开放的结束时间（取所有覆盖当前时间的时段里最晚的结束点）
    let closesAt: Date | null = null;
    let latestCloseMin = -1;
    for (const window of bench.openHours!) {
      const start = parseTimeToMinutes(window.start);
      const end = parseTimeToMinutes(window.end);
      if (start === null || end === null || start === end) continue;
      const coversNow =
        end > start
          ? nowMin >= start && nowMin < end
          : nowMin >= start || nowMin < end;
      if (!coversNow) continue;
      // 结束时间换算为相对“今天 0 点”的分钟数，跨午夜且当前在次日段时结束于今天
      const closeMin = end > start ? end : nowMin >= start ? end + MINUTES_PER_DAY : end;
      if (closeMin > latestCloseMin) {
        latestCloseMin = closeMin;
        closesAt = minutesToDate(now, closeMin);
      }
    }
    return { isOpen: true, isAllDay: false, nextOpen: null, closesAt };
  }

  // 当前关闭：找最近的下一个开始时间（今天或明天）
  let nextOpen: Date | null = null;
  let earliestStartMin = Infinity;
  for (const window of bench.openHours!) {
    const start = parseTimeToMinutes(window.start);
    if (start === null) continue;
    const startMin = start > nowMin ? start : start + MINUTES_PER_DAY;
    if (startMin < earliestStartMin) {
      earliestStartMin = startMin;
      nextOpen = minutesToDate(now, startMin);
    }
  }
  return { isOpen: false, isAllDay: false, nextOpen, closesAt: null };
}

/** 将以“当天 0 点”为基准的分钟数转换为 Date（可超过 1440 表示次日） */
function minutesToDate(base: Date, minutes: number): Date {
  const date = new Date(base);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);
  return date;
}

/**
 * 校验时段列表，返回错误信息；合法时返回 null。
 * 规则：时间格式合法、开始与结束不能相同、时段之间不能重叠（含跨午夜）。
 */
export function validateWindows(windows: OpenTimeWindow[]): string | null {
  for (const window of windows) {
    const start = parseTimeToMinutes(window.start);
    const end = parseTimeToMinutes(window.end);
    if (start === null || end === null) {
      return '请填写完整的开始和结束时间';
    }
    if (start === end) {
      return '开始时间和结束时间不能相同';
    }
  }

  // 将每个时段展开为 [0, 1440) 内的一段或两段区间，再两两检查重叠
  const segments: Array<Array<[number, number]>> = windows.map((window) => {
    const start = parseTimeToMinutes(window.start)!;
    const end = parseTimeToMinutes(window.end)!;
    if (end > start) {
      return [[start, end]];
    }
    // 跨午夜拆成两段
    return [
      [start, MINUTES_PER_DAY],
      [0, end],
    ];
  });

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const overlap = segments[i].some(([aStart, aEnd]) =>
        segments[j].some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd)
      );
      if (overlap) {
        return `时段重叠：${windows[i].start}–${windows[i].end} 与 ${windows[j].start}–${windows[j].end} 有重叠，请调整后再保存`;
      }
    }
  }

  return null;
}

/** 格式化单个时段，跨午夜时标注“次日” */
export function formatWindow(window: OpenTimeWindow): string {
  const start = parseTimeToMinutes(window.start);
  const end = parseTimeToMinutes(window.end);
  const crossesMidnight = start !== null && end !== null && end <= start;
  return `${window.start}–${window.end}${crossesMidnight ? '（次日）' : ''}`;
}

/** 格式化下次开放时间：今天 HH:MM / 明天 HH:MM */
export function formatNextOpen(date: Date, now: Date): string {
  const isToday = date.toDateString() === now.toDateString();
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${isToday ? '今天' : '明天'} ${time}`;
}

/** 格式化时间为 HH:MM */
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
