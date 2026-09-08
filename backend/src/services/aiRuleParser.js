const {
  GoogleGenAI,
} = require("@google/genai");

const fallbackParser =
  require("./fallbackParser");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const RETRY_DELAY_MS = 1200;

const delay = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

function isTemporaryAIError(error) {
  const message =
    error?.message?.toLowerCase() || "";

  const status =
    error?.status ||
    error?.code ||
    error?.response?.status;

  return (
    status === 429 ||
    status === 503 ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("high demand") ||
    message.includes("unavailable") ||
    message.includes(
      "resource exhausted"
    )
  );
}

function applySafetyDefaults(parsed) {
  return {
    filters: Array.isArray(parsed.filters)
      ? parsed.filters
      : [],

    sector:
      typeof parsed.sector === "string"
        ? parsed.sector
        : null,

    sort:
      parsed.sort &&
      typeof parsed.sort === "object"
        ? parsed.sort
        : null,

    limit:
      parsed.limit === null ||
      parsed.limit === undefined
        ? null
        : parsed.limit,
  };
}

async function callGemini(userInput) {
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
${JSON.stringify(userInput)}
`;

  const response =
    await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType:
          "application/json",
      },
    });

  const text =
    response.text?.trim();

  if (!text) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }

  return applySafetyDefaults(
    JSON.parse(text)
  );
}

async function parseEnglishToRules(
  userInput
) {
  if (
    !userInput ||
    typeof userInput !== "string"
  ) {
    throw new Error(
      "Invalid query input"
    );
  }

  try {
    const result =
      await callGemini(userInput);

    console.log(
      "AI screener parser: Gemini"
    );

    return result;
  } catch (firstError) {
    console.warn(
      "AI parser attempt failed:",
      firstError.message
    );

    if (isTemporaryAIError(firstError)) {
      console.log(
        "Retrying AI parser once..."
      );

      await delay(RETRY_DELAY_MS);

      try {
        const result =
          await callGemini(userInput);

        console.log(
          "AI screener parser: Gemini retry"
        );

        return result;
      } catch (retryError) {
        console.warn(
          "AI parser retry failed:",
          retryError.message
        );
      }
    }

    try {
      const fallback =
        fallbackParser(userInput);

      console.log(
        "AI screener parser: deterministic fallback"
      );

      return fallback;
    } catch (fallbackError) {
      console.error(
        "Fallback parser failed:",
        fallbackError.message
      );

      throw new Error(
        "Unable to understand this screening query"
      );
    }
  }
}

module.exports = {
  parseEnglishToRules,
};