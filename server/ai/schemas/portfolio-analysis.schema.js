export const portfolioAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['overallSummary', 'composition', 'performance', 'strengths', 'risks', 'checkpoints'],
  properties: {
    overallSummary: { type: 'string', minLength: 1, maxLength: 700 },
    composition: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'assetTypeInsights'],
      properties: {
        summary: { type: 'string', minLength: 1, maxLength: 600 },
        assetTypeInsights: { type: 'array', maxItems: 5, items: { type: 'string', minLength: 1, maxLength: 220 } },
      },
    },
    performance: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'positiveContributors', 'negativeContributors'],
      properties: {
        summary: { type: 'string', minLength: 1, maxLength: 600 },
        positiveContributors: { type: 'array', maxItems: 5, items: { type: 'string', minLength: 1, maxLength: 220 } },
        negativeContributors: { type: 'array', maxItems: 5, items: { type: 'string', minLength: 1, maxLength: 220 } },
      },
    },
    strengths: { type: 'array', maxItems: 5, items: { type: 'string', minLength: 1, maxLength: 220 } },
    risks: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description', 'severity'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 80 },
          description: { type: 'string', minLength: 1, maxLength: 260 },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
    checkpoints: { type: 'array', maxItems: 5, items: { type: 'string', minLength: 1, maxLength: 220 } },
  },
};

export function validatePortfolioAnalysis(value) {
  const hasOnlyKeys = (item, keys) => item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).every((key) => keys.includes(key));
  const isBoundedString = (item, max) => typeof item === 'string' && item.trim().length > 0 && item.length <= max;
  const isStringArray = (items, maxItems, maxLength) => (
    Array.isArray(items)
    && items.length <= maxItems
    && items.every((item) => isBoundedString(item, maxLength))
  );
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!hasOnlyKeys(value, ['overallSummary', 'composition', 'performance', 'strengths', 'risks', 'checkpoints'])) return false;
  if (!isBoundedString(value.overallSummary, 700)) return false;
  if (!hasOnlyKeys(value.composition, ['summary', 'assetTypeInsights'])) return false;
  if (!isBoundedString(value.composition.summary, 600) || !isStringArray(value.composition.assetTypeInsights, 5, 220)) return false;
  if (!hasOnlyKeys(value.performance, ['summary', 'positiveContributors', 'negativeContributors'])) return false;
  if (!isBoundedString(value.performance.summary, 600) || !isStringArray(value.performance.positiveContributors, 5, 220) || !isStringArray(value.performance.negativeContributors, 5, 220)) return false;
  if (!isStringArray(value.strengths, 5, 220) || !isStringArray(value.checkpoints, 5, 220)) return false;
  if (!Array.isArray(value.risks) || value.risks.length > 5) return false;
  return value.risks.every((risk) => (
    hasOnlyKeys(risk, ['title', 'description', 'severity'])
    && isBoundedString(risk.title, 80)
    && isBoundedString(risk.description, 260)
    && ['low', 'medium', 'high'].includes(risk.severity)
  ));
}
