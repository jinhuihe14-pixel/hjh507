import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sun,
  Snowflake,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatMoney, formatNumber, cn } from '@/utils';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MonthlyData {
  month: string;
  monthLabel: string;
  revenue: number;
  newStudents: number;
  totalStudents: number;
  lessonHours: number;
  refundAmount: number;
  teacherCost: number;
  otherCost: number;
  netProfit: number;
  profitMargin: number;
  isPeak: boolean;
  season: string;
}

export default function Reports() {
  const { students, orders, lessons, refunds } = useDataStore();
  const [selectedYear, setSelectedYear] = useState('2025');
  const [compareYear, setCompareYear] = useState('2024');

  const monthlyData = useMemo(() => {
    const months: MonthlyData[] = [];
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2025-12-31');

    let current = startOfMonth(startDate);
    const end = endOfMonth(endDate);

    let cumulativeStudents = 0;

    while (current <= end) {
      const monthStr = format(current, 'yyyy-MM');
      const monthLabel = format(current, 'M月', { locale: zhCN });

      const monthOrders = orders.filter(
        (o) => o.status === 'paid' && o.payDate.startsWith(monthStr)
      );
      const revenue = monthOrders.reduce((sum, o) => sum + o.amount, 0);

      const monthNewStudents = students.filter((s) => s.enrollmentDate.startsWith(monthStr));
      cumulativeStudents += monthNewStudents.length;

      const monthLessons = lessons.filter((l) => l.date.startsWith(monthStr));
      const lessonHours = monthLessons.reduce((sum, l) => sum + l.hours, 0);

      const monthRefunds = refunds.filter(
        (r) => r.status === 'completed' && r.applyDate.startsWith(monthStr)
      );
      const refundAmount = monthRefunds.reduce((sum, r) => sum + r.amount, 0);

      const teacherCost = lessonHours * 60;
      const otherCost = revenue * 0.15;
      const netProfit = revenue - teacherCost - otherCost - refundAmount;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      const monthNum = parseInt(monthStr.split('-')[1]);
      const isPeak = monthNum === 1 || monthNum === 2 || monthNum === 7 || monthNum === 8;
      let season = '';
      if (monthNum >= 3 && monthNum <= 5) season = '春季';
      else if (monthNum >= 6 && monthNum <= 8) season = '暑假';
      else if (monthNum >= 9 && monthNum <= 11) season = '秋季';
      else season = '寒假';

      months.push({
        month: monthStr,
        monthLabel,
        revenue,
        newStudents: monthNewStudents.length,
        totalStudents: cumulativeStudents,
        lessonHours,
        refundAmount,
        teacherCost,
        otherCost,
        netProfit,
        profitMargin,
        isPeak,
        season,
      });

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return months;
  }, [students, orders, lessons, refunds]);

  const yearData = useMemo(() => {
    return monthlyData.filter((m) => m.month.startsWith(selectedYear));
  }, [monthlyData, selectedYear]);

  const compareYearData = useMemo(() => {
    return monthlyData.filter((m) => m.month.startsWith(compareYear));
  }, [monthlyData, compareYear]);

  const yearSummary = useMemo(() => {
    const data = yearData;
    const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0);
    const totalNewStudents = data.reduce((sum, m) => sum + m.newStudents, 0);
    const totalLessonHours = data.reduce((sum, m) => sum + m.lessonHours, 0);
    const totalRefund = data.reduce((sum, m) => sum + m.refundAmount, 0);
    const totalTeacherCost = data.reduce((sum, m) => sum + m.teacherCost, 0);
    const totalOtherCost = data.reduce((sum, m) => sum + m.otherCost, 0);
    const totalNetProfit = totalRevenue - totalTeacherCost - totalOtherCost - totalRefund;
    const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalNewStudents,
      totalLessonHours,
      totalRefund,
      totalTeacherCost,
      totalOtherCost,
      totalNetProfit,
      profitMargin,
    };
  }, [yearData]);

  const peakSeasonData = useMemo(() => {
    const peakMonths = yearData.filter((m) => m.isPeak);
    const offPeakMonths = yearData.filter((m) => !m.isPeak);

    const peakAvgRevenue =
      peakMonths.length > 0
        ? peakMonths.reduce((sum, m) => sum + m.revenue, 0) / peakMonths.length
        : 0;
    const offPeakAvgRevenue =
      offPeakMonths.length > 0
        ? offPeakMonths.reduce((sum, m) => sum + m.revenue, 0) / offPeakMonths.length
        : 0;
    const revenueDiff = offPeakAvgRevenue > 0 ? ((peakAvgRevenue - offPeakAvgRevenue) / offPeakAvgRevenue) * 100 : 0;

    const peakAvgStudents =
      peakMonths.length > 0
        ? peakMonths.reduce((sum, m) => sum + m.newStudents, 0) / peakMonths.length
        : 0;
    const offPeakAvgStudents =
      offPeakMonths.length > 0
        ? offPeakMonths.reduce((sum, m) => sum + m.newStudents, 0) / offPeakMonths.length
        : 0;
    const studentDiff = offPeakAvgStudents > 0 ? ((peakAvgStudents - offPeakAvgStudents) / offPeakAvgStudents) * 100 : 0;

    return {
      peakAvgRevenue,
      offPeakAvgRevenue,
      revenueDiff,
      peakAvgStudents,
      offPeakAvgStudents,
      studentDiff,
    };
  }, [yearData]);

  const revenueCompareOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: [selectedYear + '年营收', compareYear + '年营收', selectedYear + '年净利润'],
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
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
        name: selectedYear + '年营收',
        type: 'line',
        smooth: true,
        data: yearData.map((m) => m.revenue),
        lineStyle: { color: '#FF7A45', width: 3 },
        itemStyle: { color: '#FF7A45' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 122, 69, 0.25)' },
              { offset: 1, color: 'rgba(255, 122, 69, 0.02)' },
            ],
          },
        },
        symbolSize: 6,
      },
      {
        name: compareYear + '年营收',
        type: 'line',
        smooth: true,
        data: compareYearData.map((m) => m.revenue),
        lineStyle: { color: '#4299E1', width: 2, type: 'dashed' },
        itemStyle: { color: '#4299E1' },
        symbolSize: 5,
      },
      {
        name: selectedYear + '年净利润',
        type: 'line',
        smooth: true,
        data: yearData.map((m) => m.netProfit),
        lineStyle: { color: '#48BB78', width: 2 },
        itemStyle: { color: '#48BB78' },
        symbolSize: 5,
      },
    ],
  }), [yearData, compareYearData, selectedYear, compareYear]);

  const studentCompareOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: [selectedYear + '年新增', compareYear + '年新增'],
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      name: '人数',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' },
    },
    series: [
      {
        name: selectedYear + '年新增',
        type: 'bar',
        data: yearData.map((m) => m.newStudents),
        barWidth: '30%',
        itemStyle: {
          color: '#FF7A45',
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: compareYear + '年新增',
        type: 'bar',
        data: compareYearData.map((m) => m.newStudents),
        barWidth: '30%',
        itemStyle: {
          color: '#4299E1',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  }), [yearData, compareYearData, selectedYear, compareYear]);

  const seasonChartOption = useMemo(() => {
    const seasons = ['寒假', '春季', '暑假', '秋季'];
    const seasonData = seasons.map((season) => {
      const seasonMonths = yearData.filter((m) => m.season === season);
      const totalRevenue = seasonMonths.reduce((sum, m) => sum + m.revenue, 0);
      const totalStudents = seasonMonths.reduce((sum, m) => sum + m.newStudents, 0);
      return { season, revenue: totalRevenue, students: totalStudents };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['营收', '新增学员'],
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
        data: seasonData.map((d) => d.season),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: [
        {
          type: 'value',
          name: '营收(元)',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#6b7280' },
        },
        {
          type: 'value',
          name: '学员数',
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#6b7280' },
        },
      ],
      series: [
        {
          name: '营收',
          type: 'bar',
          data: seasonData.map((d) => d.revenue),
          barWidth: '40%',
          itemStyle: {
            color: (params: any) => {
              const colors = ['#9F7AEA', '#48BB78', '#FF7A45', '#4299E1'];
              return colors[params.dataIndex];
            },
            borderRadius: [6, 6, 0, 0],
          },
          yAxisIndex: 0,
        },
        {
          name: '新增学员',
          type: 'line',
          data: seasonData.map((d) => d.students),
          smooth: true,
          lineStyle: { color: '#ED8936', width: 3 },
          itemStyle: { color: '#ED8936' },
          yAxisIndex: 1,
        },
      ],
    };
  }, [yearData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
          >
            <option value="2025">2025年</option>
            <option value="2024">2024年</option>
            <option value="2023">2023年</option>
          </select>
          <span className="text-gray-400">对比</span>
          <select
            value={compareYear}
            onChange={(e) => setCompareYear(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
          >
            <option value="2024">2024年</option>
            <option value="2023">2023年</option>
            <option value="2025">2025年</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">年度总营收</p>
              <p className="text-2xl font-bold mt-1">{formatMoney(yearSummary.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">新增学员</p>
              <p className="text-2xl font-bold mt-1">{formatNumber(yearSummary.totalNewStudents)} 人</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">年度净利润</p>
              <p className="text-2xl font-bold mt-1">{formatMoney(yearSummary.totalNetProfit)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">利润率</p>
              <p className="text-2xl font-bold mt-1">{yearSummary.profitMargin.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">营收趋势对比</h3>
            <p className="text-sm text-gray-500">
              {selectedYear}年与{compareYear}年营收对比
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <ReactECharts option={revenueCompareOption} style={{ height: '320px' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">新增学员对比</h3>
              <p className="text-sm text-gray-500">
                {selectedYear}年与{compareYear}年新增学员对比
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <ReactECharts option={studentCompareOption} style={{ height: '280px' }} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">淡旺季分析</h3>
              <p className="text-sm text-gray-500">各季节营收与招生对比</p>
            </div>
            <Sun className="w-5 h-5 text-orange-500" />
          </div>
          <ReactECharts option={seasonChartOption} style={{ height: '280px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-200 flex items-center justify-center">
              <Sun className="w-7 h-7 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-800">旺季平均</h3>
              <p className="text-sm text-orange-600 mt-1">寒暑假期间</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-orange-600">月均营收</p>
                  <p className="text-xl font-bold text-orange-800">
                    {formatMoney(peakSeasonData.peakAvgRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-orange-600">月均新增</p>
                  <p className="text-xl font-bold text-orange-800">
                    {Math.round(peakSeasonData.peakAvgStudents)} 人
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-200 flex items-center justify-center">
              <Snowflake className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-800">淡季平均</h3>
              <p className="text-sm text-blue-600 mt-1">非寒暑假期间</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-600">月均营收</p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatMoney(peakSeasonData.offPeakAvgRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">月均新增</p>
                  <p className="text-xl font-bold text-blue-800">
                    {Math.round(peakSeasonData.offPeakAvgStudents)} 人
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{selectedYear}年月度明细</h3>
            <p className="text-sm text-gray-500">各月经营数据详细报表</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">月份</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">营收</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">新增学员</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">课时消耗</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">师资成本</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">退费金额</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">净利润</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">利润率</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">季节</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {yearData.map((month) => (
                <tr
                  key={month.month}
                  className={cn('hover:bg-gray-50', month.isPeak && 'bg-orange-50/50')}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{month.monthLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {formatMoney(month.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {month.newStudents} 人
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {month.lessonHours} 课时
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {formatMoney(month.teacherCost)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-500">
                    {formatMoney(month.refundAmount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        'font-semibold',
                        month.netProfit >= 0 ? 'text-green-600' : 'text-red-500'
                      )}
                    >
                      {formatMoney(month.netProfit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        month.profitMargin >= 20
                          ? 'bg-green-100 text-green-700'
                          : month.profitMargin >= 10
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {month.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        month.isPeak
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      {month.season}
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
