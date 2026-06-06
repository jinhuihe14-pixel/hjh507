import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Order, LessonRecord, Refund, Course, Channel, Teacher } from '../types';
import { generateMockStudents, generateMockOrders, generateMockLessons, generateMockRefunds, mockCourses, mockChannels, mockTeachers } from '../data/mockData';
import { generateId, formatDate } from '../utils';

interface DataState {
  students: Student[];
  orders: Order[];
  lessons: LessonRecord[];
  refunds: Refund[];
  courses: Course[];
  channels: Channel[];
  teachers: Teacher[];
  initialized: boolean;
  
  initData: () => void;
  
  addStudent: (student: {
    name: string;
    phone: string;
    age: number;
    gender: 'male' | 'female';
    parentName: string;
    course: string;
    channel: string;
    courses?: string[];
    status?: Student['status'];
    enrollmentDate?: string;
    remark?: string;
  }) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
  
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrdersByStudentId: (studentId: string) => Order[];
  
  addLesson: (lesson: Omit<LessonRecord, 'id' | 'createdAt'>) => void;
  updateLesson: (id: string, lesson: Partial<LessonRecord>) => void;
  deleteLesson: (id: string) => void;
  getLessonsByStudentId: (studentId: string) => LessonRecord[];
  
  addRefund: (refund: Omit<Refund, 'id' | 'createdAt'>) => void;
  updateRefund: (id: string, refund: Partial<Refund>) => void;
  deleteRefund: (id: string) => void;
  getRefundsByStudentId: (studentId: string) => Refund[];
  
  resetData: () => void;
}

