import { useState, useMemo } from 'react';
import { Search, Plus, Filter, Receipt, Download } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate, formatMoney, getStatusText, getStatusColor, cn } from '@/utils';
import { COURSE_LIST, CHANNEL_LIST } from '@/types';

export default function Orders() {
  const { orders } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState('');

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
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all">
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
