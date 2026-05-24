import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface ChartProps {
  data: Record<string, unknown>[];
  height?: number;
}

interface AreaChartProps extends ChartProps {
  dataKey: string;
  xAxisKey?: string;
  gradient?: boolean;
}

export function AreaChartComponent({
  data,
  dataKey,
  xAxisKey = 'name',
  gradient = true,
  height = 300
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#64748b" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc'
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#3b82f6"
          strokeWidth={2}
          fill={gradient ? 'url(#colorGradient)' : '#3b82f6'}
          fillOpacity={gradient ? 1 : 0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BarChartProps extends ChartProps {
  dataKey: string;
  xAxisKey?: string;
  barColor?: string;
  horizontal?: boolean;
}

export function BarChartComponent({
  data,
  dataKey,
  xAxisKey = 'name',
  barColor = '#3b82f6',
  height = 300,
  horizontal = false
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey={xAxisKey} type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
          </>
        ) : (
          <>
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc'
          }}
        />
        <Bar 
          dataKey={dataKey} 
          fill={barColor}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface MultiBarChartProps extends ChartProps {
  dataKeys: { key: string; color: string; name?: string }[];
  xAxisKey?: string;
}

export function MultiBarChartComponent({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300
}: MultiBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc'
          }}
        />
        <Legend />
        {dataKeys.map((dk, index) => (
          <Bar 
            key={dk.key}
            dataKey={dk.key}
            name={dk.name || dk.key}
            fill={dk.color}
            radius={index === dataKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface LineChartProps extends ChartProps {
  lines: { dataKey: string; color: string; name?: string }[];
  xAxisKey?: string;
}

export function LineChartComponent({
  data,
  lines,
  xAxisKey = 'name',
  height = 300
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc'
          }}
        />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: line.color }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface PieChartProps extends ChartProps {
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  showLabel?: boolean;
}

export function PieChartComponent({
  data,
  dataKey,
  nameKey = 'name',
  innerRadius = 0,
  showLabel = true,
  height = 300
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={80}
          paddingAngle={2}
          dataKey={dataKey}
          nameKey={nameKey}
          label={showLabel ? ({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%` : false}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface DonutChartProps extends PieChartProps {
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChartComponent({
  data,
  dataKey,
  nameKey = 'name',
  centerLabel,
  centerValue,
  height = 300
}: DonutChartProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && <span className="text-2xl font-bold text-white">{centerValue}</span>}
          {centerLabel && <span className="text-sm text-surface-400">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
