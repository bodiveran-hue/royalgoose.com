# Copilot coding agent — Royal Goose

This is a Node/Express production app (`npm start`), not GitHub Pages.

- Production LLM: ChatGPT (`OPENAI_API_KEY`, default model `gpt-4o-mini`).
- ChatBotAI (`https://chatbotai.com`) is the in-app chatbot. Browser talks only to `POST /api/chat`. Keep `CHATBOTAI_API_KEY` and `OPENAI_API_KEY` on the server.
- Fallback order: ChatBotAI → OpenAI → Anthropic → DeepSeek → labeled local engine.
- Do not add GitHub Pages deploy jobs. Railway deploys the Node server.
- Do not commit `.env` or secrets.