const initialStudents = generateMockStudents(80);
const initialOrders = generateMockOrders(initialStudents);
const initialLessons = generateMockLessons(initialStudents);
const initialRefunds = generateMockRefunds(initialStudents, initialOrders);

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      students: initialStudents,
      orders: initialOrders,
      lessons: initialLessons,
      refunds: initialRefunds,
      courses: mockCourses,
      channels: mockChannels,
      teachers: mockTeachers,
      initialized: false,

      initData: () => {
        if (get().initialized) return;
        
        const state = get();
        let needsUpdate = false;
        const updatedStudents = state.students.map(student => {
          if (!student.courseHours || !student.courses) {
            needsUpdate = true;
            const courses = student.courses || [student.course];
            const courseHours = student.courseHours || {
              [student.course]: {
                remaining: student.remainingHours,
                total: student.totalHours,
              },
            };
            return { ...student, courses, courseHours };
          }
          return student;
        });
        
        const updatedRefunds = state.refunds.map(refund => {
          if (!refund.orderId) {
            needsUpdate = true;
            const studentOrders = state.orders.filter(o => 
              o.studentId === refund.studentId && o.course === refund.course
            );
            return { ...refund, orderId: studentOrders[0]?.id || '' };
          }
          return refund;
        });
        
        if (needsUpdate) {
          set({ students: updatedStudents, refunds: updatedRefunds });
        }
        
        set({ initialized: true });
      },

      addStudent: (student) => {
        const courseHours: Record<string, { remaining: number; total: number }> = {};
        (student.courses || [student.course]).forEach(c => {
          courseHours[c] = { remaining: 0, total: 0 };
        });
        const newStudent: Student = {
          ...student,
          courses: student.courses || [student.course],
          courseHours,
          remainingHours: 0,
          totalHours: 0,
          status: student.status || 'active',
          id: generateId(),
          createdAt: formatDate(new Date()),
          enrollmentDate: student.enrollmentDate || formatDate(new Date()),
        };
        set((state) => ({
          students: [newStudent, ...state.students],
        }));
      },

      updateStudent: (id, student) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...student } : s
          ),
        }));
      },

      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
        }));
      },

      getStudentById: (id) => {
        return get().students.find((s) => s.id === id);
      },

      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: generateId(),
          createdAt: formatDate(new Date()),
        };
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));
        
        if (order.status === 'paid') {
          const student = get().students.find(s => s.id === order.studentId);
          if (student) {
            const currentCourseHours = student.courseHours?.[order.course] || { remaining: 0, total: 0 };
            const newCourseHours = {
              ...student.courseHours,
              [order.course]: {
                remaining: currentCourseHours.remaining + order.hours,
                total: currentCourseHours.total + order.hours,
              },
            };
            
            const newCourses = student.courses?.includes(order.course) 
              ? student.courses 
              : [...(student.courses || []), order.course];
            
            const allRemaining = Object.values(newCourseHours).reduce((sum, ch) => sum + ch.remaining, 0);
            const allTotal = Object.values(newCourseHours).reduce((sum, ch) => sum + ch.total, 0);
            
            get().updateStudent(order.studentId, {
              remainingHours: allRemaining,
              totalHours: allTotal,
              status: 'active',
              courseHours: newCourseHours,
              courses: newCourses,
            });
          }
        }
      },

      updateOrder: (id, order) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...order } : o
          ),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));
      },

      getOrdersByStudentId: (studentId) => {
        return get().orders.filter((o) => o.studentId === studentId);
      },

      addLesson: (lesson) => {
        const newLesson: LessonRecord = {
          ...lesson,
          id: generateId(),
          createdAt: formatDate(new Date()),
        };
        set((state) => ({
          lessons: [newLesson, ...state.lessons],
        }));
        
        const student = get().students.find(s => s.id === lesson.studentId);
        if (student && student.courseHours?.[lesson.course]) {
          const currentCourseHours = student.courseHours[lesson.course];
          const newCourseHours = {
            ...student.courseHours,
            [lesson.course]: {
              ...currentCourseHours,
              remaining: Math.max(0, currentCourseHours.remaining - lesson.hours),
            },
          };
          
          const allRemaining = Object.values(newCourseHours).reduce((sum, ch) => sum + ch.remaining, 0);
          
          get().updateStudent(lesson.studentId, {
            remainingHours: allRemaining,
            courseHours: newCourseHours,
          });
        }
      },

      updateLesson: (id, lesson) => {
        set((state) => ({
          lessons: state.lessons.map((l) =>
            l.id === id ? { ...l, ...lesson } : l
          ),
        }));
      },

      deleteLesson: (id) => {
        const lesson = get().lessons.find(l => l.id === id);
        if (lesson) {
          const student = get().students.find(s => s.id === lesson.studentId);
          if (student) {
            get().updateStudent(lesson.studentId, {
              remainingHours: student.remainingHours + lesson.hours,
            });
          }
        }
        set((state) => ({
          lessons: state.lessons.filter((l) => l.id !== id),
        }));
      },

      getLessonsByStudentId: (studentId) => {
        return get().lessons.filter((l) => l.studentId === studentId);
      },

      addRefund: (refund) => {
        const newRefund: Refund = {
          ...refund,
          id: generateId(),
          createdAt: formatDate(new Date()),
        };
        set((state) => ({
          refunds: [newRefund, ...state.refunds],
        }));
        
        if (refund.status === 'completed' || refund.status === 'approved') {
          const student = get().students.find(s => s.id === refund.studentId);
          if (student && student.courseHours?.[refund.course]) {
            const currentCourseHours = student.courseHours[refund.course];
            const newRemaining = Math.max(0, currentCourseHours.remaining - refund.hours);
            const newCourseHours = {
              ...student.courseHours,
              [refund.course]: {
                ...currentCourseHours,
                remaining: newRemaining,
              },
            };
            
            const allRemaining = Object.values(newCourseHours).reduce((sum, ch) => sum + ch.remaining, 0);
            
            get().updateStudent(refund.studentId, {
              remainingHours: allRemaining,
              courseHours: newCourseHours,
            });
          }
        }
      },

      updateRefund: (id, refund) => {
        set((state) => ({
          refunds: state.refunds.map((r) =>
            r.id === id ? { ...r, ...refund } : r
          ),
        }));
        
        if (refund.status === 'completed') {
          const existingRefund = get().refunds.find(r => r.id === id);
          if (existingRefund && existingRefund.status !== 'completed') {
            const student = get().students.find(s => s.id === existingRefund.studentId);
            if (student) {
              get().updateStudent(existingRefund.studentId, {
                status: 'refunded',
                remainingHours: 0,
              });
            }
          }
        }
      },

      deleteRefund: (id) => {
        set((state) => ({
          refunds: state.refunds.filter((r) => r.id !== id),
        }));
      },

      getRefundsByStudentId: (studentId) => {
        return get().refunds.filter((r) => r.studentId === studentId);
      },

      resetData: () => {
        const students = generateMockStudents(80);
        const orders = generateMockOrders(students);
        const lessons = generateMockLessons(students);
        const refunds = generateMockRefunds(students, orders);
        set({
          students,
          orders,
          lessons,
          refunds,
          courses: mockCourses,
          channels: mockChannels,
          teachers: mockTeachers,
        });
      },
    }),
    {
      name: 'art-training-data',
      partialize: (state) => ({
        students: state.students,
        orders: state.orders,
        lessons: state.lessons,
        refunds: state.refunds,
        initialized: state.initialized,
      }),
    }
  )
);
