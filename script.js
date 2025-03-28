document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded, initializing DEBoot...");
  const chatbox = document.getElementById("chatbox");
  if (chatbox) {
    loadChatHistory();
  } else {
    console.log("No chatbox found on this page.");
  }

  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  const pageContainer = document.querySelector('.page-container');
  const navLinks = document.querySelectorAll('.sidebar a');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebar.classList.toggle('closed');
      pageContainer.classList.toggle('full-width');
      console.log("Sidebar toggled");
    });
  }

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !toggleBtn.contains(e.target) && 
        sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      sidebar.classList.add('closed');
      pageContainer.classList.add('full-width');
    }
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebar.classList.add('closed');
        pageContainer.classList.add('full-width');
      }
    });
  });

  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.className = savedTheme + "-theme";
  if (document.getElementById("themeSelect")) {
    document.getElementById("themeSelect").value = savedTheme;
  }

  const userInput = document.getElementById("userInput");
  const fileInput = document.getElementById("fileInput");
  if (userInput) {
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = `${userInput.scrollHeight}px`;
    });
    userInput.addEventListener('keypress', (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        console.log("Enter key pressed, sending message...");
        sendMessage();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
  }

  // Add settings menu options
  const settingsMenu = document.querySelector('.settings-menu');
  settingsMenu.innerHTML += `
    <a href="#" onclick="setCustomInstruction()"><i class="fas fa-pencil-alt"></i> Set Custom Instruction</a>
    <a href="#" onclick="toggleTTS()"><i class="fas fa-volume-up"></i> Toggle Text-to-Speech</a>
  `;
});

let documentParagraphs = [];
let chatHistory = [];
let lastUserMessage = null;
let mathMode = false;
let customInstruction = "";
let ttsEnabled = false;

function loadChatHistory() {
  const chatbox = document.getElementById("chatbox");
  const savedHistory = localStorage.getItem("debootChatHistory");
  if (savedHistory) {
    chatbox.innerHTML = savedHistory;
    if (typeof Prism !== 'undefined') {
      document.querySelectorAll('#chatbox code[class^="language-"]').forEach(block => {
        Prism.highlightElement(block);
      });
    }
    console.log("Chat history loaded");
    if (window.MathJax) {
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, chatbox]);
    }
  } else {
    appendMessage("bot", "Greetings! I’m DEBoot, your professional AI assistant. How may I assist you today?");
  }
  chatHistory = JSON.parse(localStorage.getItem("debootChatContext")) || [];
  chatbox.scrollTop = chatbox.scrollHeight;
}

