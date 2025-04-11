document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded, initializing DEBoot...");
  document.body.className = "dark-theme";
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

  if (!sidebar || !toggleBtn || !pageContainer) {
    console.error("Sidebar, toggle button, or page container not found!");
    return;
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('closed');
    pageContainer.classList.toggle('full-width');
    console.log("Sidebar toggled");
  });

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
    link.addEventListener('click', (e) => {
      if (link.getAttribute('href') === "javascript:void(0)") {
        e.preventDefault();
      }
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebar.classList.add('closed');
        pageContainer.classList.add('full-width');
      }
    });
  });

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
});

let documentParagraphs = [];
let chatHistory = [];
let mathMode = false;
let pendingFiles = [];

function loadChatHistory() {
  const chatbox = document.getElementById("chatbox");
  if (!chatbox) return;
  const savedHistory = localStorage.getItem("debootChatHistory");
  if (savedHistory) {
    chatbox.innerHTML = savedHistory;
    if (typeof Prism !== 'undefined') {
      document.querySelectorAll('#chatbox code[class^="language-"]').forEach(block => {
        Prism.highlightElement(block);
      });
    } else {
      console.warn("Prism.js not loaded!");
    }
    console.log("Chat history loaded");
    if (window.MathJax) {
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, chatbox]);
    } else {
      console.warn("MathJax not loaded!");
    }
  } else {
    appendMessage("bot", "Greetings! I’m DEBoot, your AI assistant.");
  }
  chatHistory = JSON.parse(localStorage.getItem("debootChatContext")) || [];
  chatbox.scrollTop = chatbox.scrollHeight;
}

function saveChatHistory() {
  const chatbox = document.getElementById("chatbox");
  if (!chatbox) return;
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
  text = text.replace(/$$ (.*?) $$$$ .*? $$/g, '$1');
  text = text.replace(/!$$ .*? $$$$ .*? $$/g, '');
  text = text.replace(/^>\s*(.*)/gm, '$1');
  text = text.replace(/^\s*([-*_]){3,}\s*$/gm, '');
  return text;
}

