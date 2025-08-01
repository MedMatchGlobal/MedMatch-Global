import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  result: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ result: "Missing query from request body" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ result: "Missing OpenAI API key" });
  }

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful medical assistant that identifies equivalent medications in other countries based on active ingredients and dosages.",
          },
          {
            role: "user",
            content: query,
          },
        ],
      }),
    });

    const json = await openaiResponse.json();

    if (!json.choices || !json.choices[0]?.message?.content) {
      console.error("Unexpected OpenAI response:", json);
      return res.status(500).json({ result: "Unexpected response from OpenAI" });
    }

    const result = json.choices[0].message.content;
    return res.status(200).json({ result });

  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ result: "Error communicating with OpenAI" });
  }
}
