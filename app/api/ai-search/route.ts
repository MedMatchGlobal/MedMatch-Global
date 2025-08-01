import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { result: "Missing query from request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { result: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

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
            content:
              "You are a helpful medical assistant that identifies equivalent medications in other countries based on active ingredients and dosages.",
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
      return NextResponse.json(
        { result: "Unexpected response from OpenAI" },
        { status: 500 }
      );
    }

    const result = json.choices[0].message.content;
    return NextResponse.json({ result });

  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { result: "Error communicating with OpenAI" },
      { status: 500 }
    );
  }
}
