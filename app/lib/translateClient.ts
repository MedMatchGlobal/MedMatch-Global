export async function translateClient(text: string, target: string): Promise<string> {
  if (!text?.trim() || target === "en") return text;
  try {
    const r = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target }),
    });
    if (!r.ok) {
      console.warn("translateClient: HTTP", r.status, await r.text());
      return text; // keep original on error
    }
    const j = await r.json();
    if (!j?.translated || typeof j.translated !== "string") {
      console.warn("translateClient: bad payload", j);
      return text;
    }
    return j.translated;
  } catch (e) {
    console.warn("translateClient: exception", e);
    return text;
  }
}
