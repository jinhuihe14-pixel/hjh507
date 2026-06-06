import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, DollarSign, Clock, Undo2, TrendingUp, BookOpen } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatMoney, formatNumber } from '@/utils';
import StatCard from '@/components/StatCard';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';

export default function Dashboard() {
  const { students, orders, lessons, refunds, courses } = useDataStore();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = format(now, 'yyyy-MM');
    const lastMonth = format(subMonths(now, 1), 'yyyy-MM');

    const activeStudents = students.filter(s => s.status === 'active');
    
    const thisMonthOrders = orders.filter(o => o.status === 'paid' && o.payDate.startsWith(thisMonth));
    const lastMonthOrders = orders.filter(o => o.status === 'paid' && o.payDate.startsWith(lastMonth));
    
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.amount, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.amount, 0);
    const revenueTrend = lastMonthRevenue ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;

    const thisMonthNewStudents = students.filter(s => s.enrollmentDate.startsWith(thisMonth));
    const lastMonthNewStudents = students.filter(s => s.enrollmentDate.startsWith(lastMonth));
    const studentTrend = lastMonthNewStudents.length ? ((thisMonthNewStudents.length - lastMonthNewStudents.length) / lastMonthNewStudents.length * 100).toFixed(1) : 0;

    const thisMonthLessons = lessons.filter(l => l.date.startsWith(thisMonth));
    const lastMonthLessons = lessons.filter(l => l.date.startsWith(lastMonth));
    const lessonTrend = lastMonthLessons.length ? ((thisMonthLessons.length - lastMonthLessons.length) / lastMonthLessons.length * 100).toFixed(1) : 0;

    const thisMonthRefunds = refunds.filter(r => r.status === 'completed' && r.applyDate.startsWith(thisMonth));
    const lastMonthRefunds = refunds.filter(r => r.status === 'completed' && r.applyDate.startsWith(lastMonth));
    const thisMonthRefundAmount = thisMonthRefunds.reduce((sum, r) => sum + r.amount, 0);
    const lastMonthRefundAmount = lastMonthRefunds.reduce((sum, r) => sum + r.amount, 0);
    const refundTrend = lastMonthRefundAmount ? ((thisMonthRefundAmount - lastMonthRefundAmount) / lastMonthRefundAmount * 100).toFixed(1) : 0;

    return {
      totalStudents: activeStudents.length,
      totalRevenue: formatMoney(thisMonthRevenue),
      totalLessons: thisMonthLessons.reduce((sum, l) => sum + l.hours, 0),
      totalRefunds: formatMoney(thisMonthRefundAmount),
      studentTrend: parseFloat(studentTrend as string),
      revenueTrend: parseFloat(revenueTrend as string),
      lessonTrend: parseFloat(lessonTrend as string),
      refundTrend: parseFloat(refundTrend as string),
    };
  }, [students, orders, lessons, refunds]);

  const revenueChartOption = useMemo(() => {
    const months: string[] = [];
    const revenueData: number[] = [];
    const studentData: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'M月');
      months.push(monthLabel);

      const monthOrders = orders.filter(o => o.status === 'paid' && o.payDate.startsWith(monthStr));
      revenueData.push(monthOrders.reduce((sum, o) => sum + o.amount, 0));

      const monthStudents = students.filter(s => s.enrollmentDate.startsWith(monthStr));
      studentData.push(monthStudents.length);
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['营收', '新增学员'],
        right: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
        axisLine: {
          lineStyle: { color: '#e5e7eb' },
        },
        axisLabel: {
          color: '#6b7280',
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '营收(元)',
          axisLine: {
            show: false,
          },
          splitLine: {
            lineStyle: { color: '#f3f4f6' },
          },
          axisLabel: {
            color: '#6b7280',
          },
        },
        {
          type: 'value',
          name: '学员数',
          axisLine: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            color: '#6b7280',
          },
        },
      ],
      series: [
        {
          name: '营收',
          type: 'line',
          smooth: true,
          data: revenueData,
          yAxisIndex: 0,
          lineStyle: {
            color: '#FF7A45',
            width: 3,
          },
          itemStyle: {
            color: '#FF7A45',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 122, 69, 0.3)' },
                { offset: 1, color: 'rgba(255, 122, 69, 0.05)' },
              ],
            },
          },
        },
        {
          name: '新增学员',
          type: 'bar',
          data: studentData,
          yAxisIndex: 1,
          barWidth: '40%',
          itemStyle: {
            color: '#48BB78',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [orders, students]);

  const courseChartOption = useMemo(() => {
    const courseData = courses.map(course => {
      const courseStudents = students.filter(s => s.course === course.name && s.status === 'active');
      const courseOrders = orders.filter(o => o.course === course.name && o.status === 'paid');
      const revenue = courseOrders.reduce((sum, o) => sum + o.amount, 0);
      
      return {
        name: course.name,
        value: revenue,
        students: courseStudents.length,
        color: course.color,
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}元 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: courseData.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: { color: item.color },
          })),
        },
      ],
    };
  }, [courses, students, orders]);

  const channelChartOption = useMemo(() => {
    const channels = ['短视频', '地推', '老客转介绍'];
    const channelData = channels.map(channel => {
      const channelStudents = students.filter(s => s.channel === channel);
      const channelOrders = orders.filter(o => o.channel === channel && o.status === 'paid');
      const revenue = channelOrders.reduce((sum, o) => sum + o.amount, 0);
      return {
        channel,
        students: channelStudents.length,
        revenue,
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['学员数', '营收'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: channelData.map(d => d.channel),
        axisLine: {
          lineStyle: { color: '#e5e7eb' },
        },
        axisLabel: {
          color: '#6b7280',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: { color: '#f3f4f6' },
        },
        axisLabel: {
          color: '#6b7280',
        },
      },
      series: [
        {
          name: '学员数',
          type: 'bar',
          data: channelData.map(d => d.students),
          barWidth: '30%',
          itemStyle: {
            color: '#4299E1',
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '营收',
          type: 'bar',
          data: channelData.map(d => d.revenue / 100),
          barWidth: '30%',
          itemStyle: {
            color: '#FF7A45',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [students, orders]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="在读学员"
          value={formatNumber(stats.totalStudents)}
          icon={Users}
          trend={stats.studentTrend}
          trendLabel="较上月"
          color="#4299E1"
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="本月营收"
          value={stats.totalRevenue}
          icon={DollarSign}
          trend={stats.revenueTrend}
          trendLabel="较上月"
          color="#48BB78"
          bgGradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="本月课时"
          value={`${formatNumber(stats.totalLessons)} 课时`}
          icon={Clock}
          trend={stats.lessonTrend}
          trendLabel="较上月"
          color="#FF7A45"
          bgGradient="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="本月退费"
          value={stats.totalRefunds}
          icon={Undo2}
          trend={-stats.refundTrend}
          trendLabel="较上月"
          color="#F56565"
          bgGradient="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">营收趋势</h3>
              <p className="text-sm text-gray-500">近12个月营收与新增学员趋势</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">持续增长</span>
            </div>
          </div>
          <ReactECharts option={revenueChartOption} style={{ height: '320px' }} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">课程营收占比</h3>
              <p className="text-sm text-gray-500">各课程营收贡献</p>
            </div>
            <BookOpen className="w-5 h-5 text-orange-500" />
          </div>
          <ReactECharts option={courseChartOption} style={{ height: '320px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">渠道对比</h3>
              <p className="text-sm text-gray-500">各招生渠道效果对比</p>
            </div>
          </div>
          <ReactECharts option={channelChartOption} style={{ height: '280px' }} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">快捷操作</h3>
              <p className="text-sm text-gray-500">常用功能快速入口</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard
              icon={Users}
              title="新增学员"
              desc="录入新学员信息"
              color="#4299E1"
              to="/students"
            />
            <QuickActionCard
              icon={DollarSign}
              title="新增订单"
              desc="创建缴费订单"
              color="#48BB78"
              to="/orders"
            />
            <QuickActionCard
              icon={Clock}
              title="记录课时"
              desc="登记课时消耗"
              color="#FF7A45"
              to="/lessons"
            />
            <QuickActionCard
              icon={Undo2}
              title="申请退费"
              desc="办理退费手续"
              color="#F56565"
              to="/refunds"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

function QuickActionCard({
  icon: Icon,
  title,
  desc,
  color,
  to,
}: {
  icon: any;
  title: string;
  desc: string;
  color: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <h4 className="font-semibold text-gray-800 group-hover:text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}
