import React, { memo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  ReferenceLine, Label
} from 'recharts';
import { 
  CHART_CONTAINER_CLASSES,
  INFO_TILE_CLASSES,
  TEXT_DESCRIPTION_CLASSES,
  TEXT_VALUE_CLASSES
} from './styles';

interface LineChartProps {
  data: any[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
    activeDot?: boolean;
  }[];
  formatXAxis?: (value: string) => string;
  yAxisMax?: number;
  customTooltip?: any;
}

export const AttendanceLineChart: React.FC<LineChartProps> = ({ 
  data, 
  lines,
  formatXAxis,
  yAxisMax,
  customTooltip
}) => {
  const CustomizedXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    // Apply formatter if available
    const value = formatXAxis ? formatXAxis(payload.value) : payload.value;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill="currentColor" 
          fontSize={11}
        >
          {value}
        </text>
      </g>
    );
  };
  
  const DefaultCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedLabel = formatXAxis ? formatXAxis(label) : label;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{formattedLabel}</p>
          <div className="flex flex-col space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center">
                <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#777" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            tick={formatXAxis ? <CustomizedXAxisTick /> : { fill: 'currentColor' }} 
            axisLine={{ stroke: '#777' }}
            tickLine={{ stroke: '#777' }}
            height={30}
          />
          <YAxis 
            tick={{ fill: 'currentColor' }} 
            axisLine={{ stroke: '#777' }}
            tickLine={{ stroke: '#777' }}
            domain={yAxisMax ? [0, yAxisMax] : [0, 'auto']}
          />
          <Tooltip content={customTooltip || <DefaultCustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ paddingTop: '10px' }}
          />
          {lines.map((line, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={line.dataKey} 
              name={line.name} 
              stroke={line.color} 
              activeDot={line.activeDot ? { r: 8 } : undefined} 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface BarChartProps {
  data: any[];
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  average?: number;
}

export const AttendanceBarChart: React.FC<BarChartProps> = ({ data, bars, average }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{label}</p>
          <div className="flex flex-col space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center">
                <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={CHART_CONTAINER_CLASSES}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#777" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'currentColor' }} 
            axisLine={{ stroke: '#777' }}
            tickLine={{ stroke: '#777' }}
          />
          <YAxis 
            tick={{ fill: 'currentColor' }} 
            axisLine={{ stroke: '#777' }}
            tickLine={{ stroke: '#777' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {bars.map((bar, index) => (
            <Bar 
              key={index}
              dataKey={bar.dataKey} 
              name={bar.name} 
              fill={bar.color} 
            />
          ))}
          {average !== undefined && (
            <ReferenceLine y={average} stroke="#999" strokeDasharray="3 3">
              <Label value="Durchschnitt" position="top" fill="currentColor" />
            </ReferenceLine>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface PieChartProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  label?: boolean;
}

export const AttendancePieChart: React.FC<PieChartProps> = ({ 
  data, 
  dataKey, 
  nameKey = "name", 
  label = true 
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {payload[0].name}: {payload[0].value} ({(payload[0].percent * 100).toFixed(0)}%)
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null; // Don't show labels for small slices
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="currentColor" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <div className={CHART_CONTAINER_CLASSES}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={label ? CustomLabel : undefined}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface InfoTileProps {
  title: string;
  value: number | string;
  className?: string;
  valueClassName?: string;
}

export const InfoTile: React.FC<InfoTileProps> = ({ title, value, className = "", valueClassName = "" }) => {
  return (
    <div className={`${INFO_TILE_CLASSES} ${className}`} title={`${title}: ${value}`}>
      <p className={TEXT_DESCRIPTION_CLASSES}>{title}</p>
      <p className={`${TEXT_VALUE_CLASSES} ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
};

export const InsightTile: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800" title={content}>
      <p className="font-medium mb-1 text-gray-800 dark:text-gray-100">{title}</p>
      <p className="text-gray-700 dark:text-gray-300">{content}</p>
    </div>
  );
};