import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompletionData {
    subject: string;
    completion_rate: number;
}

interface Props {
    data: CompletionData[];
}

const CompletionRateChart: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="no-data">No data available</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="completion_rate" fill="#ffc658" name="Completion Rate (%)" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default CompletionRateChart;
