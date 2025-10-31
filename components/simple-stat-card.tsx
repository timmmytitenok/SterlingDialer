'use client';

interface SimpleStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';
}

const colorClasses = {
  blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400 hover:border-blue-500/40 hover:shadow-blue-500/10',
  green: 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-400 hover:border-green-500/40 hover:shadow-green-500/10',
  red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400 hover:border-red-500/40 hover:shadow-red-500/10',
  orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400 hover:border-orange-500/40 hover:shadow-orange-500/10',
  purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400 hover:border-purple-500/40 hover:shadow-purple-500/10',
  yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400 hover:border-yellow-500/40 hover:shadow-yellow-500/10',
};

export function SimpleStatCard({ title, value, subtitle, icon, color }: SimpleStatCardProps) {
  const colorClass = colorClasses[color];

  return (
    <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-6 border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-gray-300 text-sm mb-1 font-medium">{title}</p>
      <p className={`text-4xl font-bold ${color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : color === 'orange' ? 'text-orange-400' : color === 'purple' ? 'text-purple-400' : 'text-yellow-400'}`}>
        {value}
      </p>
      <p className={`text-xs mt-1 ${color === 'blue' ? 'text-blue-400/60' : color === 'green' ? 'text-green-400/60' : color === 'red' ? 'text-red-400/60' : color === 'orange' ? 'text-orange-400/60' : color === 'purple' ? 'text-purple-400/60' : 'text-yellow-400/60'}`}>
        {subtitle}
      </p>
    </div>
  );
}

