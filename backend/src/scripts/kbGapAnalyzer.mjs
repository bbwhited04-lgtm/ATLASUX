#!/usr/bin/env node
/**
 * KB Gap Analyzer — scans the Atlas UX knowledge base, identifies missing
 * topics, and generates a gap report with resource recommendations.
 *
 * Each gap includes: minimum 2 link resources, 5 image refs, 2 video refs.
 *
 * Usage: node backend/src/scripts/kbGapAnalyzer.mjs
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, basename, extname } from "node:path";

// ── Configuration ────────────────────────────────────────────────────────────

const KB_ROOT = new URL("../kb", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const VAULT_KB = join("H:", "The Vault", "projects", "atlasux", "docs", "kb");
const REPORT_OUT = join(KB_ROOT, "..", "scripts", "kb-gap-report.json");

// ── Expected Knowledge Domains ───────────────────────────────────────────────
// Each domain defines: id, name, description, expected file patterns/keywords,
// minimum file count, and resource references for filling gaps.

const EXPECTED_DOMAINS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // AI/ML FOUNDATIONS & HISTORY — THE BIG GAP
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "ai-ml-history",
    name: "AI/ML History & Foundations (1956–Present)",
    description: "The birth of AI at Dartmouth (1956), early symbolic AI, AI winters, shift to ML, Deep Blue, Watson, deep learning revolution, transformers, and the three waves of AI evolution.",
    keywords: ["dartmouth", "turing", "ai winter", "deep blue", "watson", "transformer", "perceptron", "backpropagation", "neural network history", "minsky", "mccarthy"],
    expectedFiles: [
      "ai-ml-birth-of-ai-1956.md",
      "ai-ml-foundations-symbolic-era.md",
      "ai-ml-early-systems-expert-systems.md",
      "ai-ml-winters-and-resurgences.md",
      "ai-ml-shift-to-machine-learning.md",
      "ai-ml-deep-blue-watson-era.md",
      "ai-ml-big-data-deep-learning.md",
      "ai-ml-transformers-attention-revolution.md",
      "ai-ml-three-waves-evolution.md",
      "ai-ml-llm-era-and-agents.md",
    ],
    minFiles: 8,
    priority: "CRITICAL",
    resources: {
      links: [
        { url: "https://hai.stanford.edu/sites/default/files/2023-03/AI-Index-Report-2023.pdf", title: "Stanford HAI AI Index Report 2023" },
        { url: "https://www.deeplearning.ai/courses/", title: "DeepLearning.AI Course Catalog (Andrew Ng)" },
        { url: "https://arxiv.org/abs/1706.03762", title: "Attention Is All You Need (Vaswani et al., 2017)" },
        { url: "https://en.wikipedia.org/wiki/History_of_artificial_intelligence", title: "Wikipedia: History of AI" },
      ],
      images: [
        { description: "Dartmouth Conference 1956 — birth of AI", search: "dartmouth conference 1956 artificial intelligence founders" },
        { description: "Perceptron diagram (Rosenblatt, 1958)", search: "rosenblatt perceptron 1958 diagram neural network" },
        { description: "Deep Blue vs Kasparov 1997", search: "deep blue kasparov 1997 chess IBM" },
        { description: "IBM Watson Jeopardy 2011", search: "ibm watson jeopardy 2011" },
        { description: "Transformer architecture diagram", search: "transformer architecture attention mechanism diagram" },
        { description: "Three waves of AI evolution timeline", search: "three waves AI evolution DARPA timeline" },
        { description: "AI winter timeline chart", search: "ai winter timeline chart funding decline" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=J4RqCSD--Dg", title: "The History of Artificial Intelligence (ColdFusion)" },
        { url: "https://www.youtube.com/watch?v=aircAruvnKk", title: "But what is a Neural Network? (3Blue1Brown)" },
        { url: "https://www.youtube.com/watch?v=UZDiGooFs54", title: "The Turing Test — Computerphile" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSFORMER & LLM ARCHITECTURE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "transformer-llm-architecture",
    name: "Transformer & LLM Architecture Deep Dive",
    description: "Attention mechanisms, BERT, GPT lineage, scaling laws, tokenization, fine-tuning, RLHF, mixture of experts, multimodal models.",
    keywords: ["transformer", "attention mechanism", "bert", "gpt", "scaling law", "tokenization", "rlhf", "fine-tuning", "mixture of experts", "chinchilla"],
    expectedFiles: [
      "ai-transformers-attention-explained.md",
      "ai-gpt-lineage-gpt1-to-gpt4.md",
      "ai-scaling-laws-chinchilla.md",
      "ai-rlhf-alignment.md",
      "ai-tokenization-embeddings.md",
      "ai-multimodal-models.md",
    ],
    minFiles: 5,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://jalammar.github.io/illustrated-transformer/", title: "The Illustrated Transformer (Jay Alammar)" },
        { url: "https://arxiv.org/abs/2203.15556", title: "Training Compute-Optimal LLMs (Chinchilla paper)" },
      ],
      images: [
        { description: "Self-attention mechanism visualization", search: "self attention mechanism transformer visualization" },
        { description: "GPT architecture evolution GPT-1 to GPT-4", search: "GPT architecture evolution timeline OpenAI" },
        { description: "BERT vs GPT architecture comparison", search: "BERT GPT architecture comparison diagram" },
        { description: "Scaling laws compute vs performance", search: "scaling laws AI compute performance kaplan" },
        { description: "RLHF pipeline diagram", search: "RLHF reinforcement learning human feedback pipeline" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=wjZofJX0v4M", title: "Let's build GPT from scratch (Andrej Karpathy)" },
        { url: "https://www.youtube.com/watch?v=zjkBMFhNj_g", title: "Attention in transformers, visually explained (3Blue1Brown)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTER VISION FOUNDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "computer-vision",
    name: "Computer Vision & Visual AI",
    description: "CNNs, image classification, object detection, GANs, diffusion models, visual transformers (ViT), CLIP, and how they power image/video generation.",
    keywords: ["cnn", "convolutional", "resnet", "gan", "diffusion model", "clip", "vision transformer", "yolo", "image classification", "stable diffusion architecture"],
    expectedFiles: [
      "ai-computer-vision-foundations.md",
      "ai-cnns-to-vision-transformers.md",
      "ai-gans-generative-adversarial.md",
      "ai-diffusion-models-explained.md",
      "ai-clip-contrastive-learning.md",
    ],
    minFiles: 4,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://cs231n.stanford.edu/", title: "Stanford CS231n: CNNs for Visual Recognition" },
        { url: "https://lilianweng.github.io/posts/2021-07-11-diffusion-models/", title: "What are Diffusion Models? (Lilian Weng)" },
      ],
      images: [
        { description: "CNN architecture layers visualization", search: "convolutional neural network layers visualization" },
        { description: "GAN generator discriminator diagram", search: "GAN generative adversarial network generator discriminator" },
        { description: "Diffusion model forward reverse process", search: "diffusion model denoising forward reverse process diagram" },
        { description: "CLIP contrastive learning diagram", search: "CLIP contrastive language image pretraining diagram OpenAI" },
        { description: "Vision Transformer ViT patch embedding", search: "vision transformer ViT patch embedding diagram" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=HGOBQPFzWKo", title: "How Diffusion Models Work (Computerphile)" },
        { url: "https://www.youtube.com/watch?v=8L10w1KoOU8", title: "GANs Explained Simply (Lex Fridman)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NLP & LANGUAGE UNDERSTANDING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "nlp-foundations",
    name: "NLP & Language Understanding",
    description: "Evolution from rule-based NLP to statistical methods to neural NLP. Word embeddings, sequence models, language modeling, sentiment analysis, NER.",
    keywords: ["nlp", "word2vec", "word embedding", "named entity", "sentiment analysis", "language model", "seq2seq", "lstm", "recurrent"],
    expectedFiles: [
      "ai-nlp-evolution-rules-to-neural.md",
      "ai-word-embeddings-word2vec-glove.md",
      "ai-sequence-models-rnn-lstm.md",
      "ai-language-modeling-fundamentals.md",
    ],
    minFiles: 3,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://web.stanford.edu/class/cs224n/", title: "Stanford CS224n: NLP with Deep Learning" },
        { url: "https://jalammar.github.io/illustrated-word2vec/", title: "The Illustrated Word2Vec (Jay Alammar)" },
      ],
      images: [
        { description: "Word2Vec vector space visualization", search: "word2vec vector space king queen analogy" },
        { description: "LSTM cell diagram", search: "LSTM long short term memory cell diagram gates" },
        { description: "NLP pipeline stages", search: "NLP pipeline tokenization POS NER parsing" },
        { description: "Seq2Seq encoder decoder", search: "sequence to sequence encoder decoder attention" },
        { description: "Evolution of NLP methods timeline", search: "NLP evolution timeline rules statistical neural transformer" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=viZrOnJclY0", title: "Word2Vec Explained (StatQuest)" },
        { url: "https://www.youtube.com/watch?v=SHvAYCesFq4", title: "RNN & LSTM Explained (CodeEmporium)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REINFORCEMENT LEARNING & ROBOTICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "reinforcement-learning",
    name: "Reinforcement Learning & Decision Making",
    description: "Q-learning, policy gradients, AlphaGo, reward modeling, multi-agent RL, sim-to-real transfer. Foundational for agent decision-making.",
    keywords: ["reinforcement learning", "q-learning", "policy gradient", "alphago", "reward model", "markov decision", "bellman"],
    expectedFiles: [
      "ai-reinforcement-learning-foundations.md",
      "ai-alphago-deepmind-breakthroughs.md",
      "ai-reward-modeling-alignment.md",
    ],
    minFiles: 3,
    priority: "MEDIUM",
    resources: {
      links: [
        { url: "https://spinningup.openai.com/en/latest/", title: "OpenAI Spinning Up in Deep RL" },
        { url: "https://www.deepmind.com/blog/alphago-the-story-so-far", title: "DeepMind: AlphaGo — The Story So Far" },
      ],
      images: [
        { description: "RL agent environment loop", search: "reinforcement learning agent environment reward loop diagram" },
        { description: "AlphaGo vs Lee Sedol 2016", search: "alphago lee sedol 2016 go game deepmind" },
        { description: "Q-learning grid world visualization", search: "q-learning grid world value function visualization" },
        { description: "Policy gradient vs value-based comparison", search: "policy gradient value based reinforcement learning comparison" },
        { description: "Multi-agent RL coordination", search: "multi-agent reinforcement learning cooperation competition" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=WO3kmx4CVgg", title: "DeepMind's AlphaGo Documentary" },
        { url: "https://www.youtube.com/watch?v=2pWv7GOvuf0", title: "RL Course — David Silver (DeepMind)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI ETHICS, SAFETY & ALIGNMENT (BEYOND EXISTING)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "ai-safety-alignment",
    name: "AI Safety, Alignment & Existential Research",
    description: "Constitutional AI, RLHF critique, interpretability, red-teaming, existential risk research, AI governance frameworks, Dead App Corp's alignment stance.",
    keywords: ["alignment", "constitutional ai", "interpretability", "red team", "existential risk", "ai safety", "superintelligence", "instrumental convergence"],
    expectedFiles: [
      "ai-safety-alignment-landscape.md",
      "ai-constitutional-ai-anthropic.md",
      "ai-interpretability-mechanistic.md",
      "ai-existential-risk-research.md",
      "ai-red-teaming-adversarial.md",
    ],
    minFiles: 4,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://www.anthropic.com/research", title: "Anthropic Research — Constitutional AI & Alignment" },
        { url: "https://www.alignmentforum.org/", title: "AI Alignment Forum" },
        { url: "https://transformer-circuits.pub/", title: "Transformer Circuits (Anthropic Interpretability)" },
      ],
      images: [
        { description: "Constitutional AI training pipeline", search: "constitutional AI anthropic training pipeline RLHF" },
        { description: "Mechanistic interpretability neuron visualization", search: "mechanistic interpretability transformer neuron activation" },
        { description: "AI alignment taxonomy", search: "AI alignment taxonomy outer inner alignment" },
        { description: "Red teaming adversarial testing flow", search: "AI red teaming adversarial testing evaluation flow" },
        { description: "Existential risk landscape map", search: "AI existential risk landscape superintelligence timeline" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=EUjc1WuyPT8", title: "AI Alignment Problem Explained (Robert Miles)" },
        { url: "https://www.youtube.com/watch?v=bIrEM2FbOLU", title: "Constitutional AI Explained (Anthropic)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEECH & AUDIO AI
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "speech-audio-ai",
    name: "Speech & Audio AI",
    description: "ASR (Whisper), TTS (ElevenLabs architecture), voice cloning, audio generation, music AI. Critical for Lucy's voice pipeline.",
    keywords: ["speech recognition", "text to speech", "whisper", "voice cloning", "audio generation", "tts", "asr", "speech synthesis"],
    expectedFiles: [
      "ai-speech-recognition-asr-evolution.md",
      "ai-text-to-speech-tts-landscape.md",
      "ai-voice-cloning-ethics-tech.md",
      "ai-audio-generation-music-ai.md",
    ],
    minFiles: 3,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://openai.com/research/whisper", title: "OpenAI Whisper — Robust Speech Recognition" },
        { url: "https://elevenlabs.io/docs", title: "ElevenLabs Documentation" },
      ],
      images: [
        { description: "ASR pipeline mel spectrogram to text", search: "automatic speech recognition pipeline spectrogram transformer" },
        { description: "Whisper architecture diagram", search: "openai whisper architecture encoder decoder" },
        { description: "TTS synthesis pipeline", search: "text to speech neural TTS pipeline vocoder" },
        { description: "Voice cloning few-shot learning", search: "voice cloning few shot learning speaker embedding" },
        { description: "Audio waveform vs spectrogram", search: "audio waveform spectrogram mel comparison" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=ABFqbY_rmEk", title: "How Whisper Works (Yannic Kilcher)" },
        { url: "https://www.youtube.com/watch?v=0sR1rU3gLzQ", title: "The Evolution of Text-to-Speech AI" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI FOR SMALL BUSINESS / TRADES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "ai-small-business-trades",
    name: "AI for Small Business & Trade Industries",
    description: "How AI transforms plumbing, HVAC, salons, electrical, landscaping. ROI case studies, adoption barriers, Dead App Corp market thesis.",
    keywords: ["small business ai", "trade business", "plumber", "hvac", "salon", "contractor", "field service", "appointment automation"],
    expectedFiles: [
      "ai-trade-business-transformation.md",
      "ai-field-service-automation.md",
      "ai-receptionist-market-analysis.md",
      "ai-small-business-adoption-barriers.md",
      "ai-roi-case-studies-trades.md",
    ],
    minFiles: 4,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://www.sba.gov/business-guide/grow-your-business/technology", title: "SBA: Technology for Small Business" },
        { url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai", title: "McKinsey: Economic Potential of Generative AI" },
      ],
      images: [
        { description: "AI receptionist workflow for trades", search: "AI receptionist workflow plumber HVAC appointment booking" },
        { description: "Small business AI adoption curve", search: "small business AI adoption curve technology" },
        { description: "Field service management AI automation", search: "field service management AI automation scheduling" },
        { description: "Missed call revenue loss infographic", search: "missed call revenue loss small business statistics" },
        { description: "AI vs human receptionist cost comparison", search: "AI receptionist cost comparison human receptionist savings" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=jPhJbKBuNnA", title: "How AI is Changing Small Business Forever" },
        { url: "https://www.youtube.com/watch?v=_MPJ13M4YUY", title: "AI Receptionist for Service Businesses Demo" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTONOMOUS AGENTS — INDUSTRY LANDSCAPE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "autonomous-agents-landscape",
    name: "Autonomous Agent Landscape & Frameworks",
    description: "AutoGPT, CrewAI, LangGraph, Claude Agent SDK, OpenAI Assistants, agent frameworks comparison. Where Atlas UX fits in the ecosystem.",
    keywords: ["autogpt", "crewai", "langgraph", "langchain", "agent framework", "openai assistants", "claude agent", "swarm", "magentic one"],
    expectedFiles: [
      "ai-agent-frameworks-comparison.md",
      "ai-autogpt-babyagi-history.md",
      "ai-crewai-langgraph-swarm.md",
      "ai-agent-sdk-landscape.md",
      "ai-atlas-ux-agent-differentiation.md",
    ],
    minFiles: 4,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk", title: "Claude Agent SDK Documentation" },
        { url: "https://www.crewai.com/", title: "CrewAI — Multi-Agent Orchestration Framework" },
      ],
      images: [
        { description: "Agent framework comparison chart", search: "AI agent framework comparison AutoGPT CrewAI LangGraph" },
        { description: "Multi-agent orchestration architecture", search: "multi-agent orchestration architecture diagram" },
        { description: "ReAct reasoning action loop", search: "ReAct reasoning action agent loop diagram" },
        { description: "Agent memory architecture diagram", search: "AI agent memory architecture short long term episodic" },
        { description: "Atlas UX agent hierarchy (custom)", search: "atlas ux agent hierarchy CEO CRO receptionist" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=sal78ACtGTc", title: "Building AI Agents — Andrew Ng" },
        { url: "https://www.youtube.com/watch?v=DWUdGhRrv2c", title: "AI Agent Frameworks Compared (2025)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE GRAPHS & RAG ARCHITECTURE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "knowledge-graphs-rag",
    name: "Knowledge Graphs & Advanced RAG",
    description: "Graph RAG, hybrid retrieval, re-ranking, knowledge graph construction, embedding strategies, chunking approaches.",
    keywords: ["knowledge graph", "graph rag", "hybrid retrieval", "re-ranking", "chunking strategy", "embedding model", "colbert"],
    expectedFiles: [
      "ai-knowledge-graphs-fundamentals.md",
      "ai-graph-rag-architecture.md",
      "ai-advanced-chunking-strategies.md",
      "ai-hybrid-retrieval-reranking.md",
    ],
    minFiles: 3,
    priority: "MEDIUM",
    resources: {
      links: [
        { url: "https://microsoft.github.io/graphrag/", title: "Microsoft GraphRAG — Knowledge Graph + RAG" },
        { url: "https://docs.pinecone.io/guides/get-started/overview", title: "Pinecone Vector DB Documentation" },
      ],
      images: [
        { description: "GraphRAG architecture diagram", search: "GraphRAG knowledge graph retrieval augmented generation" },
        { description: "Chunking strategies comparison", search: "document chunking strategies fixed recursive semantic" },
        { description: "Hybrid retrieval pipeline", search: "hybrid retrieval sparse dense vector search pipeline" },
        { description: "Embedding model comparison chart", search: "embedding model comparison OpenAI Cohere BGE" },
        { description: "Re-ranking pipeline illustration", search: "cross encoder re-ranking retrieval pipeline" },
      ],
      videos: [
        { url: "https://www.youtube.com/watch?v=knLZBh3GRJY", title: "GraphRAG Explained (Microsoft Research)" },
        { url: "https://www.youtube.com/watch?v=T-D1OfcDW1M", title: "Advanced RAG Techniques (LlamaIndex)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEAD APP CORP — COMPANY KNOWLEDGE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "dead-app-corp",
    name: "Dead App Corp — Company & Product Knowledge",
    description: "Company history, product portfolio (Atlas UX, CallLucy, Ask Essie), mission, Dead App methodology, lessons from shuttered products.",
    keywords: ["dead app", "atlas ux", "calllucy", "ask essie", "shorty pro", "viraldeadengine", "deadapp.info"],
    expectedFiles: [
      "company-dead-app-corp-story.md",
      "company-product-portfolio.md",
      "company-dead-app-methodology.md",
      "company-lessons-shuttered-products.md",
      "company-atlas-ux-genesis.md",
    ],
    minFiles: 4,
    priority: "HIGH",
    resources: {
      links: [
        { url: "https://atlasux.cloud", title: "Atlas UX — Official Platform" },
        { url: "https://deadapp.info", title: "Dead App Corp — Company Site" },
      ],
      images: [
        { description: "Dead App Corp logo/brand", search: "Dead App Corp AI company logo" },
        { description: "Atlas UX platform dashboard screenshot", search: "atlas ux ai receptionist platform dashboard" },
        { description: "Lucy AI receptionist concept", search: "AI receptionist Lucy virtual assistant concept" },
        { description: "Product portfolio timeline", search: "startup product portfolio evolution timeline" },
        { description: "Dead app graveyard concept", search: "app graveyard dead products lessons learned startup" },
      ],
      videos: [
        { url: "https://www.youtube.com/results?search_query=dead+app+corp+atlas+ux", title: "Dead App Corp — Search for any existing content" },
        { url: "https://www.youtube.com/results?search_query=AI+receptionist+small+business+demo", title: "AI Receptionist Demos (market comparison)" },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXISTING DOMAIN CHECKS (verify coverage)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "agent-playbooks",
    name: "Agent Playbooks & Operational Docs",
    description: "Each named agent (Atlas, Binky, Cheryl, etc.) should have a playbook in the KB.",
    keywords: ["playbook", "atlas-ceo", "binky-cro", "cheryl-support", "petra-pm", "sunday-writer", "mercer", "tina", "benny"],
    expectedFiles: [],
    minFiles: 6,
    priority: "LOW",
    resources: { links: [], images: [], videos: [] },
  },
  {
    id: "mba-business",
    name: "MBA Business Frameworks",
    description: "Business strategy, finance, marketing, operations, organizational behavior.",
    keywords: ["mba", "porter", "blue ocean", "swot", "vrio", "corporate strategy", "financial accounting"],
    expectedFiles: [],
    minFiles: 12,
    priority: "LOW",
    resources: { links: [], images: [], videos: [] },
  },
  {
    id: "legal-compliance",
    name: "Legal & Compliance",
    description: "Law topics, IP, privacy, regulatory, trademark.",
    keywords: ["law-", "benny-", "legal", "compliance", "gdpr", "ccpa", "trademark", "lanham"],
    expectedFiles: [],
    minFiles: 20,
    priority: "LOW",
    resources: { links: [], images: [], videos: [] },
  },
  {
    id: "education-learning",
    name: "Education & Learning Science",
    description: "Learning theory, instructional design, assessment, educational psychology.",
    keywords: ["edu-", "learning theory", "instructional design", "bloom", "vygotsky"],
    expectedFiles: [],
    minFiles: 10,
    priority: "LOW",
    resources: { links: [], images: [], videos: [] },
  },
];

// ── Scanner ──────────────────────────────────────────────────────────────────

async function walkDir(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
      if (entry.isDirectory()) {
        files.push(...(await walkDir(full)));
      } else if (extname(entry.name) === ".md") {
        files.push(full);
      }
    }
  } catch { /* dir doesn't exist */ }
  return files;
}