function formatResponse(text, isCodeContent = false, codeLanguage = 'text') {
  // Replace LaTeX delimiters for MathJax
  text = text.replace(/\$\$(.*?)\$\$/g, '\$$ $1\ $$');
  text = text.replace(/\$(.*?)\$/g, '\$$ $1\ $$');

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let html = '<div class="message-content">';
  let lastIndex = 0;
  let match;

  // Process explicit code blocks
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const beforeText = text.slice(lastIndex, match.index).trim();
    if (beforeText) {
      html += formatTextAsList(beforeText);
    }
    const lang = match[1] ? match[1].toLowerCase() : 'text';
    const code = match[2].trim();
    html += `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
    lastIndex = codeBlockRegex.lastIndex;
  }

  // Handle remaining text
  const remainingText = text.slice(lastIndex).trim();
  if (remainingText) {
    if (isCodeContent) {
      // If the content is from a code file, wrap it in a code block
      html += `<pre><code class="language-${codeLanguage}">${escapeHtml(remainingText)}</code></pre>`;
    } else {
      html += formatTextAsList(remainingText);
    }
  }

  html += '</div>';
  return html;
}

function formatTextAsList(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim() !== '');
  let html = '';

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').filter(line => line.trim() !== '');
    const isNumberedList = lines.every(line => /^\d+\.\s/.test(line.trim()));
    const isBulletedList = lines.every(line => /^[-*]\s/.test(line.trim()));

    if (isNumberedList) {
      html += '<ol>';
      for (const line of lines) {
        const cleanLine = line.replace(/^\d+\.\s/, '').trim();
        html += `<li>${escapeHtml(removeMarkdown(cleanLine))}</li>`;
      }
      html += '</ol>';
    } else if (isBulletedList) {
      html += '<ul>';
      for (const line of lines) {
        const cleanLine = line.replace(/^[-*]\s/, '').trim();
        html += `<li>${escapeHtml(removeMarkdown(cleanLine))}</li>`;
      }
      html += '</ul>';
    } else {
      const cleanText = removeMarkdown(paragraph.trim());
      html += `<p>${escapeHtml(cleanText)}</p>`;
    }
  }

  return html;
}

function appendMessage(sender, message, model = null, note = null, isCodeContent = false, codeLanguage = 'text') {
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
    contentDiv.innerHTML = formatResponse(message, isCodeContent, codeLanguage);
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
}

function appendPendingFile(file, fileUrl = null) {
  const chatbox = document.getElementById("chatbox");
  if (!chatbox) return;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user pending';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'message-header';
  const avatarSpan = document.createElement('span');
  avatarSpan.className = 'avatar';
  avatarSpan.textContent = 'U';
  headerDiv.appendChild(avatarSpan);
  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'timestamp';
  timestampSpan.textContent = timestamp;
  headerDiv.appendChild(timestampSpan);
  messageDiv.appendChild(headerDiv);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  const fileInfo = document.createElement('p');
  fileInfo.textContent = `Pending file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
  contentDiv.appendChild(fileInfo);

  if (file.type.startsWith('image') && fileUrl) {
    const img = document.createElement('img');
    img.src = fileUrl;
    img.alt = `Preview of ${file.name}`;
    img.style.maxWidth = '200px';
    contentDiv.appendChild(img);
  }

  const cancelButton = document.createElement('button');
  cancelButton.className = 'cancel-pending';
  cancelButton.textContent = 'Cancel';
  cancelButton.onclick = () => {
    pendingFiles = pendingFiles.filter(f => f !== file);
    messageDiv.remove();
    showNotification(`File ${file.name} removed.`, 'success');
  };
  contentDiv.appendChild(cancelButton);

  messageDiv.appendChild(contentDiv);
  chatbox.appendChild(messageDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
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

async function sendMessageWithRetry(prompt, model, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting API call (try ${i + 1}) with model ${model}...`);
      if (typeof puter === 'undefined' || !puter.ai || !puter.ai.chat) {
        throw new Error("Puter.ai library not loaded or unavailable!");
      }
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
  if (/image|picture|photo|vision/.test(lowerQuery)) return "image";
  if (/^(what is|define|who is|meaning of)/.test(lowerQuery)) return "definition";
  if (/^(how to|how do i|steps to)/.test(lowerQuery)) return "how-to";
  if (/^(why|explain|tell me about)/.test(lowerQuery)) return "explanation";
  if (/^(opinion|what do you think|your view on)/.test(lowerQuery)) return "opinion";
  if (/(calculate|solve|math|equation|formula)/.test(lowerQuery)) return "math";
  if (/(generate|write|create).*code/.test(lowerQuery)) return "code";
  if (/translate/.test(lowerQuery)) return "translation";
  if (/summarize|summary/.test(lowerQuery)) return "summarization";
  if (/write a (story|poem|article)/.test(lowerQuery)) return "creative";
  if (/(what|when|where|who|how many|is it true)/.test(lowerQuery)) return "factual";
  return "general";
}

async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) {
    showNotification("No files selected.", "error");
    return;
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > MAX_FILE_SIZE) {
      showNotification(`File ${file.name} is too large (max 10MB).`, "error");
      continue;
    }
    pendingFiles.push(file);
    const fileUrl = file.type.startsWith('image') ? URL.createObjectURL(file) : null;
    appendPendingFile(file, fileUrl);
    showNotification(`File ${file.name} uploaded and pending prompt.`, "success");
  }
}

async function simulatePdfTextExtraction(file) {
  return new Promise((resolve) => {
    setTimeout(() => resolve("Simulated PDF content extracted."), 1000);
  });
}

async function processFileContent(file) {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  // Define code-related file extensions
  const codeExtensions = {
    '.py': 'python',
    '.js': 'javascript',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.ts': 'typescript',
    '.sql': 'sql',
    '.sh': 'bash'
  };
  const isCodeFile = Object.keys(codeExtensions).some(ext => fileName.endsWith(ext));
  const codeLanguage = isCodeFile ? codeExtensions[Object.keys(codeExtensions).find(ext => fileName.endsWith(ext))] : 'text';

  try {
    if (fileType.startsWith("text") || fileType === "application/json") {
      const text = await file.text();
      return { type: 'text', content: text, isCode: isCodeFile, language: codeLanguage };
    } else if (fileType === "application/pdf") {
      const text = await simulatePdfTextExtraction(file);
      return { type: 'pdf', content: text, isCode: false, language: 'text' };
    } else if (fileType.startsWith("image")) {
      const imageUrl = URL.createObjectURL(file);
      return { type: 'image', content: imageUrl, isCode: false, language: 'text' };
    } else {
      throw new Error("Unsupported file type.");
    }
  } catch (error) {
    console.error("File processing error:", error);
    throw error;
  }
}

async function sendMessage() {
  const inputElem = document.getElementById("userInput");
  const modelSelect = document.getElementById("modelSelect");
  const chatbox = document.getElementById("chatbox");
  if (!inputElem || !modelSelect || !chatbox) {
    console.error("Required elements missing: input, model select, or chatbox!");
    return;
  }

  const userText = inputElem.value.trim();
  if (!userText && pendingFiles.length === 0) return;

  if (userText) {
    appendMessage("user", userText);
  }
  inputElem.value = "";
  inputElem.style.height = 'auto';

  let model = modelSelect.value;
  let prompt = getChatContext();

  // Handle pending files
  let fileContents = [];
  if (pendingFiles.length > 0) {
    for (const file of pendingFiles) {
      try {
        const fileContent = await processFileContent(file);
        fileContents.push({ fileName: file.name, ...fileContent });
      } catch (error) {
        appendMessage("bot", `Error processing file ${file.name}: ${error.message}`);
        showNotification(`Failed to process ${file.name}.`, "error");
      }
    }
    // Remove pending file messages from chatbox
    document.querySelectorAll('.message.pending').forEach(div => div.remove());
  }

  // Build the prompt
  if (fileContents.length > 0) {
    prompt += "\nYou uploaded the following files:\n";
    for (const fc of fileContents) {
      if (fc.type === 'image') {
        prompt += `- ${fc.fileName} (image): [Image data provided separately]\n`;
      } else {
        const contentPrefix = fc.isCode ? `\`\`\`${fc.language}\n` : '';
        const contentSuffix = fc.isCode ? '\n```' : '';
        prompt += `- ${fc.fileName} (${fc.type}${fc.isCode ? ', code' : ''}):\n${contentPrefix}${fc.content}${contentSuffix}\n\n`;
      }
    }
  }
  if (userText) {
    prompt += `\nYou: ${userText}`;
  }
  prompt += `\nDEBoot, respond in a professional tone with clear, concise answers. For code-related content, always use appropriate code blocks (e.g., \`\`\`python for Python code).`;
  if (mathMode) {
    prompt += "\nEnsure all mathematical expressions are formatted in LaTeX for readability.";
  }
  if (documentParagraphs.length > 0) {
    const relevantParagraphs = findRelevantParagraphs(userText || '', documentParagraphs);
    if (relevantParagraphs.length > 0) {
      prompt = `Based on the following document content:\n${relevantParagraphs.join('\n\n')}\n\n${prompt}`;
    }
  }

  const isCodeRequest = userText && /html|code|generate.*(html|code|script)/i.test(userText);
  const isCodeResponse = fileContents.some(fc => fc.isCode);

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
    let resp;
    if (fileContents.some(fc => fc.type === 'image')) {
      const imageUrls = fileContents.filter(fc => fc.type === 'image').map(fc => fc.content);
      resp = await puter.ai.chat(prompt, imageUrls.length > 0 ? imageUrls : null, { model, stream: true });
    } else {
      resp = await sendMessageWithRetry(prompt, model);
    }
    let fullResponse = "";
    let botMessageDiv = null;
    let codeLanguage = isCodeResponse ? fileContents.find(fc => fc.isCode)?.language || 'text' : 'text';
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
        botMessageDiv.innerHTML = isCodeRequest || isCodeResponse ? formatResponse(fullResponse, true, codeLanguage) : formatResponse(fullResponse);
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
    pendingFiles = [];
  } catch (error) {
    console.error("Chat Error:", error);
    placeholderDiv.innerHTML = `<p>Error: ${error.message || "An unexpected issue occurred."} Please try again.</p>`;
    showNotification("An error occurred.", "error");
  }
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
  const chatbox = document.getElementById("chatbox");
  if (!chatbox) {
    console.log("No chatbox available to clear on this page.");
    return;
  }
  if (confirm("Are you sure you want to clear the chat history?")) {
    chatbox.innerHTML = "";
    chatHistory = [];
    documentParagraphs = [];
    pendingFiles = [];
    localStorage.removeItem("debootChatHistory");
    localStorage.removeItem("debootChatContext");
    appendMessage("bot", "Chat history cleared. How may I assist you now?");
    showNotification("Chat cleared successfully.", "success");
    console.log("Chat history cleared");
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

setInterval(saveChatHistory, 5000);

window.clearChat = clearChat;
