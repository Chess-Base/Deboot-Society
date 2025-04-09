# DEBoot - AI-Powered Chat Assistant

Welcome to **DEBoot**, an advanced AI-powered chatbot crafted by the DEBoot Society to deliver seamless, professional, and interactive conversations. Hosted live at [https://debootai.puter.site/](https://debootai.puter.site/), DEBoot combines cutting-edge AI technology with a privacy-first design, empowering users with real-time chat, file analysis, mathematical formatting, and more.

DEBoot is not just a chatbot—it’s a versatile tool designed to assist with everything from quick queries to in-depth document analysis, all wrapped in a sleek, dark-themed interface. Whether you’re a student, developer, or curious explorer, DEBoot is here to provide clear, concise, and professional responses.

---

## Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Installation](#installation)
- [Usage](#usage)
- [File Support](#file-support)
- [Privacy](#privacy)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

DEBoot offers a robust set of features to enhance your experience:

- **Real-Time Chat**: Engage in dynamic, context-aware conversations powered by advanced AI models.
- **File Upload & Analysis**: Process text files, PDFs, or images (up to 10MB) for summaries, analysis, or visual interpretation.
- **Math Mode**: Toggle LaTeX formatting for beautifully rendered mathematical expressions.
- **Multi-Model Support**: Select from models like OpenAI o3-mini, GPT-4o Search Preview, GPT-4.5 Preview, and Perplexity LLaMA 3.1 Sonar Small 128k Online.
- **Code Highlighting**: Automatically formats code snippets with Prism.js for languages like JavaScript, Python, HTML, and CSS.
- **Privacy First**: Stores chat history and preferences locally in your browser, ensuring your data remains private.
- **Responsive Design**: A modern, dark-themed UI that works seamlessly on desktop and mobile.
- **Particle Animations**: Subtle background effects for an engaging visual experience.
- **Chat Persistence**: Save and clear your chat history with ease.

---

## Live Demo

Experience DEBoot live at [https://debootai.puter.site/](https://debootai.puter.site/). Start a conversation, upload a file, or explore Math Mode to see its capabilities in action. The live site reflects the latest version of the project.

---

## Installation

Run DEBoot locally or contribute to its development with these steps:

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, etc.)
- [Node.js](https://nodejs.org/) (optional, for local server setup)
- Basic HTML, CSS, and JavaScript knowledge

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Chess-Base/Deboot-Society.git
   cd Deboot-Society
   ```

2. **Run Locally**:
   - Open `index.html` in your browser to view the landing page, or `chat.html` to start chatting.
   - Note: Some features (e.g., file uploads) may require a server for full functionality.

3. **Set Up a Local Server** (Optional):
   - Install `live-server`:
     ```bash
     npm install -g live-server
     live-server
     ```
   - Access it at `http://localhost:8080`.

4. **Dependencies**:
   - All external libraries (Font Awesome, Prism.js, MathJax) are loaded via CDNs in the HTML files—no additional setup needed unless modified.

5. **API Integration**:
   - DEBoot uses Puter.js for AI functionality. Ensure API access or replace it with your preferred service in `script.js`.

---

## Usage

1. **Start Chatting**:
   - Visit `chat.html` or the live demo.
   - Type a message in the input area and click "Send" or press Enter.
   - Choose an AI model from the dropdown menu.

2. **Upload Files**:
   - Click the paperclip icon to upload text files, PDFs, or images.
   - DEBoot will analyze and provide insights or summaries.

3. **Enable Math Mode**:
   - Toggle the "Math Mode" button for LaTeX-formatted math responses.
   - Example: Ask "Solve x^2 + 2x + 1 = 0" for a formatted solution.

4. **Clear Chat**:
   - Use the "Clear Chat" sidebar option to reset your history.

---

## File Support

DEBoot handles:
- **Text Files** (`.txt`, `.json`): Split into paragraphs for analysis or summarization.
- **PDFs** (`.pdf`): Simulated text extraction (full support requires server-side processing).
- **Images** (`.jpg`, `.jpeg`, `.png`): Previewed and analyzed with AI vision.
- **Max Size**: 10MB per file.

Unsupported files trigger an error message.

---

## Privacy

We prioritize your privacy:
- **Local Storage**: Chat history and settings are saved in your browser’s `localStorage`.
- **File Processing**: Uploaded files are processed in-memory and discarded unless saved in chat history.
- **No Third-Party Sharing**: Your data isn’t sold or shared for marketing.
- **Third-Party Services**: Uses Puter.js—review their [privacy policy](https://puter.com/privacy).

Details in our [Privacy Policy](https://debootai.puter.site/privacy.html).

---

## Technologies

DEBoot is built with:
- **HTML5**: Semantic structure.
- **CSS3**: Custom dark-theme styling and responsiveness.
- **JavaScript**: Core functionality and event handling.
- **Puter.js**: AI chat and file analysis.
- **Prism.js**: Code syntax highlighting.
- **MathJax**: LaTeX rendering for math.
- **Font Awesome**: UI icons.
- **Cloudflare**: Security and optimization.

---

## Contributing

Join us in improving DEBoot:

1. **Fork the Repository**:
   - Fork at [Chess-Base/Deboot-Society](https://github.com/Chess-Base/Deboot-Society) and clone locally.

2. **Make Changes**:
   - Create a branch:
     ```bash
     git checkout -b feature/your-feature-name
     ```

3. **Submit a Pull Request**:
   - Push changes and open a PR with a clear description.

4. **Guidelines**:
   - Match the existing code style.
   - Test locally before submitting.
   - Uphold the privacy-first ethos.

---

## License

DEBoot is under the [MIT License](LICENSE). Use, modify, and distribute it freely with the original copyright notice.

© 2025 DEBoot Society. All rights reserved.

---

## Contact

Questions or ideas? Contact us:
- **Email**: [redythacker@gmail.com](mailto:redythacker@gmail.com)
- **GitHub Issues**: File an issue at [Chess-Base/Deboot-Society](https://github.com/Chess-Base/Deboot-Society).

Check out the live site at [https://debootai.puter.site/](https://debootai.puter.site/). Star this repo if you find it useful!
