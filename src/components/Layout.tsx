import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/utils';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: '数据看板', subtitle: '实时掌握机构经营动态' },
  '/students': { title: '学员管理', subtitle: '学员档案与课程进度管理' },
  '/orders': { title: '订单管理', subtitle: '缴费订单与收款记录' },
  '/lessons': { title: '课时记录', subtitle: '授课记录与课时消耗' },
  '/refunds': { title: '退费管理', subtitle: '退费申请与原因分析' },
  '/channels': { title: '渠道分析', subtitle: '招生渠道效果评估' },
  '/courses': { title: '课程分析', subtitle: '课程盈利情况分析' },
  '/reports': { title: '经营报表', subtitle: '月度经营与历史对比' },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const currentPath = Object.keys(pageTitles).find(
    (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  ) || '/dashboard';

  const { title, subtitle } = pageTitles[currentPath];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          collapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <Header title={title} subtitle={subtitle} />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
