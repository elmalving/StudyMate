import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface DifficultyData {
    easy?: number;
    medium?: number;
    hard?: number;
}

interface Props {
    data: DifficultyData;
}

const DifficultyChart: React.FC<Props> = ({ data }) => {
    const chartData = [
        { name: 'Easy', value: data.easy || 0 },
        { name: 'Medium', value: data.medium || 0 },
        { name: 'Hard', value: data.hard || 0 },
    ].filter(item => item.value > 0);

    if (chartData.length === 0) {
        return <p className="no-data">No data available</p>;
    }

    const COLORS = ['#49F300', '#FFC658', '#FF6B6B'];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default DifficultyChart;
