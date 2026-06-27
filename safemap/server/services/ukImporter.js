import fetch from 'node-fetch';

const UK_POLICE_URL = 'https://data.police.uk/api/crimes-street/all-crime';

// Fetch recent crimes around central London (as an example)
export async function fetchLondon(date) {
  const lat = process.env.UK_LAT || '51.5074';
  const lng = process.env.UK_LNG || '-0.1278';
  const url = `${UK_POLICE_URL}?lat=${lat}&lng=${lng}${date ? `&date=${date}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('UK Police fetch failed');
  const data = await res.json();
  return data.map((item) => ({
    source: 'uk-police',
    sourceId: item.id || `${item.category}-${item.location?.latitude}-${item.location?.longitude}-${item.month}`,
    crimeType: item.category,
    incidentTime: item.month,
    location: item.location ? { coordinates: [parseFloat(item.location.longitude), parseFloat(item.location.latitude)] } : null,
    address: item.location?.street?.name || '',
    additionalDetails: JSON.stringify(item)
  }));
}

export default { fetchLondon };
