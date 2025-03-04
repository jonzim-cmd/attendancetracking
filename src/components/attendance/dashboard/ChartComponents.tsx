import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
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
}

export const AttendanceLineChart: React.FC<LineChartProps> = ({ data, lines }) => {
  return (
    <div className={CHART_CONTAINER_CLASSES}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderColor: '#ddd',
              color: '#333' 
            }} 
          />
          <Legend />
          {lines.map((line, index) => (
            <Line 
              key={index}
              type="monotone" 
              dataKey={line.dataKey} 
              name={line.name} 
              stroke={line.color} 
              activeDot={line.activeDot ? { r: 8 } : undefined} 
              strokeWidth={2}
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
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderColor: '#ddd',
              color: '#333' 
            }} 
          />
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
          <Tooltip 
            formatter={(value) => [`${value} Einträge`, 'Anzahl']}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderColor: '#ddd',
              color: '#333' 
            }} 
          />
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
    <div className={`${INFO_TILE_CLASSES} ${className}`}>
      <p className={TEXT_DESCRIPTION_CLASSES}>{title}</p>
      <p className={TEXT_VALUE_CLASSES}>
        {value}
      </p>
    </div>
  );
};

export const InsightTile: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  return (
    <div className={INFO_TILE_CLASSES}>
      <p className="font-medium mb-1 text-gray-800 dark:text-gray-100">{title}</p>
      <p className="text-gray-700 dark:text-gray-300">{content}</p>
    </div>
  );
};