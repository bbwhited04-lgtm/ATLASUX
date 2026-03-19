# Voice & Audio API Pricing Comparison

## The Cost of AI Voice

Voice AI has become a core capability for customer-facing applications. From text-to-speech (TTS) for automated responses to speech-to-text (STT) for transcription, and now conversational AI for fully autonomous phone agents, the pricing landscape spans several orders of magnitude. For Atlas UX, where Lucy handles inbound calls 24/7, understanding voice API costs is directly tied to unit economics.

This guide covers both traditional TTS/STT APIs and the newer conversational AI platforms that power autonomous phone agents.

## Text-to-Speech (TTS) Pricing

### ElevenLabs

ElevenLabs is the quality leader in AI voice synthesis, offering the most natural-sounding voices available:

| Plan | Monthly Price | Characters | Effective Cost per 1K chars |
|------|--------------|------------|---------------------------|
| Free | $0 | 10,000 | $0.00 |
| Starter | $5 | 30,000 | $0.17 |
| Creator | $22 | 100,000 | $0.22 |
| Pro | $99 | 500,000 | $0.20 |
| Scale | $330 | 2,000,000 | $0.17 |
| Enterprise | Custom | Custom | ~$0.10-0.15 |

ElevenLabs also offers pay-as-you-go at approximately $0.30 per 1,000 characters. Voice cloning is available on Creator+ plans. Their Turbo v2.5 model reduces latency to ~300ms for real-time applications.

### OpenAI TTS

| Model | Cost per 1M Characters |
|-------|----------------------|
| tts-1 (standard) | $15.00 |
| tts-1-hd (high quality) | $30.00 |

OpenAI TTS is straightforward: no subscriptions, pure pay-per-use. At $0.015 per 1K characters (standard), it is significantly cheaper than ElevenLabs for raw TTS. Six built-in voices are available. Quality is good but does not match ElevenLabs' naturalness, particularly for conversational use cases.

### Google Cloud Text-to-Speech

| Voice Type | Cost per 1M Characters |
|-----------|----------------------|
| Standard | $4.00 |
| WaveNet | $16.00 |
| Neural2 | $16.00 |
| Studio | $160.00 |
| Journey (conversational) | $16.00 |

Google offers the widest language support (220+ voices, 40+ languages). WaveNet voices are the sweet spot for quality versus cost. First 1M characters/month on Standard and first 500K on WaveNet/Neural2 are free.

### Amazon Polly

| Voice Type | Cost per 1M Characters |
|-----------|----------------------|
| Standard | $4.00 |
| Neural | $16.00 |
| Long-Form | $100.00 |
| Generative | $30.00 |

Polly is competitively priced and deeply integrated with AWS. Neural voices are the quality tier most applications should use. Generous free tier: 5M standard or 1M neural characters per month for 12 months.

### Azure Cognitive Services Speech

| Voice Type | Cost per 1M Characters |
|-----------|----------------------|
| Neural (standard) | $16.00 |
| Neural (HD) | $24.00 |
| Personal Voice | $24.00 |

Azure offers strong multilingual support and custom voice training. Pricing is competitive with Google and Amazon at the neural tier.

## Speech-to-Text (STT) Pricing

### OpenAI Whisper

| Model | Cost per Minute |
|-------|----------------|
| whisper-1 | $0.006 |

Whisper is remarkably cheap and accurate. At less than a penny per minute, it is the default choice for most transcription needs. Supports 57 languages with automatic detection.

### Google Cloud Speech-to-Text

| Model | Cost per Minute |
|-------|----------------|
| Standard (< 60 min) | $0.024 |
| Enhanced (phone/video models) | $0.036 |
| Chirp (Universal) | $0.016 |
| Medical transcription | $0.078 |

Google's pricing is per 15-second increment. First 60 minutes per month are free. Chirp offers the best accuracy-to-price ratio.

### Amazon Transcribe

| Usage Tier | Cost per Minute |
|-----------|----------------|
| Standard | $0.024 |
| With PII redaction | $0.030 |
| Call analytics | $0.030 |

AWS Transcribe includes useful enterprise features like PII redaction and call analytics at modest premiums. Free tier: 60 minutes per month for 12 months.

### AssemblyAI

| Tier | Cost per Hour |
|------|-------------|
| Best (Conformer-2) | $0.65 |
| Nano (speed-optimized) | $0.20 |

AssemblyAI charges per hour of audio. At $0.65/hour ($0.011/min), their best model is competitive with Whisper while offering additional features: speaker diarization, sentiment analysis, entity detection, content moderation, and summarization.

### Deepgram

| Model | Cost per Minute |
|-------|----------------|
| Nova-2 (general) | $0.0043 |
| Nova-2 (phone calls) | $0.0048 |
| Whisper Cloud | $0.0048 |
| Enhanced | $0.0145 |

Deepgram is consistently the cheapest STT option with strong accuracy. Nova-2 at $0.0043/min is 30% cheaper than OpenAI Whisper and competitive on quality. Their streaming API enables real-time transcription with sub-300ms latency.

## Conversational AI Platforms

