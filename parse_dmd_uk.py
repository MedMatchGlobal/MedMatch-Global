# parse_dmd_uk.py

from lxml import etree
import os
import json

# Load XML file
tree = etree.parse("nhs/f_vmp2_3170725.xml")
root = tree.getroot()

# Extract medicinal product names
drug_names = []

for vmp in root.findall(".//VMP"):
    name_elem = vmp.find("NM")
    df_indcd_elem = vmp.find("DF_INDCD")

    if name_elem is not None and df_indcd_elem is not None:
        name = name_elem.text.strip()
        df_indcd = df_indcd_elem.text.strip()

        # Only include true medicinal forms (1 = tablets, injections, etc.)
        if df_indcd == "1":
            drug_names.append(name)

# Deduplicate and sort
unique_drugs = sorted(list(set(drug_names)))

# Output to JSON
os.makedirs("public/data", exist_ok=True)
with open("public/data/uk-drugs.json", "w", encoding="utf-8") as f:
    json.dump(unique_drugs, f, indent=2, ensure_ascii=False)

print(f"✅ Extracted {len(unique_drugs)} medicinal drug names.")
