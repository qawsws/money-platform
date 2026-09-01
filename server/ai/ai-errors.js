export class AiError extends Error {
  constructor(code, publicMessage, status = 500) {
    super(code);
    this.name = 'AiError';
    this.code = code;
    this.publicMessage = publicMessage;
    this.status = status;
  }
}

const limitMessage = '현재 AI 기능의 이용 한도에 도달했습니다. 잠시 후 다시 이용해주세요.';
const retryMessage = 'AI 응답을 처리하지 못했습니다. 잠시 후 다시 이용해주세요.';

export const AI_MESSAGES = {
  failed: retryMessage,
  portfolioFailed: 'AI 포트폴리오 분석을 완료하지 못했습니다. 잠시 후 다시 이용해주세요.',
  investmentFailed: 'AI 투자 인사이트를 생성하지 못했습니다. 잠시 후 다시 이용해주세요.',
  emptyPortfolio: '분석할 보유 자산이 없습니다.',
  insufficientData: '관련 뉴스와 시장 데이터가 부족해 AI 인사이트를 생성할 수 없습니다.',
  disabled: '현재 AI 기능이 비활성화되어 있습니다.',
  timeout: limitMessage,
  rateLimit: limitMessage,
  dailyLimit: limitMessage,
  requestTooLarge: '요청 데이터가 너무 큽니다.',
  config: 'AI 기능 설정이 완료되지 않았습니다.',
  invalidInput: 'AI 분석 요청 데이터가 올바르지 않습니다.',
  invalidResponse: retryMessage,
};