The newest category combines TTS, STT, LLM reasoning, and telephony into unified conversational AI agents. These platforms power autonomous phone calls.

### ElevenLabs Conversational AI

ElevenLabs prices their conversational AI based on the plan:

| Component | Pricing |
|-----------|---------|
| Per-minute overage | ~$0.08-0.12/min |
| Included in Pro ($99/mo) | Platform access + voice credits |
| LLM costs | Passed through (uses your API key) |
| Telephony | Additional (via Twilio or built-in) |

ElevenLabs Conversational AI provides the infrastructure for real-time voice conversations. The platform handles voice synthesis, turn-taking, and interruption detection. LLM costs are separate — you bring your own model. Atlas UX uses this platform for Lucy's voice agent.

### Bland.ai

| Plan | Cost per Minute |
|------|----------------|
| Enterprise | ~$0.07-0.09/min (all-inclusive) |
| Pay-as-you-go | ~$0.12/min |

Bland bundles everything — STT, LLM, TTS, and telephony — into a single per-minute rate. This simplifies budgeting but limits model choice. Quality is optimized for business phone calls.

### Vapi

| Component | Cost |
|-----------|------|
| Platform fee | $0.05/min |
| STT | $0.01-0.02/min (Deepgram/Whisper) |
| LLM | Varies (your key) |
| TTS | $0.01-0.08/min (various) |
| Telephony | ~$0.01/min |
| **Total typical** | **$0.08-0.15/min** |

Vapi is a developer-friendly platform with modular pricing. You choose your STT, LLM, and TTS providers. The platform fee covers orchestration, turn-taking, and function calling.

### Retell AI

| Plan | Included Minutes | Cost per Minute (overage) |
|------|-----------------|--------------------------|
| Free | 60 | N/A |
| Starter | 500 | $0.08 |
| Pro | 2,000 | $0.07 |
| Enterprise | Custom | ~$0.05 |

Retell bundles STT, LLM orchestration, and TTS. LLM costs are passed through. Their focus on low latency makes them competitive for real-time phone conversations.

## Lucy-Scale Cost Analysis

For Atlas UX's Lucy AI receptionist handling approximately 1,000 calls per month with an average call duration of 3 minutes:

**Total minutes: 3,000 minutes/month**

| Platform | Estimated Monthly Cost |
|----------|----------------------|
| ElevenLabs Conversational AI + GPT-4o-mini | ~$300-400 |
| Bland.ai (all-inclusive) | ~$210-270 |
| Vapi + Deepgram + GPT-4o-mini + ElevenLabs TTS | ~$350-450 |
| Retell Pro + GPT-4o-mini | ~$210-280 |

Cost breakdown for the ElevenLabs + GPT-4o-mini stack (Atlas UX's approach):
- STT (transcription): ~$13-20/mo (Whisper or Deepgram)
- LLM (reasoning): ~$30-60/mo (GPT-4o-mini, ~2K tokens per turn, ~10 turns per call)
- TTS (voice synthesis): ~$100-150/mo (ElevenLabs)
- Telephony (Twilio): ~$60-90/mo (inbound minutes + phone number)
- Platform orchestration: ~$100-150/mo
- **Total: ~$300-470/mo**

At Lucy's $99/mo price point per tenant, break-even requires either lower call volumes per tenant or cost optimization through model routing and caching.

## Key Takeaways

1. **Cheapest STT**: Deepgram Nova-2 at $0.0043/min — cheaper than Whisper with competitive quality.
2. **Cheapest TTS**: OpenAI tts-1 at $0.015/1K characters — good quality, no subscription required.
3. **Best TTS quality**: ElevenLabs — audibly superior for conversational and character voices.
4. **All-inclusive conversational AI**: Bland.ai at ~$0.07-0.09/min is the simplest to budget.
5. **Most flexible conversational AI**: Vapi — mix and match STT/LLM/TTS providers.
6. **Voice is expensive relative to text** — a single 3-minute phone call costs roughly as much as 100 LLM chat completions.

## Resources

- https://elevenlabs.io/pricing — ElevenLabs pricing for TTS and Conversational AI
- https://openai.com/api/pricing/ — OpenAI TTS and Whisper pricing
- https://deepgram.com/pricing — Deepgram STT pricing and plans

## Image References

1. "Voice AI API pricing comparison chart TTS STT providers" — search: `voice ai api pricing comparison chart tts stt`
2. "Conversational AI platform architecture diagram voice agent" — search: `conversational ai platform architecture voice agent diagram`
3. "Text to speech quality comparison waveform visualization" — search: `tts quality comparison waveform ai voices`
4. "AI phone agent call flow diagram with STT LLM TTS" — search: `ai phone agent call flow stt llm tts diagram`
5. "Voice API cost per minute comparison bar chart" — search: `voice api cost per minute comparison chart`

## Video References

1. https://www.youtube.com/watch?v=p_OnyFiKZBk — "Building AI Voice Agents: Complete Guide to Costs and Architecture" by Greg Isenberg
2. https://www.youtube.com/watch?v=rNh1jLMwGgc — "ElevenLabs Conversational AI: Build Your Own AI Phone Agent" by All About AI
