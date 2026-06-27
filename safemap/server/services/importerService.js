import fetch from 'node-fetch';
import Report from '../models/Report.js';
import ukImporter from './ukImporter.js';
import fbiImporter from './fbiImporter.js';

const NYC_ENDPOINT = process.env.NYC_URL || 'https://data.cityofnewyork.us/resource/9s4h-37hy.json?$limit=1000&$order=crime_date DESC';
const TORONTO_ENDPOINT = process.env.TORONTO_URL || 'https://ckan0.cf.opendata.inter.prod-toronto.ca/resource/9w6a-4s8e.json?$limit=1000';

async function fetchNYC() {
  const res = await fetch(NYC_ENDPOINT);
  if (!res.ok) throw new Error('NYC fetch failed');
  const data = await res.json();
  return data.map((item) => ({
    source: 'nyc',
    sourceId: item.unique_key || item.rpt_id || item.cmplnt_num || item.incident_id || item.sum_number,
    crimeType: item.offense_type || item.crime_description || item.law_cat_cd || item.offense_description,
    incidentTime: item.crime_date || item.occur_date || item.reported_date,
    location: item.location && item.latitude && item.longitude ? { coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)] } : (item.location ? { coordinates: [parseFloat(item.location.longitude || -74.0060), parseFloat(item.location.latitude || 40.7128)] } : null),
    address: item.premises || item.incident_address || item.on_street_name || item.address,
    additionalDetails: JSON.stringify(item)
  }));
}

async function fetchToronto() {
  const res = await fetch(TORONTO_ENDPOINT);
  if (!res.ok) throw new Error('Toronto fetch failed');
  const data = await res.json();
  return data.map((item) => ({
    source: 'toronto',
    sourceId: item.incident_number || item.case_number || item.ID || item.objectid || item._id,
    crimeType: item.offence_description || item.type || item.event_type || item.category,
    incidentTime: item.occurred_on || item.reported_date || item.date,
    location: item.latitude && item.longitude ? { coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)] } : null,
    address: item.address || item.location_description,
    additionalDetails: JSON.stringify(item)
  }));
}

function normalize(rec) {
  const latlng = rec.location && rec.location.coordinates ? rec.location.coordinates : [-74.0060, 40.7128];
  return {
    description: rec.additionalDetails ? (typeof rec.additionalDetails === 'string' ? rec.additionalDetails : JSON.stringify(rec.additionalDetails)) : (rec.crimeType || 'Imported incident'),
    crimeType: rec.crimeType || 'Other',
    regionId: rec.source === 'toronto' ? 'ca' : 'us',
    location: { type: 'Point', coordinates: latlng },
    incidentTime: rec.incidentTime ? new Date(rec.incidentTime) : new Date(),
    address: rec.address || '',
    source: rec.source,
    sourceId: String(rec.sourceId || Date.now()),
    additionalDetails: rec.additionalDetails || ''
  };
}

async function ingest(records) {
  const results = [];
  for (const r of records) {
    const norm = normalize(r);
    try {
      // dedupe by source+sourceId
      const existing = await Report.findOne({ source: norm.source, sourceId: norm.sourceId });
      if (existing) {
        // update basic fields if necessary
        existing.crimeType = existing.crimeType || norm.crimeType;
        existing.address = existing.address || norm.address;
        await existing.save();
        results.push({ action: 'updated', id: existing._id });
      } else {
        const doc = await Report.create({ ...norm, verified: false, status: 'Imported' });
        results.push({ action: 'created', id: doc._id });
      }
    } catch (err) {
      results.push({ action: 'error', error: err.message });
    }
  }
  return results;
}

export async function runImport() {
  const all = [];
  try {
    const nyc = await fetchNYC();
    all.push(...nyc);
  } catch (e) {
    console.warn('NYC import failed', e.message);
  }
  try {
    const tor = await fetchToronto();
    all.push(...tor);
  } catch (e) {
    console.warn('Toronto import failed', e.message);
  }
  try {
    const uk = await ukImporter.fetchLondon();
    all.push(...uk);
  } catch (e) {
    console.warn('UK import failed', e.message);
  }
  try {
    const fbi = await fbiImporter.fetchFBI();
    all.push(...fbi);
  } catch (e) {
    console.warn('FBI import failed', e.message);
  }
  const res = await ingest(all);
  return { imported: res.length, details: res };
}

export default { runImport };
