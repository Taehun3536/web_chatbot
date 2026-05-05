/**
 * 화면에 메시지를 표시합니다.
 */
export function renderMessage(chatContent, text, sender) {
    const row = document.createElement('div');
    row.classList.add('msg-row', sender);
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    
    bubble.textContent = text;
    bubble.innerHTML = bubble.innerHTML.replace(/\n/g, '<br>');
    
    row.appendChild(bubble);
    chatContent.appendChild(row);
    
    setTimeout(() => {
        chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: 'smooth' });
    }, 50);
    
    return row;
}

/**
 * Google Gemini API에 메시지를 전송하고 답변을 받습니다.
 */
export async function callGemini(chatContent, prompt, API_KEY, MODEL_NAME) {
    if (!API_KEY || API_KEY.includes("YOUR_ACTUAL")) {
        renderMessage(chatContent, "에러: .env 파일에 실제 API 키를 입력해주세요.", "bot");
        return;
    }

    const typingRow = document.createElement('div');
    typingRow.className = 'msg-row bot';
    typingRow.innerHTML = '<div class="bubble">... 생각 중 ...</div>';
    chatContent.appendChild(typingRow);
    chatContent.scrollTop = chatContent.scrollHeight;

    // 최신 모델 호환성을 위해 v1beta 엔드포인트 사용
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        typingRow.remove();

        if (response.ok) {
            const reply = data.candidates[0].content.parts[0].text;
            renderMessage(chatContent, reply, 'bot');
        } else {
            const errorStatus = response.status;
            const errorMsg = data.error ? data.error.message : "알 수 없는 에러";
            
            if (errorStatus === 429) {
                renderMessage(chatContent, "에러(429): 현재 사용량이 초과되었습니다. 약 1분 뒤에 다시 시도해 주세요.", "bot");
            } else if (errorStatus === 404) {
                renderMessage(chatContent, `에러(404): 모델(${MODEL_NAME})을 찾을 수 없습니다.`, "bot");
            } else {
                renderMessage(chatContent, `에러 (${errorStatus}): ${errorMsg}`, "bot");
            }
        }
    } catch (e) {
        if (typingRow.parentNode) typingRow.remove();
        renderMessage(chatContent, `통신 실패: ${e.message}`, "bot");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chatContent = document.getElementById('chat-content');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.querySelector('.btn-new-chat');

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    // 2026년 리스트 중 가장 표준적인 최신 플래시 모델 명칭 사용
    const MODEL_NAME = "gemini-flash-latest";

    function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        renderMessage(chatContent, text, 'user');
        userInput.value = '';
        
        callGemini(chatContent, text, API_KEY, MODEL_NAME);
    }

    if (sendBtn) sendBtn.onclick = handleSend;
    if (userInput) {
        userInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleSend();
        };
    }
    
    if (newChatBtn) {
        newChatBtn.onclick = () => {
            if(confirm('모든 대화 내용을 지우고 새로 시작하시겠습니까?')) {
                chatContent.innerHTML = `
                    <div class="msg-row bot">
                        <div class="bubble">
                            대화가 초기화되었습니다. 새로운 질문을 입력해 주세요!
                        </div>
                    </div>
                `;
            }
        };
    }

    // 사이드바 히스토리 클릭 시 안내
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            alert(`'${item.textContent}' 섹션은 현재 준비 중입니다.`);
        });
    });
});

