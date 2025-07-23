import { useEffect, useState } from "react";

export default function Home() {
  const [countries, setCountries] = useState<string[]>([]);
  const [ukDrugs, setUkDrugs] = useState<string[]>([]);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDrug, setSelectedDrug] = useState("");
  const [filteredDrugs, setFilteredDrugs] = useState<string[]>([]);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);

  const [selectedDosage, setSelectedDosage] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  const countryWithDatabase = ["United Kingdom"];

  useEffect(() => {
    fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "countries" }),
    })
      .then((res) => res.json())
      .then((data) => setCountries(data.options || []))
      .catch((err) => console.error("Failed to load countries:", err));
  }, []);

  useEffect(() => {
    fetch("/uk-drugs.json")
      .then((res) => res.json())
      .then((data) => {
        setUkDrugs(data);
        setFilteredDrugs(data);
      })
      .catch((err) => console.error("Failed to load UK drugs:", err));
  }, []);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedDrug("");
    setSelectedDosage("");
    setShowNotice(!countryWithDatabase.includes(value));
  };

  const handleDrugInput = (value: string) => {
    setSelectedDrug(value);
    setShowDrugDropdown(true);
    const filtered = ukDrugs.filter((drug) =>
      drug.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDrugs(filtered);
  };

  const handleDrugSelect = (value: string) => {
    setSelectedDrug(value);
    setShowDrugDropdown(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    setResult("Searching...");

    const query = `Find the equivalent of the drug ${selectedDrug} sold in ${selectedCountry}, in ${searchCountry}.`;

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResult(data.result || "No result found.");
    } catch (err) {
      console.error(err);
      setResult("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h1 style={{ textAlign: "center", color: "#0b74de", fontSize: "2rem" }}>
        MedMatch-Global
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Source Country Dropdown */}
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          <option value="">Select Country</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Notice for countries without database */}
        {showNotice && (
          <div style={{ color: "#d9534f", fontSize: "0.95rem" }}>
            ⚠️ No full drug list available for {selectedCountry}. Please enter the drug name manually.
          </div>
        )}

        {/* Drug Input */}
        {selectedCountry === "United Kingdom" ? (
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Start typing drug name..."
              value={selectedDrug}
              onChange={(e) => handleDrugInput(e.target.value)}
              onFocus={() => setShowDrugDropdown(true)}
              style={{ width: "100%", padding: "0.5rem" }}
            />
            {showDrugDropdown && filteredDrugs.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  maxHeight: "150px",
                  overflowY: "auto",
                  position: "absolute",
                  zIndex: 1000,
                  width: "100%",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                }}
              >
                {filteredDrugs.slice(0, 100).map((drug, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleDrugSelect(drug)}
                    style={{
                      padding: "0.5rem",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                    }}
                  >
                    {drug}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <input
            type="text"
            placeholder="Enter Drug Name"
            value={selectedDrug}
            onChange={(e) => setSelectedDrug(e.target.value)}
          />
        )}

        {/* Optional Dosage */}
        <input
          type="text"
          placeholder="Enter Dosage (optional)"
          value={selectedDosage}
          onChange={(e) => setSelectedDosage(e.target.value)}
        />

        {/* Destination Country Dropdown */}
        <select
          value={searchCountry}
          onChange={(e) => setSearchCountry(e.target.value)}
        >
          <option value="">Country to search</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading || !selectedDrug || !searchCountry}
          style={{
            padding: "0.75rem",
            backgroundColor: "#0b74de",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Searching..." : "Search Equivalent Drug"}
        </button>

        {/* Result */}
        <textarea
          readOnly
          value={result}
          placeholder="Result will appear here..."
          rows={6}
          style={{ marginTop: "1rem", width: "100%" }}
        />
      </div>
    </main>
  );
}
