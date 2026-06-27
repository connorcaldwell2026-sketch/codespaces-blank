import { useEffect, useState } from 'react';

function Wanted() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wanted')
      .then((res) => res.json())
      .then((data) => setList(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-grid">
      <section className="panel full-width">
        <h2>Wanted Persons</h2>
        <p className="muted">Public wanted persons imported from public sources. Use responsibly and contact authorities if you have information.</p>
      </section>
      <section className="panel">
        {loading ? <div>Loading...</div> : (
          <div className="wanted-grid">
            {list.map((w) => (
              <div key={w._id} className="wanted-card">
                {w.imageUrl && <img src={w.imageUrl} alt={w.name} />}
                <h3>{w.name}</h3>
                {w.aliases && w.aliases.length > 0 && <p>Also known as: {w.aliases.join(', ')}</p>}
                <p>{w.description?.slice(0, 220)}</p>
                {w.reward && <p><strong>Reward:</strong> {w.reward}</p>}
                {w.sourceUrl && <a href={w.sourceUrl} target="_blank" rel="noreferrer">Source</a>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Wanted;
