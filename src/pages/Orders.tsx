import { useState, useMemo } from 'react';
import { Search, Plus, Filter, Receipt, Download, X } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate, formatMoney, getStatusText, getStatusColor, cn } from '@/utils';
import { COURSE_LIST, CHANNEL_LIST } from '@/types';

export default function Orders() {
  const { orders, students, courses, addOrder } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    studentSearch: '',
    studentId: '',
    course: '',
    amount: '',
    hours: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchTerm && !order.studentName.includes(searchTerm) && !order.id.includes(searchTerm)) {
        return false;
      }
      if (filterCourse && order.course !== filterCourse) {
        return false;
      }
      if (filterChannel && order.channel !== filterChannel) {
        return false;
      }
      if (filterStatus && order.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [orders, searchTerm, filterCourse, filterChannel, filterStatus]);

  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalHours = paidOrders.reduce((sum, o) => sum + o.hours, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = paidOrders.filter(o => o.payDate === today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.amount, 0);

    return { totalRevenue, totalHours, todayRevenue, orderCount: paidOrders.length };
  }, [orders]);

  const searchedStudents = useMemo(() => {
    if (!formData.studentSearch.trim()) return [];
    const term = formData.studentSearch.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(term) || s.phone.includes(term)
    ).slice(0, 8);
  }, [students, formData.studentSearch]);

  const selectedStudent = useMemo(() => {
    if (!formData.studentId) return null;
    return students.find(s => s.id === formData.studentId);
  }, [students, formData.studentId]);

  const selectedCourse = useMemo(() => {
    if (!formData.course) return null;
    return courses.find(c => c.name === formData.course);
  }, [courses, formData.course]);

  const handleSelectStudent = (student: typeof students[0]) => {
    setFormData(prev => ({
      ...prev,
      studentId: student.id,
      studentSearch: student.name,
    }));
    setShowStudentDropdown(false);
    if (errors.studentId) {
      setErrors(prev => ({ ...prev, studentId: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) {
      newErrors.studentId = '请选择学员';
    }
    if (!formData.course) {
      newErrors.course = '请选择课程';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = '请输入有效缴费金额';
    }
    if (!formData.hours || parseInt(formData.hours) <= 0) {
      newErrors.hours = '请输入有效课时数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !selectedStudent) return;

    addOrder({
      studentId: formData.studentId,
      studentName: selectedStudent.name,
      course: formData.course,
      channel: selectedStudent.channel,
      amount: parseFloat(formData.amount),
      hours: parseInt(formData.hours),
      status: 'paid',
      payDate: formatDate(new Date()),
      remark: '',
    });

    setShowAddModal(false);
    setFormData({
      studentSearch: '',
      studentId: '',
      course: '',
      amount: '',
      hours: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'studentSearch') {
      setShowStudentDropdown(true);
      if (value && formData.studentId) {
        setFormData(prev => ({ ...prev, studentId: '' }));
      }
    }
  };

  const autoCalculateAmount = () => {
    if (selectedCourse && formData.hours && parseInt(formData.hours) > 0) {
      const amount = selectedCourse.pricePerHour * parseInt(formData.hours);
      setFormData(prev => ({ ...prev, amount: amount.toString() }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="累计营收" value={formatMoney(stats.totalRevenue)} icon={Receipt} color="#48BB78" />
        <StatCard title="订单数量" value={`${stats.orderCount} 单`} icon={Receipt} color="#4299E1" />
        <StatCard title="累计课时" value={`${stats.totalHours} 课时`} icon={Receipt} color="#FF7A45" />
        <StatCard title="今日营收" value={formatMoney(stats.todayRevenue)} icon={Receipt} color="#9F7AEA" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员姓名或订单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部课程</option>
              {COURSE_LIST.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部渠道</option>
              {CHANNEL_LIST.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部状态</option>
              <option value="paid">已支付</option>
              <option value="pending">待处理</option>
              <option value="cancelled">已取消</option>
              <option value="refunded">已退费</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            新增订单
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  学员
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课程
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  渠道
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课时
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  缴费日期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-600">{order.id.slice(0, 10).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                        {order.studentName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{order.studentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {order.course}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{order.channel}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{formatMoney(order.amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{order.hours} 课时</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(order.payDate)}</td>
                  <td className="px-6 py-4">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(order.status))}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无订单数据</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl">
        <p className="text-sm text-gray-500">
          共 {filteredOrders.length} 条订单记录
        </p>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">新增订单</h3>
              <button
                onClick={() => { setShowAddModal(false); setErrors({}); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择学员 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.studentSearch}
                    onChange={(e) => handleInputChange('studentSearch', e.target.value)}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="输入学员姓名或电话搜索..."
                    className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      errors.studentId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  />
                  {showStudentDropdown && searchedStudents.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      {searchedStudents.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.phone} · {student.course}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showStudentDropdown && formData.studentSearch && searchedStudents.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4 text-center text-gray-500 text-sm">
                      未找到匹配的学员
                    </div>
                  )}
                </div>
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
              </div>

              {selectedStudent && (
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-sm text-gray-600">
                    已选学员：<span className="font-medium text-gray-800">{selectedStudent.name}</span>
                    <span className="text-gray-400 mx-2">|</span>
                    {selectedStudent.phone}
                    <span className="text-gray-400 mx-2">|</span>
                    总剩余课时：<span className="font-medium text-orange-600">{selectedStudent.remainingHours}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程 <span className="text-red-500">*</span></label>
                <select
                  value={formData.course}
                  onChange={(e) => { handleInputChange('course', e.target.value); }}
                  className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                    errors.course ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                >
                  <option value="">请选择课程</option>
                  {COURSE_LIST.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
                {errors.course && <p className="text-xs text-red-500 mt-1">{errors.course}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">购买课时数 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => { handleInputChange('hours', e.target.value); autoCalculateAmount(); }}
                    placeholder="请输入课时数"
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      errors.hours ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  />
                  {errors.hours && <p className="text-xs text-red-500 mt-1">{errors.hours}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">缴费金额（元） <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="请输入金额"
                    className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      errors.amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>
              </div>

              {selectedCourse && formData.hours && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-gray-600">
                    {formData.course} 单价：<span className="font-medium">¥{selectedCourse.pricePerHour}/课时</span>
                    <span className="text-gray-400 mx-2">|</span>
                    计算金额：<span className="font-medium text-blue-600">¥{selectedCourse.pricePerHour * parseInt(formData.hours || '0')}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => { setShowAddModal(false); setErrors({}); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { LucideIcon } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: LucideIcon; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
