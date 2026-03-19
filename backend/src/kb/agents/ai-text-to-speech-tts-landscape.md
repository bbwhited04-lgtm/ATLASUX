# Text-to-Speech: From Concatenative Synthesis to Neural Voice Generation

Text-to-speech (TTS) technology converts written text into spoken audio. Over the past decade, TTS has undergone a revolution — from robotic, mechanical-sounding output to voices so natural that listeners cannot distinguish them from human recordings. This transformation, driven by deep learning, is what makes it possible for Lucy to speak to callers with a warm, professional, human-sounding voice. This article covers the full arc of TTS development and explains how modern neural synthesis powers Atlas UX's voice capabilities.

## Concatenative Synthesis: Stitching Together Recordings

The first widely deployed TTS approach was concatenative synthesis, which works by recording a human speaker saying thousands of short speech units (diphones, triphones, or longer phrases) and stitching them together at runtime to produce novel utterances.

**Unit selection synthesis**, the most successful variant, maintains a large database of recorded speech segments tagged with linguistic features (phoneme identity, pitch, duration, position in sentence). When generating speech, the system searches for the sequence of units that best matches the target text while minimizing audible discontinuities at unit boundaries.

AT&T's Natural Voices and Nuance's Vocalizer were commercial systems built on this approach. At their best, they sounded impressively natural — because they were using actual human recordings. But quality was inconsistent. Some sentences sounded nearly human while others had audible glitches, unnatural pitch jumps, or robotic artifacts at concatenation points. The systems required 10-40 hours of professional studio recordings for each voice, making them expensive to create and impossible to customize.

## Parametric Synthesis: Generating Speech from Models

Parametric synthesis replaced the recording database with a statistical model that generates speech parameters (fundamental frequency, spectral envelope, duration) from text. HMM-based parametric synthesis, dominant in the 2000s, used Hidden Markov Models to predict acoustic features from linguistic features derived from the input text.

The pipeline typically had three stages. A **text analysis** module converted text to a linguistic representation (phonemes, stress patterns, phrase boundaries). An **acoustic model** predicted acoustic parameters frame-by-frame from the linguistic features. A **vocoder** synthesized the audio waveform from the predicted acoustic parameters.

Parametric systems were more flexible than concatenative ones — voices could be adapted or interpolated, and they required less storage. However, they sounded distinctly robotic. The vocoder introduced artifacts, and the statistical averaging inherent in HMM training smoothed out the natural variation that makes human speech sound alive. Parametric voices were intelligible but clearly artificial.

## WaveNet: The Neural Breakthrough (2016)

DeepMind's WaveNet, published in September 2016, was the watershed moment for neural TTS. WaveNet is an autoregressive model that generates raw audio waveforms one sample at a time — at 16,000 or 24,000 samples per second. At each step, it predicts the probability distribution of the next audio sample conditioned on all previous samples.

WaveNet uses dilated causal convolutions to achieve a large receptive field while maintaining tractable computation. Dilated convolutions skip over input values with increasing gaps at each layer, allowing the network to see hundreds of milliseconds of context without requiring hundreds of layers.

The results were transformative. In listening tests, WaveNet voices achieved Mean Opinion Scores (MOS) of 4.21 for English (on a 1-5 scale), compared to 4.55 for natural speech and 3.86 for the best concatenative system. For the first time, a fully synthetic voice approached human quality.

The original WaveNet was too slow for real-time use — generating one second of audio took minutes. Subsequent work on Parallel WaveNet (2017) and WaveRNN (2018) addressed this, achieving real-time or faster generation speeds while maintaining quality.

## Tacotron: End-to-End Text to Spectrogram

While WaveNet could generate high-quality audio, it still required hand-crafted linguistic features as input. Google's Tacotron (Wang et al., 2017) and Tacotron 2 (Shen et al., 2018) closed this gap by learning to convert text directly to mel spectrograms using a sequence-to-sequence model with attention.

Tacotron 2's architecture consists of a text encoder (character or phoneme embeddings processed by convolutional layers and a bidirectional LSTM), an attention mechanism (location-sensitive attention that tracks which part of the input has been consumed), and a decoder (autoregressive LSTM that predicts mel spectrogram frames). The predicted mel spectrogram is then converted to audio by a neural vocoder (originally WaveNet, later WaveGlow or HiFi-GAN).

The Tacotron 2 + WaveNet pipeline achieved MOS scores of 4.53 — statistically indistinguishable from natural speech in some evaluations. This was a landmark: fully synthetic speech that human listeners could not reliably distinguish from recordings.

## Modern Neural TTS: VITS, VALL-E, and Beyond

Research has continued to push TTS quality, speed, and flexibility:

**VITS** (Variational Inference with adversarial learning for end-to-end Text-to-Speech), published by Kim et al. in 2021, combines a variational autoencoder, normalizing flows, and adversarial training in a single end-to-end model. VITS generates waveforms directly from text without a separate vocoder, achieving both high quality and fast inference. It supports multi-speaker synthesis through speaker embeddings.

