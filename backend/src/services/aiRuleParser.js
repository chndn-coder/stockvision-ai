const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function parseEnglishToRules(userInput) {
  try {
    if (!userInput || typeof userInput !== "string") {
      throw new Error("Invalid query input");
    }

    const prompt = `
You are a financial stock screener rule compiler.

Convert the user's natural language request into ONLY valid JSON.

Required schema:

{
  "filters": [
    {
      "field": "pe_ratio",
      "operator": "<",
      "value": 20
    }
  ],
  "sector": null,
  "sort": {
    "field": "market_cap",
    "direction": "DESC"
  },
  "limit": null
}

Allowed fields:
current_price
market_cap
pe_ratio
peg_ratio
debt_to_fcf
revenue_growth
ebitda_growth
volume

Allowed operators:
>
<
>=
<=
=
between

Rules:
- "top N" means limit = N.
- "highest" means sort direction DESC.
- "lowest" means sort direction ASC.
- If no sorting is requested, sort = null.
- If no sector is mentioned, sector = null.
- If no limit is mentioned, limit = null.
- "below" means <.
- "above" means >.
- "under" means <.
- "over" means >.
- Return JSON only.
- No markdown.
- No explanations.

User Query:
${userInput}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text.trim();

    const parsed = JSON.parse(text);

    // Safety defaults
    parsed.filters = Array.isArray(parsed.filters)
      ? parsed.filters
      : [];

    parsed.sort = parsed.sort || null;
    parsed.limit = parsed.limit ?? null;
    parsed.sector = parsed.sector || null;

    return parsed;
  } catch (error) {
    console.error("AI Rule Parser Error:", error.message);

    throw new Error("Failed to parse rule using AI");
  }
}

module.exports = {
  parseEnglishToRules,
};