function saveChatHistory() {
  const chatbox = document.getElementById("chatbox");
  localStorage.setItem("debootChatHistory", chatbox.innerHTML);
  if (chatHistory.length > 100) {
    chatHistory = chatHistory.slice(-100);
  }
  localStorage.setItem("debootChatContext", JSON.stringify(chatHistory));
  console.log("Chat history saved");
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function removeMarkdown(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/^#+\s*(.*)/gm, '$1');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/^>\s*(.*)/gm, '$1');
  text = text.replace(/^\s*([-*_]){3,}\s*$/gm, '');
  return text;
}

function formatResponse(text) {
  text = text.replace(/\$\$(.*?)\$\$/g, '\\[$1\\]');
  text = text.replace(/\$(.*?)\$/g, '\\($1\\)');

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let html = '<div class="message-content">';
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const beforeText = text.slice(lastIndex, match.index).trim();
    if (beforeText) {
      const plainText = removeMarkdown(beforeText);
      html += `<p>${escapeHtml(plainText)}</p>`;
    }
    const lang = match[1] ? match[1].toLowerCase() : 'text';
    const code = match[2].trim();
    html += `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
    lastIndex = codeBlockRegex.lastIndex;
  }

  const remainingText = text.slice(lastIndex).trim();
  if (remainingText) {
    const plainText = removeMarkdown(remainingText);
    html += `<p>${escapeHtml(plainText)}</p>`;
  }

  html += '</div>';
  return html;
}

function appendMessage(sender, message, model = null, note = null) {
  const chatbox = document.getElementById("chatbox");
  if (!chatbox) return;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  if (note) {
    const noteSmall = document.createElement('small');
    noteSmall.className = 'note';
    noteSmall.textContent = note;
    messageDiv.appendChild(noteSmall);
  }
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'message-header';
  const avatarSpan = document.createElement('span');
  avatarSpan.className = 'avatar';
  avatarSpan.textContent = sender === 'user' ? 'U' : 'D';
  headerDiv.appendChild(avatarSpan);
  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'timestamp';
  timestampSpan.textContent = timestamp;
  headerDiv.appendChild(timestampSpan);
  messageDiv.appendChild(headerDiv);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  if (sender === 'bot' && typeof message === 'string') {
    contentDiv.innerHTML = formatResponse(message);
  } else {
    const p = document.createElement('p');
    p.textContent = message;
    contentDiv.appendChild(p);
  }
  messageDiv.appendChild(contentDiv);
  
  if (model) {
    const modelSmall = document.createElement('small');
    modelSmall.className = 'model-info';
    modelSmall.textContent = `Powered by ${model}`;
    messageDiv.appendChild(modelSmall);
  }
  
  chatbox.appendChild(messageDiv);
  
  if (typeof Prism !== 'undefined') {
    const codeBlocks = contentDiv.querySelectorAll('code[class^="language-"]');
    codeBlocks.forEach(block => Prism.highlightElement(block));
  }
  if (window.MathJax) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, contentDiv]);
  }
  
  chatbox.scrollTop = chatbox.scrollHeight;
  
  chatHistory.push({ sender, message, model, timestamp: new Date().toISOString() });
  saveChatHistory();

  // Text-to-Speech for bot messages
  if (sender === 'bot' && ttsEnabled) {
    const utterance = new SpeechSynthesisUtterance(contentDiv.textContent);
    speechSynthesis.speak(utterance);
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function getChatContext() {
  const recentHistory = chatHistory.slice(-15);
  return recentHistory.map(entry => {
    const prefix = entry.sender === "user" ? "You" : `DEBoot (${entry.model || "unknown"})`;
    return `${prefix}: ${entry.message}`;
  }).join("\n");
}

async function searchWeb(query) {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    const data = await response.json();
    let summary = "";
    if (data.AbstractText) {
      summary += `Abstract: ${data.AbstractText}\n`;
    }
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const related = data.RelatedTopics.slice(0, 3).map(topic => topic.Text).join('\n');
      summary += `Related Topics:\n${related}`;
    }
    return summary || "No relevant information found.";
  } catch (error) {
    console.error("Web Search Error:", error);
    return "Unable to fetch web data at this time.";
  }
}

async function sendMessageWithRetry(prompt, model, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting API call (try ${i + 1})...`);
      return await puter.ai.chat(prompt, { model, stream: true });
    } catch (error) {
      console.error(`Retry ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

function classifyQuery(query) {
  const lowerQuery = query.toLowerCase();
  if (/image|picture|photo|vision/.test(lowerQuery)) {
    return "image";
  } else if (/^(what is|define|who is|meaning of)/.test(lowerQuery)) {
    return "definition";
  } else if (/^(how to|how do i|steps to)/.test(lowerQuery)) {
    return "how-to";
  } else if (/^(why|explain|tell me about)/.test(lowerQuery)) {
    return "explanation";
  } else if (/^(opinion|what do you think|your view on)/.test(lowerQuery)) {
    return "opinion";
  } else if (/(calculate|solve|math|equation|formula)/.test(lowerQuery)) {
    return "math";
  } else if (/(generate|write|create).*code/.test(lowerQuery)) {
    return "code";
  } else if (/translate/.test(lowerQuery)) {
    return "translation";
  } else if (/summarize|summary/.test(lowerQuery)) {
    return "summarization";
  } else if (/write a (story|poem|article)/.test(lowerQuery)) {
    return "creative";
  } else if (/(what|when|where|who|how many|is it true)/.test(lowerQuery)) {
    return "factual";
  } else {
    return "general";
  }
}

function determineBestModel(query) {
  const queryType = classifyQuery(query);
  switch (queryType) {
    case "code":
      return "deepseek-chat";
    case "math":
      return "claude-3-7-sonnet";
    case "translation":
      return "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo";
    case "creative":
      return "gpt-4o";
    case "image":
      return "gpt-4o";
    default:
      return "claude-3-7-sonnet";
  }
}

function findRelevantParagraphs(query, paragraphs, maxParagraphs = 5, minWords = 2) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scores = paragraphs.map((p, index) => {
    const pLower = p.toLowerCase();
    const score = words.filter(word => pLower.includes(word)).length;
    return { index, score };
  });
  scores.sort((a, b) => b.score - a.score);
  return scores
    .filter(s => s.score >= minWords)
    .slice(0, maxParagraphs)
    .map(s => paragraphs[s.index])
    .filter(p => p.trim() !== '');
}

async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) {
    showNotification("No files selected.", "error");
    return;
  }

  const file = files[0];
  const fileName = file.name;
  const fileType = file.type;
  appendMessage("user", `Uploaded file: ${fileName}`);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    appendMessage("bot", "File is too large to process (max 10MB). Please upload a smaller file.");
    showNotification("File exceeds size limit.", "error");
    return;
  }

  try {
    if (fileType.startsWith("text") || fileType === "application/json") {
      const text = await file.text();
      documentParagraphs = text.split(/\n\n+/).filter(p => p.trim() !== '');
      if (documentParagraphs.length > 0) {
        const summaryText = documentParagraphs.slice(0, 5).join('\n\n');
        const summaryPrompt = `Please provide a professional summary of the following text content from "${fileName}":\n\n${summaryText}\n\nNote: This is only the beginning of the document. Use code blocks for code snippets only.`;
        appendMessage("bot", `Text file "${fileName}" uploaded and split into ${documentParagraphs.length} paragraphs. Generating summary...`);
        const model = document.getElementById("modelSelect").value;
        let resp = await sendMessageWithRetry(summaryPrompt, model);
        let fullResponse = "";
        const messageDiv = document.querySelector('#chatbox .message:last-child');
        for await (const part of resp) {
          if (part?.text) {
            fullResponse += part.text;
            messageDiv.innerHTML = formatResponse(fullResponse);
            if (typeof Prism !== 'undefined') {
              const codeBlocks = messageDiv.querySelectorAll('code[class^="language-"]');
              codeBlocks.forEach(block => Prism.highlightElement(block));
            }
            chatbox.scrollTop = chatbox.scrollHeight;
          }
        }
        chatHistory[chatHistory.length - 1].message = fullResponse;
        saveChatHistory();
      } else {
        appendMessage("bot", "The uploaded text file is empty.");
      }
    } else if (fileType === "application/pdf") {
      appendMessage("bot", "PDF file detected. Extracting text requires server-side processing, which I’ll simulate.");
      const text = await simulatePdfTextExtraction(file);
      await sendFileAnalysis(fileName, text);
    } else if (fileType.startsWith("image")) {
      const imageUrl = URL.createObjectURL(file);
      appendMessage("bot", `Image file detected. Displaying preview:\n<img src="${imageUrl}" alt="Uploaded Image" style="max-width: 300px;" />`);
      if (!puter.auth.isSignedIn()) {
        appendMessage("bot", "To analyze this image, please log in to your Puter account.");
        return;
      }
      const tempDir = '/deboot-temp';
      const uniqueFileName = `image-${Date.now()}.${fileType.split('/')[1]}`;
      const path = `${tempDir}/${uniqueFileName}`;
      await puter.fs.write(path, file);
      const shareInfo = await puter.fs.share(path);
      const imageUrlForAI = shareInfo.url;
      await sendFileAnalysis(fileName, null, imageUrlForAI);
      await puter.fs.delete(path);
    } else {
      appendMessage("bot", "Unsupported file type. Please upload text, PDF, or image files.");
    }
  } catch (error) {
    console.error("File processing error:", error);
    appendMessage("bot", `Error processing file: ${error.message}`);
    showNotification("Failed to process file.", "error");
  }
}

async function simulatePdfTextExtraction(file) {
  return new Promise((resolve) => {
    setTimeout(() => resolve("Simulated PDF content extracted."), 1000);
  });
}

async function sendFileAnalysis(fileName, textContent = null, imageUrl = null) {
  const modelSelect = document.getElementById("modelSelect");
  let model = modelSelect.value === "auto" ? determineBestModel(textContent || "image") : modelSelect.value;

  if (imageUrl) {
    model = "gpt-4o";
  }

  const context = getChatContext();
  let prompt;

  if (imageUrl) {
    prompt = `${context}\nYou: Analyze the image from file "${fileName}".\nDEBoot, please provide a professional analysis of this image.`;
  } else if (textContent) {
    prompt = `${context}\nYou: Analyze the following text file content from "${fileName}":\n\n${textContent}\n\nDEBoot, please provide a professional analysis of this text content. Use code blocks for code snippets only.`;
  } else {
    throw new Error("Either textContent or imageUrl must be provided.");
  }

  try {
    appendMessage("bot", "Analyzing file content...", model);
    let resp = imageUrl ? await puter.ai.chat(prompt, imageUrl, { model, stream: true }) : await sendMessageWithRetry(prompt, model);
    let fullResponse = "";
    const messageDiv = document.querySelector('#chatbox .message:last-child');
    for await (const part of resp) {
      if (part?.text) {
        fullResponse += part.text;
        messageDiv.innerHTML = formatResponse(fullResponse);
        if (typeof Prism !== 'undefined') {
          const codeBlocks = messageDiv.querySelectorAll('code[class^="language-"]');
          codeBlocks.forEach(block => Prism.highlightElement(block));
        }
        chatbox.scrollTop = chatbox.scrollHeight;
      }
    }
    chatHistory[chatHistory.length - 1].message = fullResponse;
    saveChatHistory();
  } catch (error) {
    console.error("File Analysis Error:", error);
    appendMessage("bot", `Error analyzing file: ${error.message || "An unexpected issue occurred."}`, model);
    showNotification("File analysis failed.", "error");
  }
}

async function sendMessage(message = null) {
  const inputElem = document.getElementById("userInput");
  const modelSelect = document.getElementById("modelSelect");
  const chatbox = document.getElementById("chatbox");
  if (!inputElem || !modelSelect) return;

  const userText = message || inputElem.value.trim();
  if (!userText) return;

  if (!message) {
    appendMessage("user", userText);
    inputElem.value = "";
    inputElem.style.height = 'auto';
  } else {
    appendMessage("user", userText, null, "Resent");
  }
  lastUserMessage = userText;

  let model = modelSelect.value;
  if (model === "auto") {
    model = determineBestModel(userText);
  }

  const context = getChatContext();
  const queryType = classifyQuery(userText);
  let instruction = "";
  switch (queryType) {
    case "definition": instruction = "Provide a concise definition."; break;
    case "how-to": instruction = "Explain the steps clearly and professionally."; break;
    case "explanation": instruction = "Provide a detailed explanation."; break;
    case "opinion": instruction = "Share your professional opinion."; break;
    case "math": instruction = "Provide a clear, readable solution using LaTeX formatting for math expressions."; break;
    default: instruction = "Respond in a professional tone with clear, concise answers.";
  }
  let prompt = `${context}\n${customInstruction ? `Custom Instruction: ${customInstruction}\n` : ''}You: ${userText}\nDEBoot, ${instruction} Use code blocks for code snippets only.`;
  if (mathMode) {
    prompt += "\nEnsure all mathematical expressions are formatted in LaTeX for readability.";
  }
  if (documentParagraphs.length > 0) {
    const relevantParagraphs = findRelevantParagraphs(userText, documentParagraphs);
    if (relevantParagraphs.length > 0) {
      prompt = `Based on the following document content:\n${relevantParagraphs.join('\n\n')}\n\n${prompt}`;
    }
  }

  const isCodeRequest = /html|code|generate.*(html|code|script)/i.test(userText);
  const requiresInternet = /search|latest|news|web|what's.*(happening|new)|current|today|now|recent/i.test(userText);

  const placeholderDiv = document.createElement('div');
  placeholderDiv.className = 'message bot placeholder';
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  for (let i = 0; i < 3; i++) {
    typingDiv.appendChild(document.createElement('span'));
  }
  placeholderDiv.appendChild(typingDiv);
  chatbox.appendChild(placeholderDiv);
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    if (requiresInternet) {
      const searchQuery = userText.replace(/search( for)?|latest|news|web|current|today|now|recent/i, "").trim();
      const webResult = await searchWeb(searchQuery);
      prompt += `\nWeb Info: ${webResult}`;
      appendMessage("bot", `Web Result:\n${webResult}`, model);
    }

    let resp = await sendMessageWithRetry(prompt, model);
    let fullResponse = "";
    let botMessageDiv = null;
    for await (const part of resp) {
      if (part?.text) {
        if (!botMessageDiv) {
          placeholderDiv.classList.remove('placeholder');
          placeholderDiv.innerHTML = `
            <div class="message-header">
              <span class="avatar">D</span>
              <span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="message-content"></div>
            <small class="model-info">Powered by ${model}</small>
          `;
          botMessageDiv = placeholderDiv.querySelector('.message-content');
        }
        fullResponse += part.text;
        botMessageDiv.innerHTML = isCodeRequest ? `<pre><code class="language-text">${escapeHtml(fullResponse)}</code></pre>` : formatResponse(fullResponse);
        if (typeof Prism !== 'undefined') {
          const codeBlocks = botMessageDiv.querySelectorAll('code[class^="language-"]');
          codeBlocks.forEach(block => Prism.highlightElement(block));
        }
        if (window.MathJax) {
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, botMessageDiv]);
        }
        chatbox.scrollTop = chatbox.scrollHeight;
      }
    }
    chatHistory[chatHistory.length - 1].message = fullResponse;
    saveChatHistory();
  } catch (error) {
    console.error("Chat Error:", error);
    placeholderDiv.innerHTML = `<p>Error: ${error.message || "An unexpected issue occurred."} Please try again.</p>`;
    showNotification("An error occurred.", "error");
  }
}

function resendLastMessage() {
  if (lastUserMessage) {
    sendMessage(lastUserMessage);
  } else {
    showNotification("No previous message to resend.", "error");
  }
}

function toggleTheme() {
  const currentTheme = document.body.className.replace('-theme', '');
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.body.className = newTheme + "-theme";
  localStorage.setItem("theme", newTheme);
  if (document.getElementById("themeSelect")) {
    document.getElementById("themeSelect").value = newTheme;
  }
  showNotification(`Theme updated to ${newTheme}.`, "success");
}

function changeTheme(theme) {
  document.body.className = theme + "-theme";
  localStorage.setItem("theme", theme);
  if (document.getElementById("themeSelect")) {
    document.getElementById("themeSelect").value = theme;
  }
  showNotification(`Theme updated to ${theme}.`, "success");
}

function toggleMathMode() {
  mathMode = !mathMode;
  const toggleBtn = document.getElementById("mathModeToggle");
  if (toggleBtn) {
    toggleBtn.classList.toggle("active", mathMode);
    showNotification(mathMode ? "Math mode enabled" : "Math mode disabled", "success");
  }
}

function clearChat() {
  if (confirm("Are you sure you want to clear the chat history?")) {
    const chatbox = document.getElementById("chatbox");
    chatbox.innerHTML = "";
    chatHistory = [];
    documentParagraphs = [];
    localStorage.clear();
    appendMessage("bot", "Chat history cleared. How may I assist you now?");
    showNotification("Chat cleared successfully.", "success");
  }
}

function exportChat() {
  const chatbox = document.getElementById("chatbox");
  const text = Array.from(chatbox.querySelectorAll('.message'))
    .map(msg => `${msg.classList.contains('user') ? 'You' : 'DEBoot'}: ${msg.textContent.trim()}`)
    .join('\n');
  navigator.clipboard.writeText(text)
    .then(() => showNotification("Chat copied to clipboard.", "success"))
    .catch(err => {
      console.error("Clipboard write failed:", err);
      showNotification("Failed to copy chat.", "error");
    });
}

function refreshChat() {
  location.reload();
  showNotification("Chat refreshed.", "success");
}

function searchChatHistory() {
  const query = prompt("Enter search term:");
  if (!query) return;
  const results = chatHistory.filter(entry => entry.message.toLowerCase().includes(query.toLowerCase()));
  if (results.length > 0) {
    const chatbox = document.getElementById("chatbox");
    chatbox.innerHTML = "";
    results.forEach(entry => appendMessage(entry.sender, entry.message, entry.model));
    showNotification(`Found ${results.length} matches.`, "success");
  } else {
    showNotification("No matches found.", "error");
  }
}

// Custom Instruction Setting
function setCustomInstruction() {
  const instruction = prompt("Enter custom instruction for DEBoot:");
  if (instruction) {
    customInstruction = instruction;
    showNotification("Custom instruction set.", "success");
  }
}

// Voice Input
const voiceInputBtn = document.getElementById("voiceInputBtn");
if (voiceInputBtn && 'webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  voiceInputBtn.addEventListener('click', () => {
    recognition.start();
    voiceInputBtn.classList.add('active');
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("userInput").value = transcript;
    voiceInputBtn.classList.remove('active');
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    showNotification("Voice input failed.", "error");
    voiceInputBtn.classList.remove('active');
  };

  recognition.onend = () => {
    voiceInputBtn.classList.remove('active');
  };
} else if (voiceInputBtn) {
  voiceInputBtn.style.display = 'none';
}

// Text-to-Speech Toggle
function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  showNotification(ttsEnabled ? "Text-to-Speech enabled" : "Text-to-Speech disabled", "success");
}

setInterval(saveChatHistory, 5000);