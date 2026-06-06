import { Student, Order, LessonRecord, Refund, Course, Channel, Teacher } from '../types';
import { generateId, getRandomItem, getRandomInt, randomDate, formatDate } from '../utils';

const firstNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const lastNames = ['梓涵', '子轩', '雨萱', '浩宇', '欣怡', '梓轩', '子涵', '思琪', '浩然', '雨桐', '佳怡', '梓萱', '子豪', '欣妍', '宇轩', '若曦', '梓豪', '思远', '雨泽', '佳琪', '文博', '雅琪', '梓晨', '子萱', '俊杰', '诗涵', '一鸣', '雅婷', '梓彤', '明轩'];

const generateStudentName = (): string => {
  return getRandomItem(firstNames) + getRandomItem(lastNames);
};

const generateParentName = (): string => {
  return getRandomItem(firstNames) + getRandomItem(['建国', '丽华', '志强', '淑芬', '伟', '敏', '磊', '静', '鹏', '燕']);
};

const generatePhone = (): string => {
  return '1' + getRandomItem(['3', '5', '7', '8', '9']) + Array.from({ length: 9 }, () => getRandomInt(0, 9).toString()).join('');
};

const courses = ['美术', '舞蹈', '口才'];
const channels = ['短视频', '地推', '老客转介绍'];

export const generateMockStudents = (count: number = 80): Student[] => {
  const students: Student[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2025-12-31');

  for (let i = 0; i < count; i++) {
    const course = getRandomItem(courses);
    const channel = getRandomItem(channels);
    const enrollmentDate = randomDate(startDate, endDate);
    const totalHours = getRandomInt(20, 100);
    const consumedHours = getRandomInt(0, totalHours);
    const remainingHours = totalHours - consumedHours;
    
    const courseHours: Record<string, { remaining: number; total: number }> = {
      [course]: { remaining: remainingHours, total: totalHours },
    };
    
    const hasSecondCourse = Math.random() > 0.7;
    const studentCourses = [course];
    let allRemainingHours = remainingHours;
    let allTotalHours = totalHours;
    
    if (hasSecondCourse) {
      const otherCourses = courses.filter(c => c !== course);
      const secondCourse = getRandomItem(otherCourses);
      const secondTotal = getRandomInt(10, 40);
      const secondConsumed = getRandomInt(0, secondTotal);
      const secondRemaining = secondTotal - secondConsumed;
      studentCourses.push(secondCourse);
      courseHours[secondCourse] = { remaining: secondRemaining, total: secondTotal };
      allRemainingHours += secondRemaining;
      allTotalHours += secondTotal;
    }
    
    students.push({
      id: generateId(),
      name: generateStudentName(),
      age: getRandomInt(4, 12),
      gender: Math.random() > 0.5 ? 'male' : 'female',
      phone: generatePhone(),
      parentName: generateParentName(),
      course,
      courses: studentCourses,
      courseHours,
      channel,
      status: getRandomItem(['active', 'active', 'active', 'paused', 'finished', 'refunded']),
      remainingHours: allRemainingHours,
      totalHours: allTotalHours,
      enrollmentDate: formatDate(enrollmentDate),
      createdAt: formatDate(enrollmentDate),
      remark: '',
    });
  }

  return students.sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime());
};

export const generateMockOrders = (students: Student[]): Order[] => {
  const orders: Order[] = [];

  students.forEach(student => {
    const orderCount = getRandomInt(1, 4);
    let lastDate = new Date(student.enrollmentDate);

    for (let i = 0; i < orderCount; i++) {
      const hours = getRandomInt(20, 60);
      const pricePerHour = student.course === '舞蹈' ? 150 : student.course === '美术' ? 120 : 100;
      const amount = hours * pricePerHour;
      const orderDate = randomDate(lastDate, new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000));

      orders.push({
        id: generateId(),
        studentId: student.id,
        studentName: student.name,
        course: student.course,
        channel: student.channel,
        amount,
        hours,
        status: i === orderCount - 1 && student.status === 'refunded' ? 'refunded' : 'paid',
        payDate: formatDate(orderDate),
        createdAt: formatDate(orderDate),
        remark: '',
      });

      lastDate = orderDate;
    }
  });

  return orders.sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime());
};

