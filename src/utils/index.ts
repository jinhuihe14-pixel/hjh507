import { format, parseISO, addDays, addMonths, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: string | Date, fmt: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-CN').format(num);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: '在读',
    paused: '停课',
    finished: '结业',
    refunded: '已退费',
    pending: '待处理',
    paid: '已支付',
    cancelled: '已取消',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    finished: 'bg-blue-100 text-blue-700',
    refunded: 'bg-red-100 text-red-700',
    pending: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

export const getRandomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomFloat = (min: number, max: number, decimals: number = 2): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)) as unknown as number;
};

export const randomDate = (start: Date, end: Date): Date => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = Math.random() * (endTime - startTime) + startTime;
  return new Date(randomTime);
};

export const getMonthsBetween = (startDate: string, endDate: string): string[] => {
  const months: string[] = [];
  let current = startOfMonth(parseISO(startDate));
  const end = endOfMonth(parseISO(endDate));
  
  while (current <= end) {
    months.push(format(current, 'yyyy-MM'));
    current = addMonths(current, 1);
  }
  
  return months;
};

export const isPeakSeason = (month: string): boolean => {
  const m = parseInt(month.split('-')[1]);
  return m === 1 || m === 2 || m === 7 || m === 8;
};

export const getSeasonLabel = (month: string): string => {
  const m = parseInt(month.split('-')[1]);
  if (m === 1 || m === 2) return '寒假';
  if (m === 7 || m === 8) return '暑假';
  if (m >= 3 && m <= 6) return '春季';
  return '秋季';
};

type ClassValue = string | undefined | null | false;

export const cn = (...classes: ClassValue[]) => {
  return classes.filter(Boolean).join(' ');
};
