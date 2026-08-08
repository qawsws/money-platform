export const newsSummarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'positives', 'negatives', 'relatedAssets', 'caution'],
  properties: {
    summary: { type: 'string', minLength: 1, maxLength: 700 },
    positives: { type: 'array', maxItems: 4, items: { type: 'string', minLength: 1, maxLength: 180 } },
    negatives: { type: 'array', maxItems: 4, items: { type: 'string', minLength: 1, maxLength: 180 } },
    relatedAssets: { type: 'array', maxItems: 8, items: { type: 'string', minLength: 1, maxLength: 40 } },
    caution: { type: 'string', minLength: 1, maxLength: 400 },
  },
};

export function validateNewsSummary(value) {
  const keys = ['summary', 'positives', 'negatives', 'relatedAssets', 'caution'];
  const isBoundedString = (item, max) => typeof item === 'string' && item.trim().length > 0 && item.length <= max;
  const isStringArray = (items, maxItems, maxLength) => (
    Array.isArray(items)
    && items.length <= maxItems
    && items.every((item) => isBoundedString(item, maxLength))
  );
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.keys(value).some((key) => !keys.includes(key))) return false;
  if (!isBoundedString(value.summary, 700)) return false;
  if (!isStringArray(value.positives, 4, 180)) return false;
  if (!isStringArray(value.negatives, 4, 180)) return false;
  if (!isStringArray(value.relatedAssets, 8, 40)) return false;
  if (!isBoundedString(value.caution, 400)) return false;
  return true;
}
