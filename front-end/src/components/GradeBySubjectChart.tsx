import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GradeData {
    subject: string;
    average_grade: number;
}

interface Props {
    data: GradeData[];
}

const GradeBySubjectChart: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="no-data">No data available</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average_grade" fill="var(--accent-color)" name="Average Grade" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default GradeBySubjectChart;