**VALL-E** (Wang et al., 2023, Microsoft) reconceptualized TTS as a language modeling problem. Instead of predicting mel spectrograms or waveforms, VALL-E predicts discrete audio codec tokens (from Meta's EnCodec). Given a 3-second audio sample of a speaker and a text prompt, VALL-E generates speech in that speaker's voice — a form of zero-shot voice cloning. The model is trained on 60,000 hours of English speech, orders of magnitude more than previous TTS systems.

**Bark** (Suno AI), **Tortoise-TTS** (James Betker), and **StyleTTS 2** have further advanced open-source neural TTS, offering near-commercial quality with manageable compute requirements.

## Quality Metrics: Measuring Voice Naturalness

The standard metric for TTS quality is the **Mean Opinion Score (MOS)**, where human listeners rate speech samples on a 1-5 scale (1 = bad, 5 = excellent). Natural human speech typically scores 4.5-4.8 depending on recording conditions. Modern neural TTS systems regularly achieve MOS scores above 4.0, with the best systems reaching 4.5+.

Other metrics include **word error rate** (measuring intelligibility), **speaker similarity** (how closely synthesized speech matches a target speaker), **prosody naturalness** (whether intonation, rhythm, and stress sound natural), and **MUSHRA** (Multiple Stimuli with Hidden Reference and Anchor, used for comparative evaluation).

Objective metrics like Frechet Audio Distance (FAD) and PESQ (Perceptual Evaluation of Speech Quality) attempt to automate quality assessment, but MOS remains the gold standard because speech quality is ultimately a perceptual judgment.

## ElevenLabs: Commercial Neural TTS

ElevenLabs has emerged as a leading commercial TTS provider by combining high-quality neural synthesis with an accessible API and rapid voice cloning capabilities. Their system produces remarkably natural speech with appropriate prosody, emotion, and pacing.

Key features of ElevenLabs' approach include multi-language support with natural accent handling, fine-grained control over speaking style and emotional expression, voice cloning from relatively short audio samples, low-latency streaming for real-time applications, and a Conversational AI platform that integrates TTS with ASR and language models for end-to-end voice agents.

ElevenLabs does not publicly detail their model architecture, but their output quality — consistently rated among the highest in commercial TTS — suggests they employ state-of-the-art neural synthesis techniques, likely involving some combination of the approaches described above.

## How Lucy's Voice Is Powered by ElevenLabs TTS

Lucy's voice is the most tangible touchpoint of the Atlas UX platform. When a trade business owner's customer calls and Lucy answers, the voice must be warm, professional, and natural. Any hint of robotics breaks trust and undermines the value proposition.

Atlas UX integrates ElevenLabs through their Conversational AI platform, configured in `services/elevenlabs.ts`. Lucy's voice agent is created with a specific persona prompt, voice configuration, and mid-call tools (book appointment, send SMS, take message). The TTS component converts Lucy's language model responses into spoken audio in real-time.

The integration handles several voice-specific challenges. **Latency management** is critical — the system must generate speech fast enough that callers do not perceive unnatural pauses. ElevenLabs' streaming TTS helps by beginning audio playback before the entire response is synthesized. **Pronunciation** of business-specific terms, names, and addresses must be accurate. **Prosody** must match the conversational context — a confirmation should sound confident, a clarifying question should have rising intonation, and an empathetic response to a customer complaint should sound warm and understanding.

Voice quality directly impacts business outcomes. A natural-sounding Lucy convinces callers they are speaking with a real receptionist, leading to higher appointment booking rates and better customer satisfaction. The gap between "acceptable" and "excellent" TTS is the gap between a caller who hangs up and one who books a $500 plumbing job.

## Resources

- https://arxiv.org/abs/1609.03499 — "WaveNet: A Generative Model for Raw Audio" (van den Oord et al., 2016), the paper that launched neural TTS
- https://arxiv.org/abs/1712.05884 — "Natural TTS Synthesis by Conditioning WaveNet on Mel Spectrogram Predictions" (Shen et al., 2018), the Tacotron 2 paper

## Image References

1. "Concatenative versus parametric versus neural TTS comparison diagram" — search: TTS synthesis methods comparison concatenative parametric neural
2. "WaveNet dilated causal convolution architecture diagram" — search: WaveNet dilated causal convolution architecture
3. "Tacotron 2 encoder decoder attention architecture for text to speech" — search: Tacotron 2 architecture diagram encoder decoder
4. "Mel spectrogram output from neural TTS system showing natural prosody" — search: neural TTS mel spectrogram output visualization
5. "MOS score comparison chart across TTS systems from concatenative to neural" — search: TTS MOS score comparison chart quality metrics

## Video References

1. https://www.youtube.com/watch?v=YfU_sWHT8mo — "WaveNet: A Generative Model for Raw Audio" — DeepMind's presentation on the WaveNet breakthrough
2. https://www.youtube.com/watch?v=bd1mEBce4EQ — "The Rise of AI Voice: How ElevenLabs Works" — overview of modern commercial neural TTS and voice synthesis
