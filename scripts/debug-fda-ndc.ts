import fs from 'fs';
import path from 'path';

const inputPath = path.join(__dirname, '../data/fda-ndc.json');
const rawData = fs.readFileSync(inputPath, 'utf-8');

try {
  const data = JSON.parse(rawData);

  if (Array.isArray(data)) {
    console.log(`✅ fda-ndc.json is an array with ${data.length} items`);
    console.log('🔍 Sample keys from first item:', Object.keys(data[0]));
    console.log('🔍 Sample item:', data[0]);
  } else {
    console.log('⚠️ fda-ndc.json is NOT an array. Type:', typeof data);
    console.log('🔍 Top-level keys:', Object.keys(data));
  }
} catch (err) {
  console.error('❌ Failed to parse fda-ndc.json:', err);
}
