export const investmentInsightsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'highlights', 'portfolioObservation', 'newsObservation', 'riskChecks', 'disclaimer'],
  properties: {
    summary: { type: 'string', minLength: 1, maxLength: 500 },
    highlights: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description', 'type'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 80 },
          description: { type: 'string', minLength: 1, maxLength: 240 },
          type: { type: 'string', enum: ['portfolio', 'news', 'market', 'risk'] },
        },
      },
    },
    portfolioObservation: { type: 'string', minLength: 1, maxLength: 500 },
    newsObservation: { type: 'string', minLength: 1, maxLength: 500 },
    riskChecks: { type: 'array', maxItems: 3, items: { type: 'string', minLength: 1, maxLength: 180 } },
    disclaimer: { type: 'string', minLength: 1, maxLength: 180 },
  },
};

export function validateInvestmentInsights(value) {
  const hasOnlyKeys = (item, keys) => item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).every((key) => keys.includes(key));
  const isBoundedString = (item, max) => typeof item === 'string' && item.trim().length > 0 && item.length <= max;
  const isStringArray = (items, maxItems, maxLength) => Array.isArray(items) && items.length <= maxItems && items.every((item) => isBoundedString(item, maxLength));
  if (!hasOnlyKeys(value, ['summary', 'highlights', 'portfolioObservation', 'newsObservation', 'riskChecks', 'disclaimer'])) return false;
  if (!isBoundedString(value.summary, 500) || !isBoundedString(value.portfolioObservation, 500) || !isBoundedString(value.newsObservation, 500) || !isBoundedString(value.disclaimer, 180)) return false;
  if (!Array.isArray(value.highlights) || value.highlights.length < 1 || value.highlights.length > 4) return false;
  if (!value.highlights.every((item) => hasOnlyKeys(item, ['title', 'description', 'type']) && isBoundedString(item.title, 80) && isBoundedString(item.description, 240) && ['portfolio', 'news', 'market', 'risk'].includes(item.type))) return false;
  return isStringArray(value.riskChecks, 3, 180);
}
