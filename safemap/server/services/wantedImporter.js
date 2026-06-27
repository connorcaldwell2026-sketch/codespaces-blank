import fetch from 'node-fetch';
import WantedPerson from '../models/WantedPerson.js';

const FBI_WANTED_URL = 'https://api.fbi.gov/wanted/v1/list';

async function fetchFBI(page = 1) {
  const res = await fetch(`${FBI_WANTED_URL}?page=${page}`);
  if (!res.ok) throw new Error('FBI wanted fetch failed');
  const data = await res.json();
  return data.items || [];
}

function mapFBIItem(item) {
  return {
    source: 'fbi',
    sourceId: item.uid,
    name: item.title,
    aliases: item.aliases || [],
    description: item.description || '',
    imageUrl: (item.images && item.images[0] && item.images[0].original) || (item.images && item.images[0] && item.images[0].thumb) || '',
    reward: item.reward_text || '',
    caution: item.caution || '',
    nationality: item.nationality || '',
    gender: item.sex || '',
    lastKnownLocation: item.last_seen || '',
    sourceUrl: item.url || ''
  };
}

export async function runWantedImport() {
  const items = await fetchFBI();
  const results = [];
  for (const it of items) {
    const rec = mapFBIItem(it);
    try {
      const existing = await WantedPerson.findOne({ source: rec.source, sourceId: rec.sourceId });
      if (existing) {
        existing.name = existing.name || rec.name;
        existing.imageUrl = existing.imageUrl || rec.imageUrl;
        await existing.save();
        results.push({ action: 'updated', id: existing._id });
      } else {
        const doc = await WantedPerson.create(rec);
        results.push({ action: 'created', id: doc._id });
      }
    } catch (err) {
      results.push({ action: 'error', error: err.message });
    }
  }
  return results;
}

export default { runWantedImport };
