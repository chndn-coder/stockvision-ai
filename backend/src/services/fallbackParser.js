const FIELD_PATTERNS = [
  {
    field: "market_cap",
    patterns: [
      "market cap",
      "market capitalization",
    ],
  },
  {
    field: "current_price",
    patterns: [
      "current price",
      "stock price",
      "price",
    ],
  },
  {
    field: "pe_ratio",
    patterns: [
      "pe ratio",
      "p/e ratio",
      "p/e",
      "pe",
    ],
  },
  {
    field: "peg_ratio",
    patterns: [
      "peg ratio",
      "peg",
    ],
  },
  {
    field: "debt_to_fcf",
    patterns: [
      "debt to fcf",
      "debt/fcf",
      "debt fcf",
    ],
  },
  {
    field: "revenue_growth",
    patterns: [
      "revenue growth",
    ],
  },
  {
    field: "ebitda_growth",
    patterns: [
      "ebitda growth",
    ],
  },
  {
    field: "volume",
    patterns: [
      "trading volume",
      "volume",
    ],
  },
];

const SECTORS = [
  {
    words: ["technology", "tech"],
    value: "Technology",
  },
  {
    words: ["financial", "finance"],
    value: "Financial",
  },
  {
    words: ["consumer"],
    value: "Consumer",
  },
  {
    words: ["healthcare", "health care"],
    value: "Healthcare",
  },
  {
    words: ["energy"],
    value: "Energy",
  },
  {
    words: ["industrial"],
    value: "Industrial",
  },
  {
    words: ["communication"],
    value: "Communication",
  },
  {
    words: ["automotive", "auto"],
    value: "Automotive",
  },
  {
    words: ["semiconductor", "semiconductors"],
    value: "Semiconductors",
  },
];

const COMPARATORS = [
  {
    words: ["less than", "below", "under"],
    operator: "<",
  },
  {
    words: ["greater than", "above", "over"],
    operator: ">",
  },
  {
    words: [
      "at least",
      "greater than or equal to",
    ],
    operator: ">=",
  },
  {
    words: [
      "at most",
      "less than or equal to",
    ],
    operator: "<=",
  },
  {
    words: ["equal to", "equals"],
    operator: "=",
  },
];

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function normalizeInput(input) {
  return input
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCondition(text, fieldConfig) {
  for (const fieldPattern of fieldConfig.patterns) {
    const escapedField =
      escapeRegex(fieldPattern);

    const betweenRegex = new RegExp(
      `${escapedField}\\s+between\\s+(-?\\d+(?:\\.\\d+)?)\\s+(?:and|to)\\s+(-?\\d+(?:\\.\\d+)?)`,
      "i"
    );

    const betweenMatch =
      text.match(betweenRegex);

    if (betweenMatch) {
      return {
        field: fieldConfig.field,
        operator: "between",
        value: [
          Number(betweenMatch[1]),
          Number(betweenMatch[2]),
        ],
      };
    }

    for (const comparator of COMPARATORS) {
      for (const comparatorWord of comparator.words) {
        const regex = new RegExp(
          `${escapedField}\\s+${escapeRegex(
            comparatorWord
          )}\\s+(-?\\d+(?:\\.\\d+)?)`,
          "i"
        );

        const match = text.match(regex);

        if (match) {
          return {
            field: fieldConfig.field,
            operator: comparator.operator,
            value: Number(match[1]),
          };
        }
      }
    }
  }

  return null;
}

function findSector(text) {
  for (const sector of SECTORS) {
    const matched = sector.words.some(
      (word) =>
        text.includes(word.toLowerCase())
    );

    if (matched) {
      return sector.value;
    }
  }

  return null;
}

function findSort(text) {
  const direction =
    text.includes("highest") ||
    text.includes("largest")
      ? "DESC"
      : text.includes("lowest") ||
          text.includes("smallest")
        ? "ASC"
        : null;

  if (!direction) {
    return null;
  }

  for (const fieldConfig of FIELD_PATTERNS) {
    const matched =
      fieldConfig.patterns.some(
        (pattern) =>
          text.includes(pattern)
      );

    if (matched) {
      return {
        field: fieldConfig.field,
        direction,
      };
    }
  }

  return null;
}

function findLimit(text) {
  const match = text.match(
    /\btop\s+(\d+)\b/i
  );

  if (!match) {
    return null;
  }

  const limit = Number(match[1]);

  return Number.isInteger(limit) &&
    limit > 0
    ? limit
    : null;
}

function fallbackParser(input) {
  if (
    !input ||
    typeof input !== "string"
  ) {
    throw new Error(
      "Invalid query input"
    );
  }

  const text = normalizeInput(input);

  const filters = [];

  for (const fieldConfig of FIELD_PATTERNS) {
    const condition = findCondition(
      text,
      fieldConfig
    );

    if (condition) {
      filters.push(condition);
    }
  }

  const sector = findSector(text);
  const sort = findSort(text);
  const limit = findLimit(text);

  const hasUsefulRule =
    filters.length > 0 ||
    sector !== null ||
    sort !== null ||
    limit !== null;

  if (!hasUsefulRule) {
    throw new Error(
      "Unable to understand this stock screening query"
    );
  }

  return {
    filters,
    sector,
    sort,
    limit,
  };
}

module.exports = fallbackParser;