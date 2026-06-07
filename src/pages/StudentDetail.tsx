import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, BookOpen, Clock, DollarSign, Undo2, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate, formatMoney, getStatusText, getStatusColor, cn } from '@/utils';

const COURSE_COLORS: Record<string, string> = {
  '美术': '#FF7A45',
  '舞蹈': '#48BB78',
  '口才': '#4299E1',
};

function CircularProgress({ 
  consumed, total, color, size = 100, strokeWidth = 8 }: {
  consumed: number;
  total: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? (consumed / total) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-800">{Math.round(percentage)}%</span>
        <span className="text-xs text-gray-500">已消耗</span>
      </div>
    </div>
  );
}

function CourseLessonTimeline({ 
  course, 
  lessons, 
  color 
}: { 
  course: string; 
  lessons: any[];
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayLessons = expanded ? lessons : lessons.slice(0, 10);
  const hasMore = lessons.length > 10;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
          <h4 className="font-semibold text-gray-800">{course}</h4>
          <span className="text-xs text-gray-400 ml-auto">共 {lessons.length} 条记录</span>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {lessons.length > 0 ? (
          <div className="relative py-2">
            <div 
              className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100"
              style={{ marginLeft: 0 }}
            />
            <div className="space-y-0">
              {displayLessons.map((lesson, index) => (
                <div key={lesson.id} className="relative pl-14 pr-4 py-3 hover:bg-gray-50">
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{lesson.content}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lesson.teacher} · {lesson.startTime}-{lesson.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color }}>-{lesson.hours} 课时</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(lesson.date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无上课记录</p>
          </div>
        )}
      </div>
      
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 border-t border-gray-100 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              查看全部
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { getStudentById, getOrdersByStudentId, getLessonsByStudentId, getLessonsByStudentIdAndCourse, getRefundsByStudentId } = useDataStore();
  
  const student = getStudentById(id!);
  const orders = getOrdersByStudentId(id!);
  const lessons = getLessonsByStudentId(id!);
  const refunds = getRefundsByStudentId(id!);

  if (!student) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">未找到该学员信息</p>
        <Link to="/students" className="text-orange-500 hover:text-orange-600">
          返回学员列表
        </Link>
      </div>
    );
  }

  const totalPaid = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0);
  const totalRefunded = refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
  const consumedHours = student.totalHours - student.remainingHours;

  const courseEntries = student.courseHours ? Object.entries(student.courseHours) : [];

  return (
    <div className="space-y-6">
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回学员列表
      </Link>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <p className="text-white/80 mt-1">
                {student.parentName} · {student.age}岁 · {student.gender === 'male' ? '男' : '女'}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {student.channel}
                </span>
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm',
                  student.status === 'active' ? 'bg-green-400/30 text-green-100' : 'bg-white/20'
                )}>
                  {getStatusText(student.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-white/80 text-sm">总剩余课时</p>
            <p className="text-4xl font-bold mt-1">{student.remainingHours}</p>
            <p className="text-white/60 text-sm mt-1">
              已消耗 {consumedHours} / 总 {student.totalHours} 课时
            </p>
          </div>
        </div>
      </div>

      {courseEntries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800">课时进度</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseEntries.map(([course, hours]) => {
              const color = COURSE_COLORS[course] || '#FF7A45';
              const courseLessons = getLessonsByStudentIdAndCourse(student.id, course);
              const consumed = hours.total - hours.remaining;
              
              return (
                <div key={course} className="flex items-center gap-5 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/50 transition-colors">
                  <CircularProgress 
                    consumed={consumed} 
                    total={hours.total} 
                    color={color}
                    size={80}
                    strokeWidth={7}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{course}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">剩余</span>
                        <span className="font-medium text-gray-700">{hours.remaining} 课时</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">已消耗</span>
                        <span className="font-medium" style={{ color }}>{consumed} 课时</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">总计</span>
                        <span className="font-medium text-gray-700">{hours.total} 课时</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-800">联系信息</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">联系电话</span>
              <span className="text-gray-800 font-medium">{student.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">家长姓名</span>
              <span className="text-gray-800 font-medium">{student.parentName}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-800">报名信息</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">报名日期</span>
              <span className="text-gray-800 font-medium">{formatDate(student.enrollmentDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">报名渠道</span>
              <span className="text-gray-800 font-medium">{student.channel}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-800">消费统计</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">累计缴费</span>
              <span className="text-green-600 font-medium">{formatMoney(totalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">累计退费</span>
              <span className="text-red-500 font-medium">{formatMoney(totalRefunded)}</span>
            </div>
          </div>
        </div>
      </div>

      {courseEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">上课记录</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseEntries.map(([course]) => {
              const color = COURSE_COLORS[course] || '#FF7A45';
              const courseLessons = getLessonsByStudentIdAndCourse(student.id, course);
              return (
                <CourseLessonTimeline
                  key={course}
                  course={course}
                  lessons={courseLessons}
                  color={color}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-800">缴费记录</h3>
        </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">订单号</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">课程</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">课时</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">金额</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">缴费日期</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.course}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.hours} 课时</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{formatMoney(order.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.payDate)}</td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(order.status))}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Undo2 className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-800">退费记录</h3>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {refunds.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {refunds.map((refund) => (
                  <div key={refund.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{refund.reasonCategory}</p>
                        <p className="text-sm text-gray-500 mt-1">{refund.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-500">{formatMoney(refund.amount)}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(refund.applyDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Undo2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无退费记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
