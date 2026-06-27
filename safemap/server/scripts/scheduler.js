import cron from 'node-cron';
import dotenv from 'dotenv';
import { runImport } from '../services/importerService.js';
import wantedImporter from '../services/wantedImporter.js';

dotenv.config();

// Default: run every 6 hours
const schedule = process.env.IMPORT_SCHEDULE || '0 */6 * * *';

console.log('Scheduler starting with schedule:', schedule);

cron.schedule(schedule, async () => {
  console.log('Running scheduled import:', new Date().toISOString());
  try {
    const res = await runImport();
    console.log('Import results:', res.imported || res);
  } catch (err) {
    console.error('Scheduled import error', err);
  }
  try {
    const wres = await wantedImporter.runWantedImport();
    console.log('Wanted import results:', wres.length);
  } catch (err) {
    console.error('Scheduled wanted import error', err);
  }
});

// Keep process alive
process.stdin.resume();
