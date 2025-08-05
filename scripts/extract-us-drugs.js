const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const extractDrugs = async () => {
  try {
    const jsonPath = path.join(__dirname, "../data/fda-ndc.json");
    const raw = fs.readFileSync(jsonPath, "utf8");
    const data = JSON.parse(raw);

    const drugObjects = data
      .map((entry) => {
        const name = entry.brand_name?.trim();
        const ndcCode = entry.product_ndc?.trim();
        const form = entry.dosage_form?.trim();
        return name && ndcCode ? { name, ndcCode, form, strength: null } : null;
      })
      .filter(Boolean);

    const uniqueDrugs = [
      ...new Map(drugObjects.map((item) => [item.ndcCode, item])).values(),
    ].sort((a, b) => a.name.localeCompare(b.name));

    const outputPath = path.join(__dirname, "../public/data/us-drugs.json");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(uniqueDrugs, null, 2), "utf8");

    console.log(`✅ Extracted and saved ${uniqueDrugs.length} US drugs to JSON`);

    for (const drug of uniqueDrugs) {
      await prisma.drugUS.upsert({
        where: { ndcCode: drug.ndcCode },
        update: {
          name: drug.name,
          form: drug.form,
          strength: drug.strength,
        },
        create: {
          ndcCode: drug.ndcCode,
          name: drug.name,
          form: drug.form,
          strength: drug.strength,
        },
      });
    }

    console.log(`✅ Upserted ${uniqueDrugs.length} US drugs into PlanetScale DB`);
  } catch (error) {
    console.error("❌ Error processing US drugs:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

extractDrugs();
