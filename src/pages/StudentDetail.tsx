import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, BookOpen, Clock, DollarSign, Undo2, User } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate, formatMoney, getStatusText, getStatusColor, cn } from '@/utils';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { getStudentById, getOrdersByStudentId, getLessonsByStudentId, getRefundsByStudentId } = useDataStore();
  
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

        {student.courseHours && Object.keys(student.courseHours).length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/20">
            <p className="text-white/80 text-sm mb-3">各课程课时</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(student.courseHours).map(([course, hours]) => (
                <div key={course} className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-white/80 text-xs mb-1">{course}</p>
                  <p className="text-lg font-semibold">
                    剩余 {hours.remaining} <span className="text-white/60 text-sm font-normal">/ 总 {hours.total}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">课时记录</h3>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {lessons.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {lessons.slice(0, 10).map((lesson) => (
                  <div key={lesson.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{lesson.content}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {lesson.teacher} · {lesson.startTime}-{lesson.endTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-500">-{lesson.hours} 课时</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(lesson.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无课时记录</p>
              </div>
            )}
          </div>
        </div>

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
