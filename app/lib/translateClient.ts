export async function translateClient(text: string, target: string): Promise<string>{
  try{
    const r = await fetch("/api/translate", {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({text, target})
    });
    if(!r.ok) throw new Error(await r.text());
    const j = await r.json();
    return j.translated || text;
  }catch{
    return text; // fail-open
  }
}
