const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const extractDrugs = async () => {
  try {
    const xmlPath = path.join(__dirname, "../nhs/f_vmp2_3170725.xml");
    const xml = fs.readFileSync(xmlPath, "utf8");

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const vmpList = result.VIRTUAL_MED_PRODUCTS.VMPS?.[0]?.VMP || [];

    const drugNames = vmpList
      .map((entry) => entry.NM?.[0])
      .filter(Boolean);

    const uniqueDrugs = [...new Set(drugNames)].sort();

    const outputPath = path.join(__dirname, "../public/data/uk-drugs.json");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(uniqueDrugs, null, 2), "utf8");

    console.log(`✅ Extracted ${uniqueDrugs.length} UK drug names to uk-drugs.json`);
  } catch (error) {
    console.error("❌ Error extracting drugs:", error);
  }
};

extractDrugs();
