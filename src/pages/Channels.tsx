import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, Users, DollarSign, Target, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatMoney, cn } from '@/utils';

interface ChannelData {
  name: string;
  color: string;
  studentCount: number;
  cost: number;
  revenue: number;
  cac: number;
  roi: number;
  renewalRate: number;
  avgOrderValue: number;
}

export default function Channels() {
  const { students, orders, channels } = useDataStore();

  const channelAnalysis = useMemo(() => {
    const channelData: ChannelData[] = channels.map((channel) => {
      const channelStudents = students.filter((s) => s.channel === channel.name);
      const activeStudents = channelStudents.filter((s) => s.status === 'active');
      const channelOrders = orders.filter(
        (o) => o.channel === channel.name && o.status === 'paid'
      );
      const totalRevenue = channelOrders.reduce((sum, o) => sum + o.amount, 0);
      
      const multiOrderStudents = new Set(
        channelOrders
          .map((o) => o.studentId)
          .filter((id, index, arr) => arr.indexOf(id) !== index)
      ).size;
      
      const renewalRate = channelStudents.length > 0 
        ? Math.round((multiOrderStudents / channelStudents.length) * 100)
        : 0;

      const cac = channelStudents.length > 0 ? channel.cost / channelStudents.length : 0;
      const roi = channel.cost > 0 ? ((totalRevenue - channel.cost) / channel.cost) * 100 : 0;
      const avgOrderValue = channelOrders.length > 0 ? totalRevenue / channelOrders.length : 0;

      return {
        name: channel.name,
        color: channel.color,
        studentCount: channelStudents.length,
        cost: channel.cost,
        revenue: totalRevenue,
        cac,
        roi,
        renewalRate,
        avgOrderValue,
      };
    });

    return channelData;
  }, [students, orders, channels]);

  const isLowEfficiency = channelAnalysis.filter((c) => c.roi < 100);

  const roiChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['投入成本', '产出营收', 'ROI'],
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
      data: channelAnalysis.map((c) => c.name),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' },
      },
      {
        type: 'value',
        name: 'ROI(%)',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#6b7280' },
      },
    ],
    series: [
      {
        name: '投入成本',
        type: 'bar',
        data: channelAnalysis.map((c) => c.cost),
        barWidth: '25%',
        itemStyle: {
          color: '#9F7AEA',
          borderRadius: [6, 6, 0, 0],
        },
      },
      {
        name: '产出营收',
        type: 'bar',
        data: channelAnalysis.map((c) => c.revenue),
        barWidth: '25%',
        itemStyle: {
          color: '#48BB78',
          borderRadius: [6, 6, 0, 0],
        },
      },
      {
        name: 'ROI',
        type: 'line',
        yAxisIndex: 1,
        data: channelAnalysis.map((c) => c.roi.toFixed(1)),
        smooth: true,
        lineStyle: {
          color: '#FF7A45',
          width: 3,
        },
        itemStyle: {
          color: '#FF7A45',
        },
        symbolSize: 8,
      },
    ],
  }), [channelAnalysis]);

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
        data: channelAnalysis.map((c) => ({
            value: c.studentCount,
            name: c.name,
            itemStyle: { color: c.color },
          })),
      },
    ],
  }), [channelAnalysis]);

  const cacChartOption = useMemo(() => {
    const sortedByCac = [...channelAnalysis].sort((a, b) => a.cac - b.cac);
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
        type: 'value',
        name: '获客成本(元/人)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: {
        type: 'category',
        data: sortedByCac.map((c) => c.name),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      series: [
        {
          type: 'bar',
          data: sortedByCac.map((c, i) => ({
            value: Math.round(c.cac),
            itemStyle: {
              color: i === 0 ? '#48BB78' : i === sortedByCac.length - 1 ? '#F56565' : '#4299E1',
              borderRadius: [0, 6, 6, 0],
            },
          })),
          barWidth: '50%',
          label: {
            show: true,
            position: 'right',
            formatter: '{c}元',
            color: '#666',
            fontSize: 12,
          },
        },
      ],
    };
  }, [channelAnalysis]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channelAnalysis.map((channel) => (
          <div
            key={channel.name}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div
              className="h-3"
              style={{ backgroundColor: channel.color }}
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">{channel.name}</h3>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: channel.color + '20' }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: channel.color }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">报名人数</p>
                  <p className="text-xl font-bold text-gray-800">{channel.studentCount} 人</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">获客成本</p>
                  <p className="text-xl font-bold text-gray-800">{formatMoney(Math.round(channel.cac))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">续费率</p>
                  <p className="text-xl font-bold text-green-600">{channel.renewalRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">投产比</p>
                  <p className={cn('text-xl font-bold', channel.roi >= 100 ? 'text-green-600' : 'text-red-500')}>
                    {channel.roi.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">投入成本</span>
                  <span className="text-gray-700 font-medium">{formatMoney(channel.cost)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">产出营收</span>
                  <span className="text-green-600 font-medium">{formatMoney(channel.revenue)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLowEfficiency.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800">低效渠道提醒</h4>
              <p className="text-sm text-yellow-700 mt-1">
                以下渠道投产比低于100%，建议评估是否继续投放：
                <span className="font-medium ml-1">
                  {isLowEfficiency.map((c) => c.name).join('、')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">投入产出对比</h3>
              <p className="text-sm text-gray-500">各渠道成本与收益对比</p>
            </div>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <ReactECharts option={roiChartOption} style={{ height: '300px' }} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">学员来源分布</h3>
              <p className="text-sm text-gray-500">各渠道学员占比</p>
            </div>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <ReactECharts option={studentChartOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">获客成本排名</h3>
              <p className="text-sm text-gray-500">从低到高排序</p>
            </div>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <ReactECharts option={cacChartOption} style={{ height: '280px' }} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">渠道效果详情</h3>
              <p className="text-sm text-gray-500">详细数据对比</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-sm font-semibold text-gray-500">渠道</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-500">人数</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-500">获客成本</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-500">续费率</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-500">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {channelAnalysis.map((channel) => (
                <tr key={channel.name} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: channel.color }}
                      />
                      <span className="font-medium text-gray-800">{channel.name}</span>
                    </div>
                  </td>
                  <td className="text-right text-gray-700">{channel.studentCount}人</td>
                  <td className="text-right text-gray-700">{formatMoney(Math.round(channel.cac))}</td>
                  <td className="text-right">
                    <span className={cn(
                      'inline-flex items-center gap-1',
                      channel.renewalRate >= 30 ? 'text-green-600' : 'text-orange-500'
                    )}>
                      {channel.renewalRate >= 30 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {channel.renewalRate}%
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={cn(
                      'font-semibold',
                      channel.roi >= 100 ? 'text-green-600' : 'text-red-500'
                    )}>
                      {channel.roi.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
