import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color: string;
  bgGradient?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color,
  bgGradient,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        bgGradient || 'bg-white shadow-md'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-sm font-medium', bgGradient ? 'text-white/80' : 'text-gray-500')}>
            {title}
          </p>
          <h3 className={cn('text-3xl font-bold mt-2', bgGradient ? 'text-white' : 'text-gray-800')}>
            {value}
          </h3>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-3">
              {trend >= 0 ? (
                <TrendingUp className={cn('w-4 h-4', bgGradient ? 'text-white' : 'text-green-500')} />
              ) : (
                <TrendingDown className={cn('w-4 h-4', bgGradient ? 'text-white/80' : 'text-red-500')} />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  bgGradient ? 'text-white' : trend >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
              <span className={cn('text-xs', bgGradient ? 'text-white/70' : 'text-gray-400')}>
                {trendLabel || '较上月'}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            bgGradient
              ? 'bg-white/20 backdrop-blur-sm'
              : `bg-${color}-100`
          )}
        >
          <Icon
            className={cn(
              'w-7 h-7',
              bgGradient ? 'text-white' : `text-${color}-600`
            )}
            style={!bgGradient ? { color: color } : undefined}
          />
        </div>
      </div>

      <div
        className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
