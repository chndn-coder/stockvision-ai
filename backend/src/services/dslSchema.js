const Ajv = require("ajv");

const ajv = new Ajv({
  allErrors: true,
  strict: true,
});

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
  "between",
];

const schema = {
  type: "object",
  additionalProperties: false,

  properties: {
    filters: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          field: {
            type: "string",
            enum: allowedFields,
          },

          operator: {
            type: "string",
            enum: allowedOperators,
          },

          value: {},
        },

        required: [
          "field",
          "operator",
          "value",
        ],
      },
    },

    sector: {
      type: ["string", "null"],
      maxLength: 100,
    },

    sort: {
      type: ["object", "null"],
      additionalProperties: false,

      properties: {
        field: {
          type: "string",
          enum: allowedFields,
        },

        direction: {
          type: "string",
          enum: ["ASC", "DESC"],
        },
      },

      required: [
        "field",
        "direction",
      ],
    },

    limit: {
      type: ["integer", "null"],
      minimum: 1,
      maximum: 100,
    },
  },

  required: ["filters"],
};

const validate = ajv.compile(schema);

module.exports = validate;