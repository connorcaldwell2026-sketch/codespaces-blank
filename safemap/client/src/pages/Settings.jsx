import { useEffect, useState } from 'react';

const defaultUserId = 'citizen-1';

function Settings() {
  const [zones, setZones] = useState([]);
  const [crimeTypes] = useState(['Theft', 'Assault', 'Robbery', 'Vandalism', 'Suspicious Activity']);
  const [newZone, setNewZone] = useState({ name: '', centerLat: '', centerLng: '', radiusKm: 5, alertTypes: [] });

  const loadZones = async () => {
    try {
      const res = await fetch(`/api/watchzones?userId=${defaultUserId}`);
      const data = await res.json();
      setZones(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const createZone = async () => {
    const payload = {
      userId: defaultUserId,
      name: newZone.name || 'Custom Watch Zone',
      regionId: 'us',
      center: { type: 'Point', coordinates: [parseFloat(newZone.centerLng) || -74.0060, parseFloat(newZone.centerLat) || 40.7128] },
      radiusKm: parseFloat(newZone.radiusKm) || 5,
      alertTypes: newZone.alertTypes,
      description: 'User-created watch area'
    };
    await fetch('/api/watchzones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setNewZone({ name: '', centerLat: '', centerLng: '', radiusKm: 5, alertTypes: [] });
    await loadZones();
  };

  const deleteZone = async (zoneId) => {
    await fetch(`/api/watchzones/${zoneId}`, { method: 'DELETE' });
    await loadZones();
  };

  const toggleAlertType = (type) => {
    setNewZone((current) => {
      const selected = current.alertTypes.includes(type)
        ? current.alertTypes.filter((item) => item !== type)
        : [...current.alertTypes, type];
      return { ...current, alertTypes: selected };
    });
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Alert Preferences</h2>
        <p className="muted">Control which alerts you receive and customize quiet hours. Keep emergency contacts up to date for faster response.</p>
        <div className="preference-grid">
          {crimeTypes.map((crime) => (
            <label key={crime}>
              <input type="checkbox" defaultChecked /> {crime}
            </label>
          ))}
        </div>
      </section>
      <section className="panel">
        <h3>Watch Zones</h3>
        <div className="watch-zone-form">
          <label>
            Name
            <input value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} placeholder="Zone name" />
          </label>
          <label>
            Center Latitude
            <input value={newZone.centerLat} onChange={(e) => setNewZone({ ...newZone, centerLat: e.target.value })} placeholder="40.7128" />
          </label>
          <label>
            Center Longitude
            <input value={newZone.centerLng} onChange={(e) => setNewZone({ ...newZone, centerLng: e.target.value })} placeholder="-74.0060" />
          </label>
          <label>
            Radius (km)
            <input type="number" value={newZone.radiusKm} onChange={(e) => setNewZone({ ...newZone, radiusKm: e.target.value })} />
          </label>
          <div className="alert-type-grid">
            {crimeTypes.map((type) => (
              <label key={type}>
                <input type="checkbox" checked={newZone.alertTypes.includes(type)} onChange={() => toggleAlertType(type)} /> {type}
              </label>
            ))}
          </div>
          <button onClick={createZone}>Save Watch Zone</button>
        </div>
        {zones.length ? zones.map((zone) => (
          <div className="watch-zone" key={zone._id || zone.name}>
            <strong>{zone.name || zone.label}</strong>
            <p>{zone.radiusKm || 'N/A'}km around {zone.center?.coordinates?.[1]?.toFixed(4) || 'N/A'}, {zone.center?.coordinates?.[0]?.toFixed(4) || 'N/A'}</p>
            <p>{zone.alertTypes?.join(', ') || 'All alert types'}</p>
            <button onClick={() => deleteZone(zone._id)}>Remove</button>
          </div>
        )) : <p>No watch zones configured yet.</p>}
      </section>
    </div>
  );
}

export default Settings;
