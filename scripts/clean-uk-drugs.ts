const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

async function main() {
  const raw = await fs.readFile('data/uk-drugs.json', 'utf-8');
  const names = JSON.parse(raw);

  const formatted = names.map((name) => ({
    name,
    form: null,
    strength: null,
    dmCode: uuidv4(),
  }));

  await fs.writeFile('data/cleaned.uk-drugs.json', JSON.stringify(formatted, null, 2));
  console.log(`✅ Cleaned and saved ${formatted.length} entries.`);
}

main().catch(console.error);
