function initChatWidget() {
  // 1. Inject Widget HTML
  const widgetHTML = `
    <!-- Floating Button -->
    <div class="chat-widget-btn" id="chat-widget-btn">
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
      </svg>
    </div>

    <!-- Chat Panel -->
    <div class="chat-panel" id="chat-panel">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="status-dot"></div>
          <h3>VoltGuard Assistant</h3>
        </div>
        <button class="close-chat-btn" id="close-chat-btn">&times;</button>
      </div>

      <!-- Messages -->
      <div class="chat-messages" id="chat-messages">
        <div class="message bot">
          Hello! I'm the VoltGuard Electrical assistant. How can I help you today?
          <div class="quick-replies" id="initial-quick-replies">
            <button class="quick-reply-btn">Get a Quote</button>
            <button class="quick-reply-btn">Emergency Callout</button>
            <button class="quick-reply-btn">Service Areas</button>
          </div>
        </div>
        
        <!-- Typing Indicator -->
        <div class="typing-indicator" id="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." autocomplete="off">
        <button class="chat-send-btn" id="chat-send-btn">Send</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', widgetHTML);

  // 2. DOM Elements
  const chatBtn = document.getElementById('chat-widget-btn');
  const chatPanel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('close-chat-btn');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const messagesContainer = document.getElementById('chat-messages');
  const typingIndicator = document.getElementById('typing-indicator');
  const quickReplies = document.querySelectorAll('.quick-reply-btn');

  // 3. State (In-memory conversation history)
  let conversationHistory = [];

  // 4. Event Listeners
  chatBtn.addEventListener('click', () => {
    chatPanel.classList.add('active');
    chatBtn.style.display = 'none';
    chatInput.focus();
  });

  closeBtn.addEventListener('click', () => {
    chatPanel.classList.remove('active');
    chatBtn.style.display = 'flex';
  });

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  quickReplies.forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.textContent;
      document.getElementById('initial-quick-replies').style.display = 'none';
      handleSend();
    });
  });

  // 5. Logic
  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Hide quick replies if they are still visible
    const initialQR = document.getElementById('initial-quick-replies');
    if (initialQR) initialQR.style.display = 'none';

    // Add user message to UI and history
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });
    chatInput.value = '';

    // Show typing indicator
    showTyping();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory })
      });

      const data = await response.json();
      hideTyping();

      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }

      // Add bot message to UI and history
      appendMessage('bot', data.reply);
      conversationHistory.push({ role: 'assistant', content: data.reply });

    } catch (err) {
      hideTyping();
      appendMessage('bot', 'Sorry, I am having trouble connecting right now. Please call 1800 945 221.');
      console.error(err);
    }
  }

  function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    // Simple bolding and line break parsing for basic markdown support from LLM
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    msgDiv.innerHTML = formattedText;
    
    // Insert before typing indicator
    messagesContainer.insertBefore(msgDiv, typingIndicator);
    scrollToBottom();
  }

  function showTyping() {
    typingIndicator.classList.add('active');
    scrollToBottom();
  }

  function hideTyping() {
    typingIndicator.classList.remove('active');
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatWidget);
} else {
  initChatWidget();
}
