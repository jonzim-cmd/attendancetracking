// src/components/attendance/dashboard/ChartComponents.tsx
import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  CHART_CONTAINER_CLASSES,
  STATUS_COLORS
} from './styles';

interface LineChartProps {
  data: any[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
    activeDot?: boolean;
  }[];
}

export const AttendanceLineChart: React.FC<LineChartProps> = ({ data, lines }) => {
  return (
    <div className={CHART_CONTAINER_CLASSES}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={line.dataKey} 
              name={line.name} 
              stroke={line.color} 
              activeDot={line.activeDot ? { r: 8 } : undefined} 
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
}

export const AttendanceBarChart: React.FC<BarChartProps> = ({ data, bars }) => {
  return (
    <div className={CHART_CONTAINER_CLASSES}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map((bar, index) => (
            <Bar 
              key={index}
              dataKey={bar.dataKey} 
              name={bar.name} 
              fill={bar.color} 
            />
          ))}
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
  return (
    <div className={CHART_CONTAINER_CLASSES}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={label}
            label={label ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : undefined}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} Einträge`, 'Anzahl']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface InfoTileProps {
  title: string;
  value: number | string;
  className?: string;
}

export const InfoTile: React.FC<InfoTileProps> = ({ title, value, className = "" }) => {
  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${className}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

export const InsightTile: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <p className="font-medium mb-1">{title}</p>
      <p>{content}</p>
    </div>
  );
};