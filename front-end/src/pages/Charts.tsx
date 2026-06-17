import React, { useState, useEffect } from 'react';
import httpClient from '../httpClient.jsx';
import GradeBySubjectChart from '../components/GradeBySubjectChart';
import PerformanceTrendChart from '../components/PerformanceTrendChart';
import DifficultyChart from '../components/DifficultyChart';
import CompletionRateChart from '../components/CompletionRateChart';
import '../css/charts.css';

const Charts = () => {
    const [gradeBySubject, setGradeBySubject] = useState([]);
    const [performanceTrend, setPerformanceTrend] = useState([]);
    const [difficultyBreakdown, setDifficultyBreakdown] = useState({});
    const [completionRate, setCompletionRate] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [gradeRes, trendRes, diffRes, completionRes] = await Promise.all([
                    httpClient.get('//localhost:5000/stats/grades-by-subject'),
                    httpClient.get('//localhost:5000/stats/performance-timeline'),
                    httpClient.get('//localhost:5000/stats/difficulty-breakdown'),
                    httpClient.get('//localhost:5000/stats/completion-rate'),
                ]);

                setGradeBySubject(gradeRes.data.data || []);
                setPerformanceTrend(trendRes.data.data || []);
                setDifficultyBreakdown(diffRes.data.data || {});
                setCompletionRate(completionRes.data.data || []);
            } catch (err) {
                console.error('Error fetching chart data:', err);
                setError('Failed to load chart data');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return <div className="content"><p>Loading charts...</p></div>;
    }

    if (error) {
        return <div className="content"><p className="error">{error}</p></div>;
    }

    return (
        <div className="content">
            <div className="charts-container">
                <h1 className="charts-title">Performance Dashboard</h1>
                
                <div className="charts-grid">
                    <div className="chart-box">
                        <h2>Grade Distribution by Subject</h2>
                        <GradeBySubjectChart data={gradeBySubject} />
                    </div>

                    <div className="chart-box">
                        <h2>Performance Trend Over Time</h2>
                        <PerformanceTrendChart data={performanceTrend} />
                    </div>

                    <div className="chart-box">
                        <h2>Assignment Difficulty Breakdown</h2>
                        <DifficultyChart data={difficultyBreakdown} />
                    </div>

                    <div className="chart-box">
                        <h2>Subject Completion Rate</h2>
                        <CompletionRateChart data={completionRate} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Charts;
