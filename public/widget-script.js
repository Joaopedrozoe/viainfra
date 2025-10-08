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

    #viainfra-chat-button.has-notification::after {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      background: #ff4444;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
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
      flex-shrink: 0;
    }

    .viainfra-chat-header h3 {
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .viainfra-status-indicator {
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      display: inline-block;
      animation: pulse 2s infinite;
    }

    .viainfra-chat-header button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .viainfra-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8f9fa;
      scroll-behavior: smooth;
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
      flex-shrink: 0;
    }

    .viainfra-typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      width: fit-content;
    }

    .viainfra-typing-dot {
      width: 8px;
      height: 8px;
      background: hsl(134, 61%, 41%);
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .viainfra-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .viainfra-typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
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
      flex-shrink: 0;
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
      transition: transform 0.2s;
      flex-shrink: 0;
    }

    .viainfra-chat-input button:hover {
      transform: scale(1.05);
    }

    .viainfra-chat-input button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
          <h3>
            <span class="viainfra-status-indicator"></span>
            Viainfra - Suporte
          </h3>
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
  let existingMessageIds = new Set();
  let pollingInterval = null;
  let lastMessageTimestamp = null;

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
      button.classList.remove('has-notification');
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

  function addMessage(content, isBot = true, messageId = null) {
    // Evitar duplicatas
    if (messageId && existingMessageIds.has(messageId)) {
      return;
    }
    if (messageId) {
      existingMessageIds.add(messageId);
    }

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

  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'viainfra-message bot';
    typingDiv.id = 'viainfra-typing-indicator';
    typingDiv.innerHTML = `
      <div class="viainfra-bot-avatar">🤖</div>
      <div class="viainfra-typing-indicator">
        <div class="viainfra-typing-dot"></div>
        <div class="viainfra-typing-dot"></div>
        <div class="viainfra-typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    const typingIndicator = document.getElementById('viainfra-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Função segura para carregar mensagens usando RPC com token
  async function loadConversationMessages() {
    if (!conversationId || !accessToken) {
      console.log('⏭️ Sem conversationId ou accessToken, pulando carregamento');
      return;
    }
    
    try {
      console.log('🔐 Carregando mensagens com token seguro:', conversationId);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_web_conversation_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_conversation_id: conversationId,
            p_access_token: accessToken
          })
        }
      );

      if (!response.ok) {
        console.error('❌ Erro ao carregar mensagens:', response.status);
        const errorText = await response.text();
        console.error('❌ Detalhes:', errorText);
        return;
      }

      const messages = await response.json();
      console.log('📨 Mensagens carregadas:', messages.length);
      
      if (messages && messages.length > 0) {
        messages.forEach(msg => {
          const isBot = msg.sender_type === 'bot' || msg.sender_type === 'agent';
          addMessage(msg.content, isBot, msg.id);
          
          // Atualizar lastMessageTimestamp
          if (msg.sender_type === 'agent' && (!lastMessageTimestamp || msg.created_at > lastMessageTimestamp)) {
            lastMessageTimestamp = msg.created_at;
          }
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    }
  }

  // Polling seguro usando RPC com token
  async function checkForAgentMessages() {
    if (!conversationId || !accessToken) {
      console.log('⏭️ Sem conversationId ou accessToken, pulando verificação');
      return;
    }

    try {
      console.log('🔐 Verificando mensagens com token seguro:', conversationId);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_web_conversation_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_conversation_id: conversationId,
            p_access_token: accessToken
          })
        }
      );

      if (!response.ok) {
        console.error('❌ Erro na resposta da API:', response.status);
        return;
      }

      const messages = await response.json();
      
      // Filtrar apenas mensagens de agent
      const agentMessages = messages.filter(msg => msg.sender_type === 'agent');
      console.log('📨 Mensagens de atendente:', agentMessages.length);
      
      if (agentMessages && agentMessages.length > 0) {
        let novasMensagens = 0;
        agentMessages.forEach(msg => {
          // Verificar se já exibimos esta mensagem pelo timestamp
          if (!lastMessageTimestamp || msg.created_at > lastMessageTimestamp) {
            console.log('✅ Nova mensagem do atendente:', msg.content);
            
            lastMessageTimestamp = msg.created_at;
            
            if (!widget.classList.contains('open')) {
              button.classList.add('has-notification');
            }
            
            addMessage(msg.content, true, msg.id);
            novasMensagens++;
          }
        });
        
        if (novasMensagens === 0) {
          console.log('⏭️ Todas as mensagens já foram exibidas');
        }
      } else {
        console.log('📭 Nenhuma mensagem de atendente encontrada ainda');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
    }
  }

  function showQuickReplies(options) {
    quickRepliesContainer.innerHTML = '';
    if (!options || options.length === 0) return;
    
    options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'viainfra-quick-reply-btn';
      btn.textContent = option;
      btn.onclick = () => {
        const match = option.match(/(\d+)/);
        if (match) {
          messageInput.value = match[1];
        } else {
          messageInput.value = option;
        }
        quickRepliesContainer.innerHTML = '';
        enviarMensagem();
      };
      quickRepliesContainer.appendChild(btn);
    });
  }
  
  function showPlacasQuickReplies(placas) {
    quickRepliesContainer.innerHTML = '';
    if (!placas || placas.length === 0) return;
    
    placas.forEach((placa, index) => {
      const btn = document.createElement('button');
      btn.className = 'viainfra-quick-reply-btn';
      btn.textContent = `${index + 1}. ${placa}`;
      btn.onclick = () => {
        messageInput.value = (index + 1).toString();
        quickRepliesContainer.innerHTML = '';
        enviarMensagem();
      };
      quickRepliesContainer.appendChild(btn);
    });
  }

  async function startPollingForAgentMessages() {
    if (pollingInterval) {
      console.log('⏭️ Polling já está ativo');
      return;
    }

    console.log('⏱️ Iniciando polling para mensagens do atendente (intervalo: 2s)');
    
    // Verificar imediatamente
    await checkForAgentMessages();
    
    // Continuar verificando a cada 2 segundos
    pollingInterval = setInterval(() => {
      checkForAgentMessages();
    }, 2000);
  }

  async function iniciarChat() {
    isProcessing = true;
    showTyping();
    
    try {
      // Buscar a conversa web mais recente
      console.log('🔍 Buscando conversa web mais recente...');
      
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/conversations?company_id=eq.${COMPANY_ID}&channel=eq.web&status=eq.open&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (checkResponse.ok) {
        const existingConversations = await checkResponse.json();
        
        if (existingConversations && existingConversations.length > 0) {
          const latestConv = existingConversations[0];
          
          // Verificar se a conversa está em estado finalizado
          const metadata = latestConv.metadata || {};
          const isFinalizado = metadata.chamadoStep === 'finalizado' || 
                              metadata.mode === 'menu' && metadata.chamadoStep === 'finalizado';
          
          if (isFinalizado) {
            console.log('🔄 Conversa anterior finalizada, criando nova...');
            // Não reutilizar - forçar criação de nova conversa
          } else {
            conversationId = latestConv.id;
            accessToken = latestConv.access_token;
            
            console.log('♻️ Usando conversa existente:', conversationId);
            hideTyping();
            
            // Carregar histórico de mensagens
            await loadConversationMessages();
            
            // Configurar polling imediatamente
            startPollingForAgentMessages();
            isProcessing = false;
            return;
          }
        }
      }
      
      // Se não encontrou conversa, criar uma nova
      console.log('📝 Criando nova conversa...');
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
      
      hideTyping();
      addMessage(data.message, true);
      botState = data.state;
      conversationId = data.state?.conversationId;
      accessToken = data.state?.accessToken; // CRÍTICO: Armazenar token
      
      console.log('💬 Nova conversa criada com ID:', conversationId);
      console.log('🔐 Access token recebido:', accessToken ? 'Sim' : 'Não');
      
      if (conversationId && accessToken) {
        // Configurar polling imediatamente
        startPollingForAgentMessages();
      } else {
        console.error('❌ Conversa criada sem token de acesso!');
      }
      
      if (data.state?.placas && data.state.placas.length > 0 && data.state?.mode === 'chamado') {
        showPlacasQuickReplies(data.state.placas);
      } else if (data.options) {
        showQuickReplies(data.options);
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      hideTyping();
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

    showTyping();

    try {
      // Se temos token, salvar mensagem via RPC seguro
      if (accessToken && conversationId) {
        console.log('🔐 Enviando mensagem via RPC seguro');
        
        await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/send_web_conversation_message`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              p_conversation_id: conversationId,
              p_access_token: accessToken,
              p_content: message
            })
          }
        );
      }

      // Processar resposta do bot
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
      
      hideTyping();
      addMessage(data.message, true);
      botState = data.state;
      
      if (data.state?.placas && data.state.placas.length > 0 && data.state?.mode === 'chamado') {
        showPlacasQuickReplies(data.state.placas);
      } else if (data.options) {
        showQuickReplies(data.options);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      hideTyping();
      addMessage('Desculpe, ocorreu um erro. Tente novamente.', true);
    } finally {
      isProcessing = false;
      sendButton.disabled = false;
      messageInput.focus();
    }
  }

  window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  });
})();