export const generateMockLessons = (students: Student[]): LessonRecord[] => {
  const lessons: LessonRecord[] = [];

  students.forEach(student => {
    if (student.status === 'refunded') return;
    
    const lessonCount = getRandomInt(5, 30);
    let lastDate = new Date(student.enrollmentDate);
    const teacherForCourse = {
      '美术': ['李老师', '王老师'],
      '舞蹈': ['张老师', '刘老师'],
      '口才': ['陈老师', '杨老师'],
    }[student.course] || ['李老师'];

    for (let i = 0; i < lessonCount; i++) {
      const hours = getRandomInt(1, 2);
      const lessonDate = randomDate(lastDate, new Date(lastDate.getTime() + 14 * 24 * 60 * 60 * 1000));
      const startHour = getRandomInt(9, 18);
      const teacher = getRandomItem(teacherForCourse);

      lessons.push({
        id: generateId(),
        studentId: student.id,
        studentName: student.name,
        course: student.course,
        teacher,
        teacherId: teacher,
        hours,
        content: getRandomItem(['基础练习', '作品创作', '技巧提升', '考级辅导', '节目排练', '创意绘画', '形体训练', '演讲训练']),
        date: formatDate(lessonDate),
        startTime: `${startHour}:00`,
        endTime: `${startHour + hours}:00`,
        createdAt: formatDate(lessonDate),
      });

      lastDate = lessonDate;
    }
  });

  return lessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const generateMockRefunds = (students: Student[], orders: Order[]): Refund[] => {
  const refunds: Refund[] = [];
  const refundedStudents = students.filter(s => s.status === 'refunded');

  refundedStudents.forEach(student => {
    const studentOrders = orders.filter(o => o.studentId === student.id && o.status === 'paid');
    if (studentOrders.length === 0) return;
    
    const order = studentOrders[0];
    const refundHours = getRandomInt(5, order.hours);
    const amount = (refundHours / order.hours) * order.amount;
    const refundDate = randomDate(new Date(student.enrollmentDate), new Date());

    const reasonCategories = [
      '课程不满意',
      '时间安排冲突',
      '搬家/距离远',
      '孩子不感兴趣',
      '学习效果不佳',
      '其他原因'
    ];
    const reasonCategory = getRandomItem(reasonCategories);

    refunds.push({
      id: generateId(),
      studentId: student.id,
      studentName: student.name,
      orderId: order.id,
      course: student.course,
      amount: Math.round(amount),
      hours: refundHours,
      reason: reasonCategory + '：' + getRandomItem(['学员不适应课程节奏', '家长工作忙没时间接送', '搬家后距离太远', '孩子兴趣转移', '教学效果未达预期', '与其他课程时间冲突']),
      reasonCategory,
      status: 'completed',
      applyDate: formatDate(refundDate),
      confirmDate: formatDate(new Date(refundDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
      createdAt: formatDate(refundDate),
      remark: '',
    });
  });

  return refunds.sort((a, b) => new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime());
};

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: '美术',
    pricePerHour: 120,
    teacherCostPerHour: 60,
    status: 'active',
    description: '创意美术、素描、水彩、油画等多种绘画形式',
    color: '#FF7A45',
    icon: 'Palette',
  },
  {
    id: 'course-2',
    name: '舞蹈',
    pricePerHour: 150,
    teacherCostPerHour: 80,
    status: 'active',
    description: '中国舞、芭蕾舞、街舞、爵士舞等多种舞蹈形式',
    color: '#48BB78',
    icon: 'Music',
  },
  {
    id: 'course-3',
    name: '口才',
    pricePerHour: 100,
    teacherCostPerHour: 50,
    status: 'active',
    description: '演讲、主持、朗诵、表演等口才训练课程',
    color: '#4299E1',
    icon: 'Mic',
  },
];

export const mockChannels: Channel[] = [
  {
    id: 'channel-1',
    name: '短视频',
    type: 'short_video',
    cost: 50000,
    targetCount: 100,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    color: '#FF7A45',
  },
  {
    id: 'channel-2',
    name: '地推',
    type: 'ground_promotion',
    cost: 30000,
    targetCount: 50,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    color: '#48BB78',
  },
  {
    id: 'channel-3',
    name: '老客转介绍',
    type: 'referral',
    cost: 10000,
    targetCount: 30,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    color: '#4299E1',
  },
];

export const mockTeachers: Teacher[] = [
  { id: 't1', name: '李老师', course: '美术', hourlyRate: 60, status: 'active' },
  { id: 't2', name: '王老师', course: '美术', hourlyRate: 70, status: 'active' },
  { id: 't3', name: '张老师', course: '舞蹈', hourlyRate: 80, status: 'active' },
  { id: 't4', name: '刘老师', course: '舞蹈', hourlyRate: 90, status: 'active' },
  { id: 't5', name: '陈老师', course: '口才', hourlyRate: 50, status: 'active' },
  { id: 't6', name: '杨老师', course: '口才', hourlyRate: 60, status: 'active' },
  { id: 't7', name: '赵老师', course: '美术', hourlyRate: 65, status: 'inactive' },
  { id: 't8', name: '周老师', course: '舞蹈', hourlyRate: 75, status: 'inactive' },
];
