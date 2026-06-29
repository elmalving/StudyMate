import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
    date: string;
    grade: number;
    subject: string;
}

interface Props {
    data: TrendData[];
}

const PerformanceTrendChart: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="no-data">No data available</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="var(--accent-color)"
                    dot={{ fill: 'var(--accent-color)', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default PerformanceTrendChart;
