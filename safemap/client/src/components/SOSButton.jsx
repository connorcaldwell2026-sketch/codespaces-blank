import { useState } from 'react';

function SOSButton() {
  const [message, setMessage] = useState('');

  const triggerSOS = async () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is unavailable.');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'citizen-1',
          location: { lat: latitude, lng: longitude },
          summary: 'SOS triggered by user',
          emergencyContact: '',
          regionId: 'us'
        })
      });
      if (res.ok) {
        setMessage('SOS alert sent. Police notified.');
      } else {
        setMessage('Unable to send SOS.');
      }
    }, () => setMessage('Could not get location.'));
  };

  return (
    <div className="sos-card">
      <button className="sos-button" onClick={triggerSOS}>SOS</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default SOSButton;
