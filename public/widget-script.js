(function() {
  // Configuração - SUBSTITUA COM SEU COMPANY_ID
  const COMPANY_ID = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'; // ID da empresa Viainfra
  const SUPABASE_URL = 'https://xxojpfhnkxpbznbmhmua.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4b2pwZmhua3hwYnpuYm1obXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzY4NTUsImV4cCI6MjA3NDgxMjg1NX0.K7pqFCShUgQWJgrHThPynEguIkS0_TjIOuKXvIEgNR4';

  // Injetar CSS
  const style = document.createElement('style');
  style.textContent = `
    #viainfra-widget-container * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    #viainfra-chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, hsl(134, 61%, 31%) 0%, hsl(134, 61%, 41%) 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    #viainfra-chat-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    #viainfra-chat-button svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    #viainfra-chat-widget {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      height: 600px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      background: white;
      z-index: 9999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    #viainfra-chat-widget.open {
      display: flex;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .viainfra-chat-header {
      background: linear-gradient(135deg, hsl(134, 61%, 31%) 0%, hsl(134, 61%, 41%) 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .viainfra-chat-header h3 {
      font-size: 18px;
      font-weight: 600;
    }

    .viainfra-chat-header button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 24px;
    }

    .viainfra-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8f9fa;
    }

    .viainfra-message {
      margin-bottom: 16px;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .viainfra-message.bot {
      display: flex;
      gap: 8px;
    }

    .viainfra-message.user {
      display: flex;
      justify-content: flex-end;
    }

    .viainfra-message-content {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 12px;
      line-height: 1.5;
      font-size: 14px;
      white-space: pre-wrap;
    }

    .viainfra-message.bot .viainfra-message-content {
      background: white;
      border: 1px solid #e0e0e0;
    }

    .viainfra-message.user .viainfra-message-content {
      background: linear-gradient(135deg, hsl(134, 61%, 31%) 0%, hsl(134, 61%, 41%) 100%);
      color: white;
    }

    .viainfra-bot-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, hsl(134, 61%, 31%) 0%, hsl(134, 61%, 41%) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .viainfra-quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 20px 10px;
    }

    .viainfra-quick-reply-btn {
      padding: 8px 16px;
      border: 1px solid hsl(134, 61%, 41%);
      background: white;
      color: hsl(134, 61%, 31%);
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .viainfra-quick-reply-btn:hover {
      background: hsl(134, 61%, 41%);
      color: white;
    }

    .viainfra-chat-input {
      padding: 16px;
      background: white;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    }

    .viainfra-chat-input input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }

    .viainfra-chat-input input:focus {
      border-color: hsl(134, 61%, 41%);
    }

    .viainfra-chat-input button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, hsl(134, 61%, 31%) 0%, hsl(134, 61%, 41%) 100%);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 480px) {
      #viainfra-chat-widget {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        right: 10px;
      }
    }
  `;
  document.head.appendChild(style);

  // Criar HTML do widget
  const widgetHTML = `
    <div id="viainfra-widget-container">
      <button id="viainfra-chat-button" aria-label="Abrir chat">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </button>

      <div id="viainfra-chat-widget">
        <div class="viainfra-chat-header">
          <h3>Viainfra - Suporte</h3>
          <button id="viainfra-close-chat">&times;</button>
        </div>
        <div class="viainfra-chat-messages" id="viainfra-chat-messages"></div>
        <div class="viainfra-quick-replies" id="viainfra-quick-replies"></div>
        <div class="viainfra-chat-input">
          <input 
            type="text" 
            id="viainfra-message-input" 
            placeholder="Digite sua mensagem..."
            autocomplete="off"
          />
          <button id="viainfra-send-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  // Inserir widget no body
  document.body.insertAdjacentHTML('beforeend', widgetHTML);

  // Lógica do widget
  let botState = null;
  let isProcessing = false;
  let conversationId = null;

  const button = document.getElementById('viainfra-chat-button');
  const widget = document.getElementById('viainfra-chat-widget');
  const closeBtn = document.getElementById('viainfra-close-chat');
  const messagesContainer = document.getElementById('viainfra-chat-messages');
  const messageInput = document.getElementById('viainfra-message-input');
  const sendButton = document.getElementById('viainfra-send-button');
  const quickRepliesContainer = document.getElementById('viainfra-quick-replies');

  button.addEventListener('click', () => {
    widget.classList.toggle('open');
    if (widget.classList.contains('open')) {
      if (messagesContainer.children.length === 0) {
        iniciarChat();
      }
      messageInput.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    widget.classList.remove('open');
  });

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      enviarMensagem();
    }
  });

  sendButton.addEventListener('click', () => {
    if (!isProcessing) {
      enviarMensagem();
    }
  });

  function addMessage(content, isBot = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `viainfra-message ${isBot ? 'bot' : 'user'}`;
    
    if (isBot) {
      messageDiv.innerHTML = `
        <div class="viainfra-bot-avatar">🤖</div>
        <div class="viainfra-message-content">${content.replace(/\n/g, '<br>')}</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="viainfra-message-content">${content}</div>
      `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showQuickReplies(options) {
    quickRepliesContainer.innerHTML = '';
    if (!options || options.length === 0) return;

    options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'viainfra-quick-reply-btn';
      btn.textContent = option;
      btn.onclick = () => {
        // Extrair apenas o número do início (ex: "1️⃣ Abrir Chamado" -> "1")
        const match = option.match(/(\d+)/);
        if (match) {
          messageInput.value = match[1];
        } else {
          messageInput.value = option;
        }
        enviarMensagem();
      };
      quickRepliesContainer.appendChild(btn);
    });
  }

  async function iniciarChat() {
    isProcessing = true;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({
          action: 'start',
          state: null,
          contactInfo: {
            name: 'Cliente Web',
            phone: null,
            email: null,
          },
          companyId: COMPANY_ID,
        }),
      });

      const data = await response.json();
      
      addMessage(data.message, true);
      botState = data.state;
      conversationId = data.state?.conversationId;
      
      if (data.options) {
        showQuickReplies(data.options);
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      addMessage('Desculpe, ocorreu um erro. Tente novamente.', true);
    } finally {
      isProcessing = false;
    }
  }

  async function enviarMensagem() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;

    addMessage(message, false);
    messageInput.value = '';
    isProcessing = true;
    sendButton.disabled = true;
    quickRepliesContainer.innerHTML = '';

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({
          action: 'message',
          state: botState,
          userMessage: message,
          companyId: COMPANY_ID,
        }),
      });

      const data = await response.json();
      
      addMessage(data.message, true);
      botState = data.state;

      if (data.options) {
        showQuickReplies(data.options);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      addMessage('Desculpe, ocorreu um erro. Tente novamente.', true);
    } finally {
      isProcessing = false;
      sendButton.disabled = false;
      messageInput.focus();
    }
  }
})();
