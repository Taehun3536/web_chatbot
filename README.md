# Connect AI | Modern Web Chatbot Portfolio

**Connect AI**는 Google Gemini API를 활용한 지능형 웹 챗봇 인터페이스 프로젝트입니다. 세련된 사용자 인터페이스와 실시간 AI 응답 기능을 통해 현대적인 웹 챗봇의 사용자 경험을 제공합니다.

![Connect AI Screenshot](https://via.placeholder.com/800x450?text=Connect+AI+Chatbot+Interface) <!-- 실제 스크린샷이 있다면 교체 가능 -->

## 🚀 주요 기능

- **실시간 AI 대화**: Google Gemini Flash 모델을 사용하여 빠르고 정확한 응답을 제공합니다.
- **반응형 디자인**: 다양한 기기 환경에서도 최적화된 채팅 레이아웃을 제공합니다.
- **대화 초기화**: '새 대화 시작' 기능을 통해 채팅 내역을 초기화하고 다시 시작할 수 있습니다.
- **히스토리 관리**: 사이드바를 통해 이전 대화 주제를 탐색할 수 있는 UI를 제공합니다 (현재 UIMock 상태).
- **에러 핸들링**: API 키 누락, 통신 오류, 사용량 초과 등에 대한 사용자 친화적인 안내 메시지를 포함합니다.

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ESM)
- **Bundler**: [Vite](https://vitejs.dev/)
- **AI Engine**: [Google Generative AI (Gemini API)](https://ai.google.dev/)
- **Testing**:
  - [Vitest](https://vitest.dev/): Unit & Component Testing
  - [Playwright](https://playwright.dev/): End-to-End (E2E) Testing

## 📦 설치 및 실행 방법

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/web-chatbot.git
cd web-chatbot
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 발급받은 Gemini API 키를 입력합니다.
```bash
# .env 파일 예시
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. 로컬 개발 서버 실행
```bash
npm run dev
```
기본적으로 `http://localhost:5173`에서 실행됩니다.

## 🧪 테스트 실행

### Unit 테스트 (Vitest)
```bash
npm run test
```

### E2E 테스트 (Playwright)
```bash
npx playwright install # 최초 실행 시 브라우저 설치 필요
npm run test:e2e
```

## 📂 프로젝트 구조

```text
web-chatbot/
├── src/
│   ├── css/
│   │   └── style.css      # 스타일링 (Layout, Theme, Components)
│   └── js/
│       ├── app.js         # 메인 로직 및 API 연동
│       └── app.test.js    # 단위 테스트
├── tests/
│   └── chat.spec.js       # Playwright E2E 테스트
├── index.html             # 메인 HTML 구조
├── vite.config.js         # Vite 설정
└── playwright.config.js   # Playwright 설정
```

