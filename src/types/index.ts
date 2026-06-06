export interface Student {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  parentName: string;
  course: string;
  channel: string;
  status: 'active' | 'paused' | 'finished' | 'refunded';
  remainingHours: number;
  totalHours: number;
  enrollmentDate: string;
  createdAt: string;
  avatar?: string;
}

export interface Order {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  channel: string;
  amount: number;
  hours: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  payDate: string;
  createdAt: string;
  remark?: string;
}

export interface LessonRecord {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  teacher: string;
  teacherId: string;
  hours: number;
  content: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  amount: number;
  hours: number;
  reason: string;
  reasonCategory: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  applyDate: string;
  confirmDate?: string;
  createdAt: string;
  remark?: string;
}

export interface Course {
  id: string;
  name: string;
  pricePerHour: number;
  teacherCostPerHour: number;
  status: 'active' | 'inactive';
  description?: string;
  color: string;
  icon: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'short_video' | 'ground_promotion' | 'referral' | 'other';
  cost: number;
  targetCount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  color: string;
}

export interface Teacher {
  id: string;
  name: string;
  course: string;
  hourlyRate: number;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface MonthlyReport {
  month: string;
  revenue: number;
  newStudents: number;
  totalStudents: number;
  lessonHours: number;
  refundAmount: number;
  teacherCost: number;
  netProfit: number;
}

export interface ChannelAnalysis {
  channelId: string;
  channelName: string;
  channelType: string;
  cost: number;
  studentCount: number;
  customerAcquisitionCost: number;
  renewalRate: number;
  roi: number;
  totalRevenue: number;
  color: string;
}

export interface CourseAnalysis {
  courseId: string;
  courseName: string;
  revenue: number;
  studentCount: number;
  lessonHours: number;
  teacherCost: number;
  otherCost: number;
  netProfit: number;
  profitMargin: number;
  color: string;
  icon: string;
}

export interface RefundReasonStats {
  category: string;
  count: number;
  amount: number;
  percentage: number;
}

export const COURSE_LIST = ['美术', '舞蹈', '口才'];
export const CHANNEL_LIST = ['短视频', '地推', '老客转介绍'];
export const STATUS_LIST = ['active', 'paused', 'finished', 'refunded'];
export const REFUND_REASONS = [
  '课程不满意',
  '时间安排冲突',
  '搬家/距离远',
  '老师更换',
  '价格太高',
  '学习效果不佳',
  '孩子不感兴趣',
  '服务态度问题',
  '其他原因'
];
