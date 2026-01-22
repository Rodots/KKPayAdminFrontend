// 日期时间选择器快捷选项

// 创建日期时间范围
export function createDateTimeRange(startDate: Date, endDate: Date): [Date, Date] {
  return [startDate, endDate]
}

// 获取一天的开始时间
export function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// 获取一天的结束时间
export function getEndOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

// 日期时间快捷选项配置
export const dateTimeShortcuts = [
  {
    text: '今天',
    value: () => {
      const today = new Date()
      return createDateTimeRange(getStartOfDay(today), getEndOfDay(today))
    },
  },
  {
    text: '昨天',
    value: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return createDateTimeRange(getStartOfDay(yesterday), getEndOfDay(yesterday))
    },
  },
  {
    text: '近一天',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      return createDateTimeRange(start, end)
    },
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000)
      return createDateTimeRange(start, end)
    },
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      return createDateTimeRange(start, end)
    },
  },
  {
    text: '近一个月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate())
      return createDateTimeRange(start, end)
    },
  },
  {
    text: '近三个月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth() - 3, end.getDate())
      return createDateTimeRange(start, end)
    },
  },
  {
    text: '近半年',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth() - 6, end.getDate())
      return createDateTimeRange(start, end)
    },
  },
  {
    text: '近一年',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate())
      return createDateTimeRange(start, end)
    },
  },
]

// 获取默认的时间范围（近三个月）
export function getDefaultRange(): [string, string] {
  const end = new Date()
  end.setHours(24, 0, 0, 0)

  const start = new Date(end)
  start.setMonth(start.getMonth() - 3)

  const format = (date: Date): string => {
    const offset = -date.getTimezoneOffset()
    const sign = offset >= 0 ? '+' : '-'
    const absOffset = Math.abs(offset)
    const tz = `${sign}${String(Math.floor(absOffset / 60)).padStart(2, '0')}:${String(absOffset % 60).padStart(2, '0')}`
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.000${tz}`
  }

  return [format(start), format(end)]
}

// 导出所有工具函数
export default {
  createDateTimeRange,
  getStartOfDay,
  getEndOfDay,
  getDefaultRange,
  dateTimeShortcuts,
}
