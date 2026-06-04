import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

interface PerformanceTrendProps {
  data: Array<{
    name: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

export function WeeklyTrendChart({ data }: PerformanceTrendProps) {
  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 p-5 mt-4 transition-colors font-sans">
      <h3 className="text-base font-semibold tracking-tight text-slate-805 dark:text-slate-100 font-sans mb-4">
        Weekly Attendance Distribution
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                color: '#f8fafc',
                border: 'none', 
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
              }} 
            />
            <Legend 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface DistributionProps {
  present: number;
  absent: number;
  late: number;
}

export function DistributionPieChart({ present, absent, late }: DistributionProps) {
  const total = present + absent + late;
  const data = [
    { name: 'Present', value: total > 0 ? present : 80, color: '#22c55e' },
    { name: 'Late', value: total > 0 ? late : 12, color: '#f59e0b' },
    { name: 'Absent', value: total > 0 ? absent : 8, color: '#ef4444' }
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 p-5 transition-colors flex flex-col justify-between font-sans">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-slate-805 dark:text-slate-100 font-sans">
          Attendance Breakdown
        </h3>
        <p className="text-xs text-slate-500 mt-1">Status distribution count metrics.</p>
      </div>

      <div className="relative flex justify-center items-center h-48 my-4 font-sans">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                color: '#f8fafc',
                border: 'none', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute text-center flex flex-col items-center">
          <span className="text-2xl font-bold font-sans text-slate-805 dark:text-slate-100">
            {total > 0 ? Math.round(((present + late) / total) * 100) : 88}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Present Rate</span>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-150 dark:border-slate-850 font-mono text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.value} records</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DeptChartProps {
  data: Array<{ department: string; rate: number }>;
}

export function DepartmentPerformanceChart({ data }: DeptChartProps) {
  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 p-5 transition-colors font-sans">
      <h3 className="text-base font-semibold tracking-tight text-slate-805 dark:text-slate-100 font-sans mb-1">
        Department Comparison
      </h3>
      <p className="text-xs text-slate-500 mb-4 inline-block">Average presence percentage index per department.</p>
      
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0058be" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#0058be" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
            <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                color: '#f8fafc',
                border: 'none', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="rate" 
              name="Attendance Rate (%)" 
              stroke="#0058be" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRate)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
