const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const extractDrugs = async () => {
  try {
    // Example: load static JSON or fetch from an API (replace with real logic)
    const sourcePath = path.join(__dirname, "../data/fda-ndc.json");
    const raw = fs.readFileSync(sourcePath, "utf8");
    const drugs = JSON.parse(raw);

    const output = drugs
      .filter(d => d.name && d.ndc)
      .map(d => ({
        name: d.name,
        ndcCode: d.ndc
      }));

    // Save locally
    const outPath = path.join(__dirname, "../public/data/us-drugs.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

    console.log(`✅ Saved ${output.length} US drugs to us-drugs.json`);

    // Insert into Planetscale
    for (const drug of output) {
      await prisma.drugUS.upsert({
        where: { ndcCode: drug.ndcCode },
        update: { name: drug.name },
        create: { name: drug.name, ndcCode: drug.ndcCode },
      });
    }

    console.log(`✅ Inserted ${output.length} US drugs into Planetscale`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

extractDrugs();