async function scanKb() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        Atlas UX Knowledge Base Gap Analyzer v1.0           ║");
  console.log("║        Dead App Corp — Existential Research Division       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Gather all KB files from both locations
  const kbFiles = await walkDir(KB_ROOT);
  const vaultKbFiles = await walkDir(VAULT_KB);
  const allFiles = [...kbFiles, ...vaultKbFiles];
  const allFilenames = allFiles.map((f) => basename(f).toLowerCase());
  const allContent = [];

  // Read file contents for keyword matching
  console.log(`Scanning ${allFiles.length} files across 2 KB locations...\n`);

  for (const f of allFiles) {
    try {
      const content = await readFile(f, "utf-8");
      allContent.push({ path: f, name: basename(f), content: content.toLowerCase() });
    } catch {
      allContent.push({ path: f, name: basename(f), content: "" });
    }
  }

  // ── Analyze each domain ──────────────────────────────────────────────────

  const gaps = [];
  const covered = [];

  for (const domain of EXPECTED_DOMAINS) {
    // Count files that are DEDICATED to this topic (filename-based matching only,
    // not incidental content mentions). A file "ai-ml-birth-of-ai-1956.md" is a
    // dedicated file; a file that merely mentions "transformer" in passing is not.
    const expectedSet = new Set((domain.expectedFiles ?? []).map((n) => n.toLowerCase()));
    const matchingFiles = allContent.filter((f) => {
      // Direct match: file is in the expectedFiles list
      if (expectedSet.has(f.name.toLowerCase())) return true;

      // Check if filename contains the domain keyword pattern
      const nameMatch = domain.keywords.some((kw) =>
        f.name.includes(kw.replace(/\s+/g, "-"))
      );
      if (nameMatch) return true;

      // Check if the file is PRIMARILY about this topic:
      // title/h1 must contain a keyword, or 3+ keywords appear in first 500 chars
      const head = f.content.slice(0, 500);
      const titleLine = head.split("\n").find((l) => l.startsWith("# ")) ?? "";
      const titleMatch = domain.keywords.some((kw) => titleLine.includes(kw));
      if (titleMatch) return true;

      // Must have 3+ distinct keywords in first 500 chars to count as dedicated
      const distinctHits = domain.keywords.filter((kw) => head.includes(kw)).length;
      return distinctHits >= 3;
    });

    const coverage = matchingFiles.length;
    const pct = Math.min(100, Math.round((coverage / domain.minFiles) * 100));

    const entry = {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      priority: domain.priority,
      expectedMin: domain.minFiles,
      found: coverage,
      coveragePct: pct,
      matchingFiles: matchingFiles.map((f) => relative(process.cwd(), f.path)),
      expectedFiles: domain.expectedFiles,
      resources: domain.resources,
    };

    if (coverage < domain.minFiles) {
      entry.status = "GAP";
      entry.deficit = domain.minFiles - coverage;
      gaps.push(entry);
    } else {
      entry.status = "COVERED";
      covered.push(entry);
    }
  }

  // Sort gaps by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  gaps.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));

  // ── Print Report ───────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  GAP REPORT — KNOWLEDGE BASE DEFICIENCIES");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const gap of gaps) {
    const bar = "█".repeat(Math.round(gap.coveragePct / 5)) + "░".repeat(20 - Math.round(gap.coveragePct / 5));
    console.log(`[${gap.priority}] ${gap.name}`);
    console.log(`  Coverage: ${bar} ${gap.coveragePct}% (${gap.found}/${gap.expectedMin} files)`);
    console.log(`  Deficit: ${gap.deficit} files needed`);
    console.log(`  Description: ${gap.description}`);

    if (gap.expectedFiles.length > 0) {
      console.log(`  Files to create:`);
      for (const f of gap.expectedFiles) {
        const exists = allFilenames.includes(f.toLowerCase());
        console.log(`    ${exists ? "✓" : "✗"} ${f}`);
      }
    }

    if (gap.resources.links?.length > 0) {
      console.log(`  Links:`);
      for (const l of gap.resources.links) {
        console.log(`    → ${l.title}: ${l.url}`);
      }
    }
    if (gap.resources.videos?.length > 0) {
      console.log(`  Videos:`);
      for (const v of gap.resources.videos) {
        console.log(`    ▶ ${v.title}: ${v.url}`);
      }
    }
    console.log();
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  COVERED DOMAINS (meeting minimum thresholds)");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const c of covered) {
    const bar = "█".repeat(Math.min(20, Math.round(c.coveragePct / 5))) + "░".repeat(Math.max(0, 20 - Math.round(c.coveragePct / 5)));
    console.log(`  ✓ ${c.name}: ${bar} ${c.coveragePct}% (${c.found}/${c.expectedMin})`);
  }

  // ── Summary ────────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  const critical = gaps.filter((g) => g.priority === "CRITICAL");
  const high = gaps.filter((g) => g.priority === "HIGH");
  const medium = gaps.filter((g) => g.priority === "MEDIUM");
  const totalDeficit = gaps.reduce((sum, g) => sum + g.deficit, 0);

  console.log(`  Total KB files scanned: ${allFiles.length}`);
  console.log(`  Domains analyzed: ${EXPECTED_DOMAINS.length}`);
  console.log(`  Gaps found: ${gaps.length} (${critical.length} critical, ${high.length} high, ${medium.length} medium)`);
  console.log(`  Covered: ${covered.length} domains meeting threshold`);
  console.log(`  Total file deficit: ${totalDeficit} files needed`);
  console.log(`  Unique resources cataloged: ${gaps.reduce((s, g) => s + (g.resources.links?.length ?? 0) + (g.resources.videos?.length ?? 0), 0)} links/videos`);

  // ── Write JSON report ──────────────────────────────────────────────────

  const report = {
    generatedAt: new Date().toISOString(),
    scanner: "kbGapAnalyzer.mjs v1.0",
    company: "Dead App Corp",
    product: "Atlas UX",
    totalFiles: allFiles.length,
    domainsAnalyzed: EXPECTED_DOMAINS.length,
    gaps,
    covered,
    summary: {
      totalDeficit,
      criticalGaps: critical.length,
      highGaps: high.length,
      mediumGaps: medium.length,
      coveredDomains: covered.length,
    },
  };

  const { writeFile } = await import("node:fs/promises");
  await writeFile(REPORT_OUT, JSON.stringify(report, null, 2));
  console.log(`\n  Report saved: ${REPORT_OUT}`);

  return report;
}

// ── Run ──────────────────────────────────────────────────────────────────────
scanKb().catch((err) => {
  console.error("Gap analyzer failed:", err);
  process.exit(1);
});
