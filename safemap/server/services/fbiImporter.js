import fetch from 'node-fetch';

const FBI_NIBRS_URL = process.env.FBI_NIBRS_URL || '';

// Simple fetcher: expects a JSON array at FBI_NIBRS_URL or returns empty.
export async function fetchFBI() {
  if (!FBI_NIBRS_URL) {
    console.warn('FBI_NIBRS_URL not set; skipping FBI import');
    return [];
  }
  const res = await fetch(FBI_NIBRS_URL);
  if (!res.ok) throw new Error('FBI NIBRS fetch failed');
  const data = await res.json();
  // Expect array of records with lat/lon and offense type
  return (Array.isArray(data) ? data : []).map((item) => ({
    source: 'fbi-nibrs',
    sourceId: item.incident_id || item.id || item.report_id || JSON.stringify(item).slice(0, 60),
    crimeType: item.offense || item.offense_type || item.crime || 'Other',
    incidentTime: item.incident_date || item.report_date || item.date,
    location: item.latitude && item.longitude ? { coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)] } : null,
    address: item.address || '',
    additionalDetails: JSON.stringify(item)
  }));
}

export default { fetchFBI };
