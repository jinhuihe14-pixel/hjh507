import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { BookOpen, DollarSign, Users, Clock, TrendingUp, AlertTriangle, Palette, Music, Mic } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatMoney, cn } from '@/utils';

interface CourseData {
  id: string;
  name: string;
  color: string;
  icon: string;
  studentCount: number;
  revenue: number;
  lessonHours: number;
  teacherCost: number;
  otherCost: number;
  netProfit: number;
  profitMargin: number;
  avgPricePerHour: number;
}

const iconMap: Record<string, any> = {
  'Palette': Palette,
  'Music': Music,
  'Mic': Mic,
};

export default function CourseAnalysis() {
  const { students, orders, lessons, courses, teachers } = useDataStore();

  const courseAnalysis = useMemo((): CourseData[] => {
    return courses.map((course) => {
      const courseStudents = students.filter(
        (s) => s.course === course.name && s.status !== 'refunded'
      );
      const activeStudents = courseStudents.filter((s) => s.status === 'active');
      
      const courseOrders = orders.filter(
        (o) => o.course === course.name && o.status === 'paid'
      );
      const revenue = courseOrders.reduce((sum, o) => sum + o.amount, 0);
      
      const courseLessons = lessons.filter((l) => l.course === course.name);
      const lessonHours = courseLessons.reduce((sum, l) => sum + l.hours, 0);
      
      const courseTeachers = teachers.filter((t) => t.course === course.name && t.status === 'active');
      const teacherCost = lessonHours * course.teacherCostPerHour;
      
      const otherCost = revenue * 0.15;
      const totalCost = teacherCost + otherCost;
      const netProfit = revenue - totalCost;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      
      const avgPricePerHour = lessonHours > 0 ? revenue / lessonHours : 0;

      return {
        id: course.id,
        name: course.name,
        color: course.color,
        icon: course.icon,
        studentCount: activeStudents.length,
        revenue,
        lessonHours,
        teacherCost,
        otherCost,
        netProfit,
        profitMargin,
        avgPricePerHour,
      };
    });
  }, [students, orders, lessons, courses, teachers]);

  const lossCourses = courseAnalysis.filter((c) => c.netProfit < 0);

  const profitChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['营收', '师资成本', '其他成本', '净利润'],
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
      data: courseAnalysis.map((c) => c.name),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      name: '金额(元)',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' },
    },
    series: [
      {
        name: '营收',
        type: 'bar',
        data: courseAnalysis.map((c) => c.revenue),
        barWidth: '15%',
        itemStyle: {
          color: '#48BB78',
          borderRadius: [6, 6, 0, 0],
        },
      },
      {
        name: '师资成本',
        type: 'bar',
        data: courseAnalysis.map((c) => c.teacherCost),
        barWidth: '15%',
        itemStyle: {
          color: '#4299E1',
          borderRadius: [6, 6, 0, 0],
        },
      },
      {
        name: '其他成本',
        type: 'bar',
        data: courseAnalysis.map((c) => c.otherCost),
        barWidth: '15%',
        itemStyle: {
          color: '#9F7AEA',
          borderRadius: [6, 6, 0, 0],
        },
      },
      {
        name: '净利润',
        type: 'bar',
        data: courseAnalysis.map((c) => c.netProfit),
        barWidth: '15%',
        itemStyle: {
          color: (params: any) => params.value >= 0 ? '#FF7A45' : '#F56565',
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  }), [courseAnalysis]);

  const marginChartOption = useMemo(() => {
    const sortedByMargin = [...courseAnalysis].sort((a, b) => b.profitMargin - a.profitMargin);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: {c}%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '利润率(%)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: {
        type: 'category',
        data: sortedByMargin.map((c) => c.name),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      series: [
        {
          type: 'bar',
          data: sortedByMargin.map((c, i) => ({
            value: c.profitMargin.toFixed(1),
            itemStyle: {
              color: c.profitMargin >= 30 ? '#48BB78' : c.profitMargin >= 15 ? '#FF7A45' : '#F56565',
              borderRadius: [0, 6, 6, 0],
            },
          })),
          barWidth: '50%',
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#666',
            fontSize: 12,
          },
        },
      ],
    };
  }, [courseAnalysis]);

  const studentChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)',
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
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: courseAnalysis.map((c) => ({
            value: c.studentCount,
            name: c.name,
            itemStyle: { color: c.color },
          })),
      },
    ],
  }), [courseAnalysis]);

  const totalStats = useMemo(() => {
    const totalRevenue = courseAnalysis.reduce((sum, c) => sum + c.revenue, 0);
    const totalStudents = courseAnalysis.reduce((sum, c) => sum + c.studentCount, 0);
    const totalHours = courseAnalysis.reduce((sum, c) => sum + c.lessonHours, 0);
    const totalProfit = courseAnalysis.reduce((sum, c) => sum + c.netProfit, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalStudents, totalHours, totalProfit, avgMargin };
  }, [courseAnalysis]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="总营收"
          value={formatMoney(totalStats.totalRevenue)}
          icon={DollarSign}
          color="#48BB78"
        />
        <StatCard
          title="总学员数"
          value={`${totalStats.totalStudents} 人`}
          icon={Users}
          color="#4299E1"
        />
        <StatCard
          title="总课时"
          value={`${totalStats.totalHours} 课时`}
          icon={Clock}
          color="#FF7A45"
        />
        <StatCard
          title="净利润"
          value={formatMoney(totalStats.totalProfit)}
          icon={TrendingUp}
          color={totalStats.totalProfit >= 0 ? '#48BB78' : '#F56565'}
          trend={totalStats.avgMargin}
          trendLabel="利润率"
        />
      </div>

      {lossCourses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800">亏损课程预警</h4>
              <p className="text-sm text-red-700 mt-1">
                以下课程目前处于亏损状态，建议评估是否需要调整：
                <span className="font-medium ml-1">
                  {lossCourses.map((c) => c.name).join('、')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courseAnalysis.map((course) => {
          const IconComponent = iconMap[course.icon] || BookOpen;
          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className="h-32 relative overflow-hidden"
                style={{ backgroundColor: course.color + '15' }}
              >
                <div
                  className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20"
                  style={{ backgroundColor: course.color }}
                />
                <div
                  className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-20"
                  style={{ backgroundColor: course.color }}
                />
                <div className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{course.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{course.studentCount} 名学员</p>
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: course.color + '25' }}
                    >
                      <IconComponent className="w-7 h-7" style={{ color: course.color }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">营收</p>
                    <p className="text-lg font-bold text-green-600">{formatMoney(course.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">净利润</p>
                    <p className={cn('text-lg font-bold', course.netProfit >= 0 ? 'text-green-600' : 'text-red-500')}>
                      {formatMoney(course.netProfit)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">师资成本</span>
                    <span className="text-gray-700">{formatMoney(course.teacherCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">其他成本</span>
                    <span className="text-gray-700">{formatMoney(course.otherCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">利润率</span>
                    <span className={cn('font-semibold', course.profitMargin >= 30 ? 'text-green-600' : course.profitMargin >= 15 ? 'text-orange-500' : 'text-red-500')}>
                      {course.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>利润进度</span>
                    <span>目标 30%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(course.profitMargin, 100)}%`,
                        backgroundColor: course.profitMargin >= 30 ? '#48BB78' : course.profitMargin >= 15 ? '#FF7A45' : '#F56565',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">营收与利润对比</h3>
              <p className="text-sm text-gray-500">各课程收入成本分析</p>
            </div>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <ReactECharts option={profitChartOption} style={{ height: '300px' }} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">利润率排名</h3>
              <p className="text-sm text-gray-500">从高到低排序</p>
            </div>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <ReactECharts option={marginChartOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">课程详细数据</h3>
            <p className="text-sm text-gray-500">各课程核心指标对比</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">课程</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">学员数</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">总课时</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">营收</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">师资成本</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">其他成本</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">净利润</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">利润率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courseAnalysis.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: course.color + '20' }}
                      >
                        {(() => {
                          const Icon = iconMap[course.icon] || BookOpen;
                          return <Icon className="w-5 h-5" style={{ color: course.color }} />;
                        })()}
                      </div>
                      <span className="font-medium text-gray-800">{course.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-700">{course.studentCount}人</td>
                  <td className="px-4 py-4 text-right text-gray-700">{course.lessonHours}</td>
                  <td className="px-4 py-4 text-right font-medium text-green-600">{formatMoney(course.revenue)}</td>
                  <td className="px-4 py-4 text-right text-blue-600">{formatMoney(course.teacherCost)}</td>
                  <td className="px-4 py-4 text-right text-purple-600">{formatMoney(course.otherCost)}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={cn('font-semibold', course.netProfit >= 0 ? 'text-green-600' : 'text-red-500')}>
                      {formatMoney(course.netProfit)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                      course.profitMargin >= 30
                        ? 'bg-green-100 text-green-700'
                        : course.profitMargin >= 15
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    )}>
                      {course.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { LucideIcon } from 'lucide-react';

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendLabel,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend?: number;
  trendLabel?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {trend !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              {trendLabel}: <span className="font-medium" style={{ color }}>{trend.toFixed(1)}%</span>
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
