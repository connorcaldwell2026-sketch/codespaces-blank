import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const sampleData = [
  { name: 'Day 1', low: 5, medium: 10, high: 8 },
  { name: 'Day 2', low: 4, medium: 12, high: 6 },
  { name: 'Day 3', low: 8, medium: 14, high: 10 },
  { name: 'Day 4', low: 2, medium: 9, high: 12 }
];

function Analytics() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then((res) => res.json())
      .then(setOverview);
  }, []);

  return (
    <div className="page-grid">
      <section className="panel kpi-row">
        <p className="muted">Overview of recent reports, AI briefings and trends. Use this to prioritize resource allocation and spot spikes quickly.</p>
        <div className="kpi-card">
          <h4>Total reports this month</h4>
          <span>{overview?.totalReportsThisMonth ?? '––'}</span>
        </div>
        <div className="kpi-card">
          <h4>Avg resolution time</h4>
          <span>{Math.round(overview?.avgResolutionTimeHours || 0)}h</span>
        </div>
        <div className="kpi-card">
          <h4>SOS incidents this week</h4>
          <span>{overview?.sosIncidentsThisWeek ?? '––'}</span>
        </div>
        <div className="kpi-card">
          <h4>Top crime type</h4>
          <span>{overview?.topCrimeType || 'Unknown'}</span>
        </div>
      </section>
      <section className="panel">
        <h3>Crime by Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={sampleData} dataKey="medium" nameKey="name" innerRadius={60} outerRadius={100}>
              {sampleData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={[ '#8884d8', '#82ca9d', '#ffc658', '#ff7f7f' ][index % 4]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>
      <section className="panel">
        <h3>Reports Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sampleData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="high" stroke="#ff4d4f" />
            <Line type="monotone" dataKey="medium" stroke="#1890ff" />
          </LineChart>
        </ResponsiveContainer>
      </section>
      <section className="panel">
        <h3>Hourly Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sampleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="low" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="panel">
        <h3>AI Pattern Briefing</h3>
        <pre>{overview?.aiBriefing ? JSON.stringify(overview.aiBriefing, null, 2) : 'Loading briefing...'}</pre>
      </section>
    </div>
  );
}

export default Analytics;
