const allowedFields = [
  "current_price",
  "market_cap",
  "pe_ratio",
  "peg_ratio",
  "debt_to_fcf",
  "revenue_growth",
  "ebitda_growth",
  "volume",
];

const allowedOperators = [
  ">",
  "<",
  ">=",
  "<=",
  "=",
];

const allowedSortDirections = [
  "ASC",
  "DESC",
];

const compileQuery = (dsl) => {
  let query = `
    SELECT
      symbol,
      company_name,
      sector,
      current_price,
      pe_ratio,
      peg_ratio,
      market_cap,
      revenue_growth,
      ebitda_growth,
      debt_to_fcf,
      volume
    FROM stocks
    WHERE 1=1
  `;

  const values = [];
  let index = 1;

  // --------------------------------
  // Filters
  // --------------------------------

  if (Array.isArray(dsl.filters)) {
    for (const filter of dsl.filters) {
      if (!allowedFields.includes(filter.field)) {
        throw new Error(
          `Invalid filter field: ${filter.field}`
        );
      }

      if (filter.operator === "between") {
        if (
          !Array.isArray(filter.value) ||
          filter.value.length !== 2
        ) {
          throw new Error(
            "BETWEEN requires exactly two values"
          );
        }

        query += `
          AND ${filter.field}
          BETWEEN $${index}
          AND $${index + 1}
        `;

        values.push(
          filter.value[0],
          filter.value[1]
        );

        index += 2;

      } else {

        if (!allowedOperators.includes(filter.operator)) {
          throw new Error(
            `Invalid filter operator: ${filter.operator}`
          );
        }

        query += `
          AND ${filter.field}
          ${filter.operator}
          $${index}
        `;

        values.push(filter.value);

        index++;
      }
    }
  }

  // --------------------------------
  // Sector
  // --------------------------------

  if (dsl.sector) {
    query += ` AND sector = $${index}`;

    values.push(dsl.sector);

    index++;
  }

  // --------------------------------
  // Sorting
  // --------------------------------

  if (dsl.sort) {
    if (
      !allowedFields.includes(
        dsl.sort.field
      )
    ) {
      throw new Error(
        `Invalid sort field: ${dsl.sort.field}`
      );
    }

    if (
      !allowedSortDirections.includes(
        dsl.sort.direction
      )
    ) {
      throw new Error(
        `Invalid sort direction: ${dsl.sort.direction}`
      );
    }

    query += `
      ORDER BY
      ${dsl.sort.field}
      ${dsl.sort.direction}
    `;
  }

  // --------------------------------
  // Limit
  // --------------------------------

  if (dsl.limit !== null && dsl.limit !== undefined) {
    if (
      !Number.isInteger(dsl.limit) ||
      dsl.limit < 1 ||
      dsl.limit > 100
    ) {
      throw new Error(
        "Limit must be between 1 and 100"
      );
    }

    query += ` LIMIT ${dsl.limit}`;
  }

  return {
    query,
    values,
  };
};

module.exports = compileQuery;