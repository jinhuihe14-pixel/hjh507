import { useState, useMemo } from 'react';
import { Search, Plus, Filter, Undo2, AlertTriangle, PieChart, X, User } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate, formatMoney, getStatusText, getStatusColor, cn } from '@/utils';
import { COURSE_LIST, REFUND_REASONS } from '@/types';

export default function Refunds() {
  const { refunds, students, orders, addRefund } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    orderId: '',
    amount: '',
    reason: '',
    reasonCategory: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredRefunds = useMemo(() => {
    return refunds.filter((refund) => {
      if (searchTerm && !refund.studentName.includes(searchTerm)) {
        return false;
      }
      if (filterCourse && refund.course !== filterCourse) {
        return false;
      }
      if (filterStatus && refund.status !== filterStatus) {
        return false;
      }
      if (filterReason && refund.reasonCategory !== filterReason) {
        return false;
      }
      return true;
    });
  }, [refunds, searchTerm, filterCourse, filterStatus, filterReason]);

  const stats = useMemo(() => {
    const completedRefunds = refunds.filter(r => r.status === 'completed');
    const totalRefundAmount = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
    const totalRefundHours = completedRefunds.reduce((sum, r) => sum + r.hours, 0);
    const pendingRefunds = refunds.filter(r => r.status === 'pending').length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthRefunds = completedRefunds.filter(r => r.applyDate.startsWith(thisMonth));
    const monthRefundAmount = monthRefunds.reduce((sum, r) => sum + r.amount, 0);

    return { totalRefundAmount, totalRefundHours, pendingRefunds, monthRefundAmount, refundCount: completedRefunds.length };
  }, [refunds]);

  const getOrderRefundedAmount = (orderId: string): number => {
    return refunds
      .filter(r => r.orderId === orderId && (r.status === 'completed' || r.status === 'approved'))
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const selectedStudent = useMemo(() => {
    if (!formData.studentId) return null;
    return students.find(s => s.id === formData.studentId);
  }, [students, formData.studentId]);

  const studentOrders = useMemo(() => {
    if (!formData.studentId) return [];
    return orders.filter(o => o.studentId === formData.studentId && o.status === 'paid');
  }, [orders, formData.studentId]);

  const selectedOrder = useMemo(() => {
    if (!formData.orderId) return null;
    return orders.find(o => o.id === formData.orderId);
  }, [orders, formData.orderId]);

  const unrefundedAmount = useMemo(() => {
    if (!selectedOrder) return 0;
    const refunded = getOrderRefundedAmount(selectedOrder.id);
    return Math.max(0, selectedOrder.amount - refunded);
  }, [selectedOrder, refunds]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) {
      newErrors.studentId = '请选择学员';
    }
    if (!formData.orderId) {
      newErrors.orderId = '请选择订单';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = '请输入有效退费金额';
    } else if (selectedOrder && parseFloat(formData.amount) > unrefundedAmount) {
      newErrors.amount = `退费金额不能超过未退金额 ¥${unrefundedAmount}`;
    }
    if (!formData.reasonCategory) {
      newErrors.reasonCategory = '请选择退费原因';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !selectedStudent || !selectedOrder) return;

    const refundAmount = parseFloat(formData.amount);
    const refundHours = Math.round((refundAmount / selectedOrder.amount) * selectedOrder.hours * 100) / 100;

    addRefund({
      studentId: formData.studentId,
      studentName: selectedStudent.name,
      orderId: formData.orderId,
      course: selectedOrder.course,
      amount: refundAmount,
      hours: refundHours,
      reason: formData.reason || formData.reasonCategory,
      reasonCategory: formData.reasonCategory,
      status: 'completed',
      applyDate: formatDate(new Date()),
      confirmDate: formatDate(new Date()),
      remark: '',
    });

    setShowAddModal(false);
    setFormData({
      studentId: '',
      orderId: '',
      amount: '',
      reason: '',
      reasonCategory: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'studentId') {
      setFormData(prev => ({ ...prev, orderId: '', amount: '' }));
    }
  };

  const reasonChartOption = useMemo(() => {
    const reasonStats: Record<string, { count: number; amount: number }> = {};
    
    refunds.forEach((refund) => {
      if (!reasonStats[refund.reasonCategory]) {
        reasonStats[refund.reasonCategory] = { count: 0, amount: 0 };
      }
      reasonStats[refund.reasonCategory].count++;
      reasonStats[refund.reasonCategory].amount += refund.amount;
    });

    const colors = ['#FF7A45', '#48BB78', '#4299E1', '#9F7AEA', '#F56565', '#ED8936', '#38B2AC', '#ECC94B', '#9B9B9B'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          fontSize: 12,
          color: '#666',
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: Object.entries(reasonStats).map(([name, data], index) => ({
            value: data.count,
            name,
            itemStyle: { color: colors[index % colors.length] },
          })),
        },
      ],
    };
  }, [refunds]);

  const courseRefundChartOption = useMemo(() => {
    const courseStats: Record<string, { count: number; amount: number }> = {};
    
    refunds.forEach((refund) => {
      if (!courseStats[refund.course]) {
        courseStats[refund.course] = { count: 0, amount: 0 };
      }
      courseStats[refund.course].count++;
      courseStats[refund.course].amount += refund.amount;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: Object.keys(courseStats),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: {
        type: 'value',
        name: '退费金额(元)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' },
      },
      series: [
        {
          type: 'bar',
          data: Object.values(courseStats).map((d, i) => ({
            value: d.amount,
            itemStyle: {
              color: ['#FF7A45', '#48BB78', '#4299E1'][i % 3],
              borderRadius: [6, 6, 0, 0],
            },
          })),
          barWidth: '50%',
        },
      ],
    };
  }, [refunds]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="累计退费" value={formatMoney(stats.totalRefundAmount)} icon={Undo2} color="#F56565" />
        <StatCard title="退费人次" value={`${stats.refundCount} 人次`} icon={AlertTriangle} color="#ED8936" />
        <StatCard title="退费课时" value={`${stats.totalRefundHours} 课时`} icon={Undo2} color="#9F7AEA" />
        <StatCard title="待处理" value={`${stats.pendingRefunds} 单`} icon={AlertTriangle} color="#ECC94B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800">退费原因分布</h3>
          </div>
          <ReactECharts option={reasonChartOption} style={{ height: '240px' }} />
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">各课程退费金额</h3>
          </div>
          <ReactECharts option={courseRefundChartOption} style={{ height: '240px' }} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员姓名..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="completed">已完成</option>
            </select>

            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            >
              <option value="">全部原因</option>
              {REFUND_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          申请退费
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  退费单号
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  学员
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  课程
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  退费金额
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  退费课时
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  退费原因
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  申请日期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-600">{refund.id.slice(0, 10).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                        {refund.studentName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{refund.studentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {refund.course}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-red-500">-{formatMoney(refund.amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{refund.hours} 课时</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 max-w-xs truncate block">{refund.reasonCategory}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(refund.applyDate)}</td>
                  <td className="px-6 py-4">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(refund.status))}>
                      {getStatusText(refund.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRefunds.length === 0 && (
          <div className="py-12 text-center">
            <Undo2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无退费记录</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl">
        <p className="text-sm text-gray-500">
          共 {filteredRefunds.length} 条退费记录
        </p>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">申请退费</h3>
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
                <select
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                    errors.studentId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                >
                  <option value="">请选择学员</option>
                  {students.filter(s => s.status !== 'refunded').map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.phone}
                    </option>
                  ))}
                </select>
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择订单 <span className="text-red-500">*</span></label>
                <select
                  value={formData.orderId}
                  onChange={(e) => handleInputChange('orderId', e.target.value)}
                  disabled={!formData.studentId}
                  className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed',
                    errors.orderId ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                >
                  <option value="">请选择订单</option>
                  {studentOrders.map((order) => {
                    const refunded = getOrderRefundedAmount(order.id);
                    const remaining = Math.max(0, order.amount - refunded);
                    return (
                      <option key={order.id} value={order.id}>
                        {order.course} - {order.hours}课时 - ¥{order.amount}（未退¥{remaining}）
                      </option>
                    );
                  })}
                </select>
                {errors.orderId && <p className="text-xs text-red-500 mt-1">{errors.orderId}</p>}
              </div>

              {selectedOrder && (
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>订单课程：<span className="font-medium text-gray-800">{selectedOrder.course}</span></p>
                    <p>订单金额：<span className="font-medium text-gray-800">¥{selectedOrder.amount}</span></p>
                    <p>购买课时：<span className="font-medium text-gray-800">{selectedOrder.hours} 课时</span></p>
                    <p>未退金额：<span className="font-medium text-orange-600">¥{unrefundedAmount}</span></p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退费金额（元） <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="请输入退费金额"
                  className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                    errors.amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                {selectedOrder && formData.amount && parseFloat(formData.amount) > 0 && !errors.amount && (
                  <p className="text-xs text-gray-500 mt-1">
                    预计退费课时：<span className="font-medium text-orange-600">
                      {Math.round((parseFloat(formData.amount) / selectedOrder.amount) * selectedOrder.hours * 100) / 100} 课时
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退费原因 <span className="text-red-500">*</span></label>
                <select
                  value={formData.reasonCategory}
                  onChange={(e) => handleInputChange('reasonCategory', e.target.value)}
                  className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                    errors.reasonCategory ? 'border-red-300 focus:ring-red-500' : 'border-gray-200')}
                >
                  <option value="">请选择退费原因</option>
                  {REFUND_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
                {errors.reasonCategory && <p className="text-xs text-red-500 mt-1">{errors.reasonCategory}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">详细说明</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="请输入详细说明（选填）"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
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
