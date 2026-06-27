import { useEffect, useState } from 'react';

function Neighborhood() {
  const [neighborhood, setNeighborhood] = useState(null);
  const [joinStatus, setJoinStatus] = useState(null);
  const neighborhoodId = '000000000000000000000000';

  useEffect(() => {
    fetch(`/api/neighborhoods/${neighborhoodId}`)
      .then((res) => res.json())
      .then(setNeighborhood)
      .catch(console.error);
  }, []);

  const join = async () => {
    const res = await fetch('/api/neighborhoods/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'citizen-1', neighborhoodId })
    });
    const result = await res.json();
    setJoinStatus(result ? 'Joined neighborhood' : 'Failed');
  };

  return (
    <div className="page-grid">
      <section className="panel full-width">
        <h2>Neighborhood Group</h2>
        <p className="muted">Join local groups to share tips, coordinate safe routes, and receive neighborhood-specific alerts.</p>
        <button onClick={join}>Join Neighborhood</button>
        {joinStatus && <div className="status-message">{joinStatus}</div>}
      </section>
      <section className="panel">
        <h3>{neighborhood?.name || 'Neighborhood'}</h3>
        <p>Members: {neighborhood?.memberIds?.length ?? 0}</p>
        <p>Safety Score: {neighborhood?.safetyScore ?? '––'}</p>
        <p>Activity Score: {neighborhood?.activityScore ?? 0}</p>
      </section>
      <section className="panel">
        <h3>Safety History</h3>
        <ul>
          {neighborhood?.safetyHistory?.map((item) => (
            <li key={item.weekStart}>{new Date(item.weekStart).toLocaleDateString()}: {item.score}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Neighborhood;
