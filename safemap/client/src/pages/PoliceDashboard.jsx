import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function PoliceDashboard() {
  const [liveReports, setLiveReports] = useState([]);
  const [overview, setOverview] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [trendAlerts, setTrendAlerts] = useState([]);
  const [alert, setAlert] = useState(null);
  const [regionId, setRegionId] = useState('us');

  useEffect(() => {
    const socket = io();
    socket.on('sos:alert', (payload) => setAlert({ type: 'sos', payload }));
    socket.on('trend:spike', (payload) => setAlert({ type: 'trend', payload }));
    socket.on('broadcast:alert', (payload) => setAlert({ type: 'broadcast', payload }));
    socket.on('report:created', (payload) => {
      setLiveReports((current) => [
        { id: payload.id, crimeType: payload.crimeType || 'Unknown', severity: payload.severity || 5, timestamp: new Date(payload.createdAt || Date.now()).toLocaleTimeString(), assigned: false },
        ...current
      ]);
    });
    return () => {
      socket.off('sos:alert');
      socket.off('trend:spike');
      socket.off('broadcast:alert');
      socket.off('report:created');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetch(`/api/analytics/overview?regionId=${regionId}`)
      .then((res) => res.json())
      .then((data) => {
        setOverview(data);
        setBriefing(data.aiBriefing || data.briefing || null);
      });
    fetch('/api/analytics/trends')
      .then((res) => res.json())
      .then((data) => setTrendAlerts(data.alerts || []));
    fetch(`/api/reports?regionId=${regionId}&status=Incoming`)
      .then((res) => res.json())
      .then((data) => {
        setLiveReports(data.map((report) => ({
          id: report._id,
          crimeType: report.crimeType || 'Unknown',
          severity: report.severity || 5,
          timestamp: report.createdAt ? new Date(report.createdAt).toLocaleTimeString() : 'now',
          location: report.address || 'Unknown',
          assigned: report.status === 'Assigned'
        })));
      });
  }, [regionId]);

  const triggerReanalysis = async () => {
    const res = await fetch('/api/ai/analyze-patterns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regionId }) });
    const data = await res.json();
    setBriefing(data.briefing || data);
  };

  const assignReport = async (id) => {
    await fetch(`/api/reports/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officerId: 'officer-123' })
    });
    setLiveReports((ps) => ps.map((report) => report.id === id ? { ...report, assigned: true } : report));
  };

  return (
    <div className="page-grid">
      <section className="panel full-width">
        <div className="panel-header">
          <h2>Police Dashboard</h2>
          <p className="muted">Tactical view for officers: live feed, AI briefings and trend alerts. Select region to focus analyses on US or Canada.</p>
          <div className="header-actions">
            <label>
              Region
              <select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                <option value="us">United States</option>
                <option value="ca">Canada</option>
              </select>
            </label>
            <button onClick={triggerReanalysis}>Re-analyze Now</button>
          </div>
        </div>
        {alert && <div className="alert-banner">{alert.type === 'sos' ? 'SOS Alert received' : alert.type === 'trend' ? `Trend spike: ${alert.payload.crimeType}` : 'Broadcast alert'}</div>}
        <div className="dashboard-summary-grid">
          <div className="summary-card">
            <h4>Region Summary</h4>
            <div>Reports: {overview?.reportCount ?? '—'}</div>
            <div>Active Alerts: {overview?.activeAlerts ?? '—'}</div>
            <div>Verified Incidents: {overview?.verifiedCount ?? '—'}</div>
            <div>Hotspot: {overview?.topHotspot || 'Unknown'}</div>
          </div>
          <div className="summary-card">
            <h4>Response Score</h4>
            <div>{overview?.responseScore ? `${overview.responseScore}/100` : 'No data'}</div>
            <div>{overview?.safetyTrend || 'Trend not available'}</div>
          </div>
        </div>
      </section>
      <section className="panel">
        <h3>AI Briefing</h3>
        <pre>{briefing ? JSON.stringify(briefing, null, 2) : 'Loading...'}</pre>
      </section>
      <section className="panel">
        <h3>Live Incident Feed</h3>
        <div className="feed-grid">
          {liveReports.length ? liveReports.map((report) => (
            <div key={report.id} className={`feed-row ${report.assigned ? 'assigned' : ''}`}>
              <div>{report.timestamp || 'now'}</div>
              <div>{report.crimeType || 'Unknown'}</div>
              <div>Severity {report.severity || 5}</div>
              <div>{report.location || 'Unknown'}</div>
              <button onClick={() => assignReport(report.id)}>Assign to me</button>
            </div>
          )) : <div>No recent live reports yet.</div>}
        </div>
      </section>
      <section className="panel">
        <h3>Trend Alerts</h3>
        {trendAlerts.map((alertItem) => (
          <div key={alertItem._id} className="trend-card">
            {alertItem.crimeType}: {Math.round(alertItem.deltaPercent)}% spike
          </div>
        ))}
      </section>
    </div>
  );
}

export default PoliceDashboard;
