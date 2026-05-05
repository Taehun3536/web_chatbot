import { test, expect } from '@playwright/test';

/**
 * 챗봇 서비스의 주요 사용자 시나리오를 검증하는 E2E 테스트입니다.
 * 실제 API 호출을 가로채서(Mocking) 일관된 테스트 결과를 보장합니다.
 */
test.describe('Connect AI - 사용자 시나리오 E2E 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Google Gemini API 호출 가로채기 설정
    await page.route('**/generativelanguage.googleapis.com/**', async (route) => {
      const requestBody = route.request().postDataJSON();
      const userPrompt = requestBody.contents[0].parts[0].text;

      // 특정 키워드에 따른 모킹 응답 분기
      let responseBody;
      let status = 200;

      if (userPrompt === 'TRIGGER_ERROR_429') {
        status = 429;
        responseBody = { error: { message: 'Quota exceeded' } };
      } else if (userPrompt === 'TRIGGER_ERROR_500') {
        status = 500;
        responseBody = { error: { message: 'Internal Server Error' } };
      } else {
        responseBody = {
          candidates: [{ content: { parts: [{ text: `"${userPrompt}"에 대한 AI의 답변입니다.` }] } }]
        };
      }

      // 로딩 상태("생각 중")를 테스트하기 위해 500ms 지연 추가
      await new Promise(resolve => setTimeout(resolve, 500));

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseBody),
      });
    });

    // 2. 메인 페이지 접속
    await page.goto('/');
  });

  test('랜딩: 환영 메시지와 기본 UI가 올바르게 표시되어야 한다', async ({ page }) => {
    // 헤더 타이틀 확인
    await expect(page.locator('.chat-header h2')).toHaveText('Connect AI Assistant');
    
    // 초기 봇 메시지 확인
    const welcomeBubble = page.locator('.msg-row.bot .bubble').first();
    await expect(welcomeBubble).toContainText('안녕하세요!');
    
    // 입력창 활성화 확인
    await expect(page.locator('#user-input')).toBeEnabled();
  });

  test('메시징: 텍스트 입력 후 전송 시 대화 흐름이 정상적이어야 한다', async ({ page }) => {
    const input = page.locator('#user-input');
    const sendBtn = page.locator('#send-btn');
    const testMessage = '프로젝트에 대해 알려줘';

    // 메시지 입력 및 버튼 클릭
    await input.fill(testMessage);
    await sendBtn.click();

    // 1. 입력창이 비워졌는지 확인
    await expect(input).toHaveValue('');

    // 2. 사용자 메시지가 화면에 나타났는지 확인
    await expect(page.locator('.msg-row.user')).toContainText(testMessage);

    // 3. 로딩 상태("생각 중")가 일시적으로 나타나는지 확인
    await expect(page.locator('.msg-row.bot >> text=생각 중')).toBeVisible();

    // 4. AI 응답이 최종적으로 표시되는지 확인
    await expect(page.locator('.msg-row.bot >> text=AI의 답변입니다.')).toBeVisible();
  });

  test('엔터키 전송: 엔터 키 입력 시에도 메시지가 전송되어야 한다', async ({ page }) => {
    await page.fill('#user-input', '엔터 키 테스트');
    await page.press('#user-input', 'Enter');

    await expect(page.locator('.msg-row.user')).toContainText('엔터 키 테스트');
    await expect(page.locator('.msg-row.bot >> text=AI의 답변입니다.')).toBeVisible();
  });

  test('예외 처리: 429 에러 발생 시 사용자에게 재시도 안내를 해야 한다', async ({ page }) => {
    await page.fill('#user-input', 'TRIGGER_ERROR_429');
    await page.click('#send-btn');

    const errorMsg = page.locator('.msg-row.bot .bubble').last();
    await expect(errorMsg).toContainText('현재 사용량이 초과되었습니다');
    await expect(errorMsg).toContainText('1분 뒤에 다시 시도');
  });

  test('대화 초기화: "새 대화 시작" 버튼 클릭 시 모든 대화가 사라지고 초기화되어야 한다', async ({ page }) => {
    // 여러 메시지 생성
    await page.fill('#user-input', '메시지 1');
    await page.click('#send-btn');
    await page.fill('#user-input', '메시지 2');
    await page.click('#send-btn');

    // 대화 초기화 버튼 클릭 (Confirm 다이얼로그 수락)
    page.on('dialog', dialog => dialog.accept());
    await page.click('.btn-new-chat');

    // 이전 메시지들이 사라졌는지 확인
    await expect(page.locator('.msg-row.user')).toHaveCount(0);
    
    // 초기화 안내 메시지 확인
    await expect(page.locator('.msg-row.bot')).toContainText('대화가 초기화되었습니다');
  });

  test('접근성: 사이드바 메뉴 클릭 시 준비 중 피드백을 주어야 한다', async ({ page }) => {
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('준비 중입니다');
      await dialog.dismiss();
    });

    // 활성화되지 않은 히스토리 아이템 클릭
    await page.locator('.history-item:not(.active)').first().click();
  });

  test('반응형: 모바일 해상도에서도 입력창이 정상적으로 보여야 한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE 사이즈
    
    const inputGroup = page.locator('.chat-footer .input-group');
    await expect(inputGroup).toBeVisible();
    
    // 입력창이 화면 너비에 맞게 적절히 표시되는지 확인
    const box = await inputGroup.boundingBox();
    expect(box.width).toBeGreaterThan(300);
  });
});
