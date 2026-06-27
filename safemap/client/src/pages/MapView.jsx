import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import SOSButton from '../components/SOSButton.jsx';
import HeatmapLayer from '../components/HeatmapLayer.jsx';

const defaultPosition = [40.7128, -74.0060];

function ClusterGroup({ markers }) {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  useEffect(() => {
    if (!map || markers.length === 0) return;
    if (clusterGroupRef.current) map.removeLayer(clusterGroupRef.current);
    const cluster = L.markerClusterGroup();
    markers.forEach((report) => {
      const content = `<strong>Incident</strong><br/>Severity ${report.weight}${report.id ? `<br/><a href='/report/${report.id}' target='_blank'>View details</a>` : ''}`;
      const m = L.marker(report.position).bindPopup(content);
      cluster.addLayer(m);
    });
    cluster.addTo(map);
    clusterGroupRef.current = cluster;
  }, [map, markers]);

  return null;
}

function MapView() {
  const [reports, setReports] = useState([]);
  const [heatPoints, setHeatPoints] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedTime, setSelectedTime] = useState('24h');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState(0);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [smartQuery, setSmartQuery] = useState('');
  const [searchLabel, setSearchLabel] = useState('All reports');
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchReports = async (queryParams = {}) => {
    setLoadingReports(true);
    const params = new URLSearchParams({ regionId: 'us', ...queryParams });
    const res = await fetch(`/api/reports?${params.toString()}`);
    const data = await res.json();
    const formatted = data.map((point) => ({
      id: point._id || point.id || Math.random(),
      position: [point.location?.coordinates?.[1] || 40.7128, point.location?.coordinates?.[0] || -74.0060],
      weight: point.severity || 5,
      crimeType: point.crimeType || 'Other',
      timestamp: point.createdAt ? new Date(point.createdAt) : new Date()
    }));
    setReports(formatted);
    const types = [...new Set(formatted.map((p) => p.crimeType || 'Other'))];
    setCrimeTypes(types);
    setLoadingReports(false);
  };

  useEffect(() => {
    const since = new Date(Date.now() - (selectedTime === '24h' ? 24 : selectedTime === '12h' ? 12 : 6) * 60 * 60 * 1000).toISOString();
    fetchReports({ since });
    fetch('/api/analytics/heatmap?since=' + encodeURIComponent(since))
      .then((res) => res.json())
      .then(setHeatPoints)
      .catch(console.error);
  }, [selectedTime]);

  useEffect(() => {
    const socket = io();
    socket.on('report:created', (payload) => {
      try {
        const coords = payload.location && payload.location.coordinates ? payload.location.coordinates : [-74.0060, 40.7128];
        const [lng, lat] = coords;
        const newPoint = { lat, lng, weight: payload.severity || 5, crimeType: payload.crimeType || 'Other', timestamp: new Date() };
        setHeatPoints((pts) => [...pts, newPoint]);
        setReports((rs) => [...rs, { id: payload.id || Date.now(), position: [lat, lng], weight: payload.severity || 5, crimeType: payload.crimeType || 'Other', timestamp: new Date() }]);
      } catch (e) {
        console.error('Failed to apply live report', e);
      }
    });

    return () => {
      socket.off('report:created');
      socket.disconnect();
    };
  }, []);

  const handleSearch = async () => {
    if (!smartQuery.trim()) return;
    setLoadingReports(true);
    try {
      const response = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: smartQuery, regionId: 'us' })
      });
      const result = await response.json();
      const labelParts = [];
      if (result.crimeType) labelParts.push(result.crimeType);
      if (result.radiusKm) labelParts.push(`${result.radiusKm}km radius`);
      if (result.since) labelParts.push(`since ${new Date(result.since).toLocaleDateString()}`);
      setSearchLabel(labelParts.length ? labelParts.join(' • ') : 'Smart search results');
      const params = {
        regionId: result.regionId || 'us'
      };
      if (result.crimeType) params.crimeType = result.crimeType;
      if (result.since) params.since = result.since;
      if (result.until) params.until = result.until;
      if (result.centerPoint?.lat && result.centerPoint?.lng) {
        params.centerLat = result.centerPoint.lat;
        params.centerLng = result.centerPoint.lng;
      }
      if (result.radiusKm) params.radiusKm = result.radiusKm;
      await fetchReports(params);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (crimeTypeFilter !== 'all' && r.crimeType !== crimeTypeFilter) return false;
      if (r.weight < severityFilter) return false;
      return true;
    });
  }, [reports, crimeTypeFilter, severityFilter]);

  const playbackReports = useMemo(() => {
    if (!playbackMode) return filteredReports;
    return filteredReports.slice(0, playbackIndex + 1);
  }, [filteredReports, playbackMode, playbackIndex]);

  const togglePlayback = () => {
    if (!playbackMode) {
      setPlaybackIndex(0);
      setPlaybackMode(true);
    } else {
      setPlaybackMode(false);
    }
  };

  const advancePlayback = () => {
    if (playbackIndex < filteredReports.length - 1) {
      setPlaybackIndex(playbackIndex + 1);
    } else {
      setPlaybackMode(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <p className="muted">Interactive live map with heatmap overlay. Toggle layers and use quick SOS actions for immediate alerts.</p>
        <div className="panel-header">
          <h2>Live Map</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowHeatmap((value) => !value)}>{showHeatmap ? 'Hide' : 'Show'} Heatmap</button>
            <button onClick={togglePlayback}>{playbackMode ? 'Stop' : 'Playback'}</button>
            {playbackMode && <button onClick={advancePlayback}>Next</button>}
          </div>
        </div>
        <MapContainer center={defaultPosition} zoom={13} style={{ height: '70vh' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClusterGroup markers={playbackReports} />
          {showHeatmap && <HeatmapLayer points={heatPoints} />}
          <Circle center={defaultPosition} radius={1200} pathOptions={{ color: 'purple', opacity: 0.3 }} />
        </MapContainer>
      </section>
      <section className="panel side-panel">
        <h3>Filters & Playback</h3>
        <label>
          Smart search
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              placeholder="Search by incident type, area, time, keywords..."
              style={{ flex: 1 }}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
        </label>
        <p className="muted">{loadingReports ? 'Loading...' : searchLabel}</p>
        <label>
          Crime Type
          <select value={crimeTypeFilter} onChange={(e) => setCrimeTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {crimeTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Min Severity
          <input type="range" min="0" max="10" value={severityFilter} onChange={(e) => setSeverityFilter(parseInt(e.target.value))} />
          {severityFilter}
        </label>
        {playbackMode && <p>Playback: {playbackIndex + 1} / {filteredReports.length}</p>}
        <h3>Quick Actions</h3>
        <SOSButton />
        <div className="summary-card">
          <h4>Heatmap Window</h4>
          <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
            <option value="24h">Last 24 hours</option>
            <option value="12h">Last 12 hours</option>
            <option value="6h">Last 6 hours</option>
          </select>
        </div>
      </section>
    </div>
  );
}

export default MapView;
