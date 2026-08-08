import { commonAiRules } from './common.js';

export function createNewsSummaryPrompt(news) {
  return `
${commonAiRules}

아래 금융 뉴스를 한국어로 분석하세요.

반환 JSON 형식:
{
  "summary": "핵심 요약 한 문단",
  "positives": ["긍정적 요인"],
  "negatives": ["부정적 요인"],
  "relatedAssets": ["관련 자산 심볼 또는 이름"],
  "caution": "투자자가 추가 확인해야 할 사항"
}

작성 기준:
- summary는 2~3문장 이내로 작성합니다.
- positives와 negatives는 각각 최대 4개까지만 작성합니다.
- relatedAssets는 뉴스에 직접 언급되거나 명확히 관련된 자산만 포함합니다.
- 모르는 자산 심볼은 추측하지 마세요.
- caution에는 추가로 확인해야 할 공시, 실적, 거시지표, 원문 확인 포인트를 적습니다.
- 뉴스 원문에 없는 전망, 실적, 금리, 가격 정보를 추가하지 마세요.

뉴스 데이터:
제목: ${news.title || ''}
요약/본문: ${news.summary || news.content || news.description || ''}
카테고리: ${news.category || ''}
출처: ${news.source || news.provider || ''}
관련 종목 정보: ${(news.relatedAssets || []).join(', ')}
원문 URL: ${news.url || ''}
`;
}
