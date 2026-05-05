import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderMessage, callGemini } from './app';

describe('Chat App Unit Tests (Core Logic)', () => {
  let chatContent;

  beforeEach(() => {
    // DOM 환경 설정
    document.body.innerHTML = '<div id="chat-content"></div>';
    chatContent = document.getElementById('chat-content');
    
    // scrollTo 모킹 (jsdom에서 지원하지 않을 수 있음)
    if (!chatContent.scrollTo) {
      chatContent.scrollTo = vi.fn();
    }
    
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('renderMessage', () => {
    it('사용자 메시지를 올바른 클래스와 함께 렌더링해야 한다', () => {
      const text = '안녕하세요';
      renderMessage(chatContent, text, 'user');
      
      const msgRow = chatContent.querySelector('.msg-row.user');
      expect(msgRow).not.toBeNull();
      expect(msgRow.querySelector('.bubble').textContent).toBe(text);
    });

    it('봇 메시지를 올바른 클래스와 함께 렌더링해야 한다', () => {
      const text = '반갑습니다';
      renderMessage(chatContent, text, 'bot');
      
      const msgRow = chatContent.querySelector('.msg-row.bot');
      expect(msgRow).not.toBeNull();
      expect(msgRow.querySelector('.bubble').textContent).toBe(text);
    });

    it('줄바꿈 문자를 <br> 태그로 변환해야 한다', () => {
      const text = '첫 줄\n둘째 줄';
      renderMessage(chatContent, text, 'user');
      
      const bubble = chatContent.querySelector('.bubble');
      expect(bubble.innerHTML).toBe('첫 줄<br>둘째 줄');
    });

    it('메시지 렌더링 후 스크롤을 아래로 이동시켜야 한다 (setTimeout 확인)', () => {
      const spy = vi.spyOn(chatContent, 'scrollTo');
      renderMessage(chatContent, '테스트', 'user');
      
      vi.runAllTimers();
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    });
  });

  describe('callGemini', () => {
    const API_KEY = 'TEST_API_KEY';
    const MODEL = 'gemini-flash';

    it('API 키가 없거나 기본 플레이스홀더인 경우 에러 메시지를 표시해야 한다', async () => {
      await callGemini(chatContent, '질문', '', MODEL);
      expect(chatContent.textContent).toContain('에러: .env 파일에 실제 API 키를 입력해주세요.');

      chatContent.innerHTML = '';
      await callGemini(chatContent, '질문', 'YOUR_ACTUAL_API_KEY_HERE', MODEL);
      expect(chatContent.textContent).toContain('에러: .env 파일에 실제 API 키를 입력해주세요.');
    });

    it('호출 시 "생각 중" 로딩 상태를 표시했다가 응답 후 제거해야 한다', async () => {
      let resolveFetch;
      const fetchPromise = new Promise((resolve) => { resolveFetch = resolve; });
      
      global.fetch = vi.fn().mockReturnValue(fetchPromise);

      const callPromise = callGemini(chatContent, '질문', API_KEY, MODEL);
      
      // 호출 직후 로딩 확인
      expect(chatContent.textContent).toContain('... 생각 중 ...');

      // 응답 완료
      resolveFetch({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{ content: { parts: [{ text: '답변' }] } }]
        })
      });

      await callPromise;
      expect(chatContent.textContent).not.toContain('... 생각 중 ...');
      expect(chatContent.textContent).toContain('답변');
    });

    it('API 응답이 실패(404)할 경우 모델 찾을 수 없음 에러를 표시해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: { message: 'Not Found' } })
      });

      await callGemini(chatContent, '질문', API_KEY, MODEL);
      expect(chatContent.textContent).toContain(`에러(404): 모델(${MODEL})을 찾을 수 없습니다.`);
    });

    it('네트워크 통신 자체가 실패할 경우 예외 처리를 해야 한다', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Fail'));

      await callGemini(chatContent, '질문', API_KEY, MODEL);
      expect(chatContent.textContent).toContain('통신 실패: Network Fail');
    });
  });
});
