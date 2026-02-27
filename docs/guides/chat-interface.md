# Chat Interface

The Chat Interface lets you have real-time conversations with AI models. You can type messages, use voice input, and switch between multiple AI providers.

## Opening Chat

Click **Chat** in the sidebar or navigate to `/app/chat`.

## Sending a Message

1. Type your message in the text area at the bottom of the screen.
2. Press **Enter** or click the **Send** button.
3. The AI will respond in the chat window. Responses appear with a typing indicator while the model is thinking.

## Choosing an AI Model

On the right side of the chat screen, you will see a panel with available AI platforms organized into tabs:

- **Language** -- GPT-4, ChatGPT, Claude, DeepSeek, Gemini, Llama 3, Mistral, Perplexity, Grok, Cohere
- **Image** -- DALL-E, Midjourney, Stable Diffusion
- **Video** -- Sora, Runway, Pika
- **Browser** -- Chrome Automation, Edge Automation

Click on a model to select it. The active model is highlighted. Your messages will be routed to whichever model is currently selected.

**Tip:** You can only have one language model active at a time. Selecting a new one automatically deselects the previous one.

## Voice Input

Atlas UX supports speech-to-text for hands-free interaction:

1. Click the **microphone** button next to the text area.
2. Speak your message clearly.
3. Your speech will be transcribed into the text area.
4. Press Send (or let it auto-send, depending on your settings).

If your browser does not support speech recognition, the microphone button will be disabled.

### Voice Mode Options

- **Speech mode** -- Your voice input is transcribed and the AI response is also read aloud (text-to-speech).
- **Text mode** -- Your voice input is transcribed, but the AI response is displayed as text only.

Toggle between these modes using the voice mode switch in the chat settings.

## Auto-Play Responses

When enabled, AI responses are automatically read aloud using your browser's text-to-speech engine. You can toggle this with the **Auto-play responses** switch.

## Conversation History

All messages in your current session are displayed in the chat window with timestamps. Messages are labeled as either "You" (user) or the name of the AI model that responded.

**Note:** Conversation history is kept for the duration of your current session. If you refresh the page, the conversation resets.

## Keyboard Shortcuts

- **Enter** -- Send message
- **Shift + Enter** -- New line in the text area (does not send)

## Tips

- Be specific in your prompts for better results.
- You can ask agents to perform tasks like "draft a blog post about AI trends" or "write a marketing email for our new product."
- If a response seems incomplete, ask the agent to continue or elaborate.
- Try different models to compare response styles and quality.

## Related Guides

- [Agents Hub](./agents-hub.md) -- Learn about the agent roster and who does what
- [Job Runner](./job-runner.md) -- Agents can also create jobs that run in the background
