import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io();

function BroadcastBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    socket.on('broadcast:alert', (payload) => setBanner(payload));
    return () => socket.off('broadcast:alert');
  }, []);

  if (!banner) return null;
  return (
    <div className={`broadcast-banner ${banner.type.toLowerCase()}`}>
      <span>{banner.type === 'Emergency' ? '🔴' : banner.type === 'Warning' ? '⚠️' : 'ℹ️'}</span>
      <strong>{banner.message}</strong>
      <button onClick={() => setBanner(null)}>Dismiss</button>
    </div>
  );
}

export default BroadcastBanner;
