const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '../public/data/us-drugs.json');
const BASE_URL = 'https://api.fda.gov/drug/ndc.json';
const LIMIT = 1000;
const MAX_SKIP = 25000;

const statePath = path.join(__dirname, '../.us-drug-fetch-state.json');
const today = new Date().toISOString().split('T')[0];

let lastDate = '2000-01-01';
if (fs.existsSync(statePath)) {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  lastDate = state.lastDate || lastDate;
}

async function fetchAllDrugs() {
  let allDrugs = [];
  let skip = 0;
  let keepFetching = true;

  while (keepFetching && skip <= MAX_SKIP) {
    const url = `${BASE_URL}?search=listing_expiration_date:[${lastDate}+TO+${today}]&limit=${LIMIT}&skip=${skip}`;

    console.log(`🔄 Fetching records since ${lastDate}... skip=${skip}`);
    try {
      const res = await axios.get(url);
      const results = res.data.results;
      if (!results || results.length === 0) {
        keepFetching = false;
      } else {
        allDrugs.push(...results);
        skip += LIMIT;
      }
    } catch (err) {
      console.error(`❌ Error at skip=${skip}: ${err.response?.data?.error?.message || err.message}`);
      keepFetching = false;
    }
  }

  return allDrugs;
}

(async () => {
  try {
    const drugs = await fetchAllDrugs();

    if (drugs.length > 0) {
      const names = [...new Set(drugs.map(d => d.brand_name).filter(Boolean))].sort();
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(names, null, 2));
      console.log(`✅ Extracted ${names.length} US drug records to ${OUTPUT_PATH}`);

      fs.writeFileSync(statePath, JSON.stringify({ lastDate: today }, null, 2));
    } else {
      console.log('✅ No new US drug records found since last update.');
    }
  } catch (err) {
    console.error(`❌ Error fetching US drugs: ${err.message}`);
  }
})();
