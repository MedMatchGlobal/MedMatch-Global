// scripts/extract-us-drugs.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OUTPUT_FILE = path.join(__dirname, '../public/data/us-drugs.json');
const TIMESTAMP_FILE = path.join(__dirname, '../data/last-us-update.json');
const API_URL = 'https://api.fda.gov/drug/ndc.json';
const PAGE_SIZE = 1000;
const MAX_SKIP = 25000;

function getLastUpdatedDate() {
  if (fs.existsSync(TIMESTAMP_FILE)) {
    const { lastUpdated } = JSON.parse(fs.readFileSync(TIMESTAMP_FILE, 'utf8'));
    return lastUpdated;
  }
  // Default: fetch everything from the past 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return oneWeekAgo.toISOString().split('T')[0];
}

async function fetchUpdatedDrugs(sinceDate) {
  let allDrugs = [];
  let skip = 0;

  while (true) {
    console.log(`🔄 Fetching records since ${sinceDate}... skip=${skip}`);

    try {
      const response = await axios.get(API_URL, {
        params: {
          search: `last_updated:[${sinceDate}+TO+*]`,
          limit: PAGE_SIZE,
          skip: skip,
        },
      });

      const results = response.data.results || [];
      if (results.length === 0) break;

      allDrugs = allDrugs.concat(results);
      skip += PAGE_SIZE;

      if (skip > MAX_SKIP) {
        console.warn(`❌ Reached FDA skip limit of ${MAX_SKIP}. Stopping.`);
        break;
      }
    } catch (err) {
      console.error(`❌ Error at skip=${skip}: ${err.response?.data?.error?.message || err.message}`);
      break;
    }
  }

  return allDrugs;
}

function extractDrugNames(drugs) {
  return drugs
    .map(d => d.brand_name || d.generic_name)
    .filter(Boolean)
    .map(name => name.trim())
    .filter((value, index, self) => self.indexOf(value) === index) // Unique
    .sort((a, b) => a.localeCompare(b));
}

(async () => {
  const lastUpdated = getLastUpdatedDate();
  const updatedDrugs = await fetchUpdatedDrugs(lastUpdated);

  if (updatedDrugs.length === 0) {
    console.log('✅ No new US drug records found since last update.');
    return;
  }

  const newNames = extractDrugNames(updatedDrugs);

  let existingNames = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    existingNames = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  }

  const merged = Array.from(new Set([...existingNames, ...newNames])).sort((a, b) => a.localeCompare(b));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2));
  fs.writeFileSync(TIMESTAMP_FILE, JSON.stringify({ lastUpdated: new Date().toISOString().split('T')[0] }));

  console.log(`✅ Extracted ${newNames.length} new US drug records. Total now: ${merged.length}`);
})();
