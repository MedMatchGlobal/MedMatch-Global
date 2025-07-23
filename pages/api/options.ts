import countries from "@/data/countries";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { type } = req.body;

    if (type === "countries") {
      return res.status(200).json({ options: countries });
    }

    return res.status(400).json({ error: "Invalid type" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
