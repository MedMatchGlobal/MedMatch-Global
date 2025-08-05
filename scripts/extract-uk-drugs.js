const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const extractDrugs = async () => {
  try {
    const xmlPath = path.join(__dirname, "../nhs/f_vmp2_3170725.xml");
    const xml = fs.readFileSync(xmlPath, "utf8");

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const vmpList = result.VIRTUAL_MED_PRODUCTS.VMPS?.[0]?.VMP || [];

    const drugObjects = vmpList
      .map((entry) => {
        const name = entry.NN?.[0]?.trim();
        const code = entry.VPID?.[0];
        return name && code ? { name, dmCode: code } : null;
      })
      .filter(Boolean);

    const uniqueDrugs = [
      ...new Map(drugObjects.map((item) => [item.dmCode, item])).values(),
    ].sort((a, b) => a.name.localeCompare(b.name));

    const outputPath = path.join(__dirname, "../public/data/uk-drugs.json");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(uniqueDrugs, null, 2), "utf8");

    console.log(`✅ Extracted and saved ${uniqueDrugs.length} UK drugs to JSON`);

    for (const drug of uniqueDrugs) {
      await prisma.drugUK.upsert({
        where: { dmDCode: drug.dmCode },
        update: { name: drug.name },
        create: { dmDCode: drug.dmCode, name: drug.name },
      });
    }

    console.log(`✅ Upserted ${uniqueDrugs.length} drugs into Planetscale DB`);
  } catch (error) {
    console.error("❌ Error processing drugs:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

extractDrugs();
