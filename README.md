<div align="center">

# FinTok 2.0

### Voice-First · Multilingual · AI-Powered Financial Assistant

*Ask about loans, get financial guidance, and apply — all by speaking, in your own language.*

---

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-lightgrey?logo=flask)](https://flask.palletsprojects.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## What is FinTok 2.0?

FinTok 2.0 is a multilingual, voice-driven financial assistant designed to make loan information and financial guidance accessible to everyone — regardless of language or digital literacy.

Users speak naturally in any supported Indian language. FinTok transcribes the speech, understands the intent, fetches relevant information from a curated loan document knowledge base, and speaks the answer back — in the user's own language.

---

## Key Features

| Feature | Description |
|---|---|
| 🎙️ **Voice Input** | Record audio directly from the browser — no typing required |
| 🌐 **Multilingual** | Supports multiple Indian languages via Sarvam AI's ASR and TTS models |
| 🧠 **Intent Routing** | Classifies each query into loan application, eligibility check, financial guidance, or general Q&A |
| 📄 **RAG Knowledge Base** | Loan documents from multiple banks indexed with FAISS + Cohere embeddings |
| 🤖 **AI Responses** | Google Gemini 1.5 Flash provides context-aware answers with persistent chat history |
| 🔊 **Voice Output** | Answers are translated and spoken back to the user via Sarvam AI TTS |
| 📋 **Smart Forms** | Loan application intent auto-triggers a guided form in the UI |
| 🔐 **Authentication** | Secure user sign-in via NextAuth v5 with MongoDB session storage |

---

## Architecture

FinTok 2.0 is composed of two services: a **Next.js frontend** that handles voice capture, intent routing, and the user interface, and a **Python/Flask backend** that runs the RAG pipeline over loan documents.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (User)                           │
│                  Speaks → MediaRecorder API                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Audio Blob (WAV)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Frontend (Port 3000)                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/transcribe                                        │   │
│  │  ├── Sarvam AI  (saaras:v2)   — ASR + auto-translate   │   │
│  │  └── Mistral AI (mistral-small) — Intent Classification │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│           ┌─────────────┼───────────────────┐                  │
│           ▼             ▼                   ▼                  │
│    loanApplication  generalQuery /    loanEligibility          │
│    (show form UI)   financialGuidance                          │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/flash                                             │   │
│  │  ├── Gemini 1.5 Flash — context-aware AI response      │   │
│  │  └── MongoDB         — chat history (last 10 messages) │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ AI response text                      │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/translate  — Sarvam AI translate to user language │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/tts        — Sarvam AI bulbul:v1 TTS              │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ Audio (WAV/MP3)                       │
└──────────────────────────┼──────────────────────────────────────┘
                           │ Played back to user
                           ▼
                     🔊 User hears answer

                    (RAG queries also hit)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Python / Flask Backend (Port 5000)             │
│                                                                 │
│   PDF Documents (docs/)                                         │
│       │                                                         │
│       ▼                                                         │
│   PyPDFLoader → CharacterTextSplitter                           │
│       │                                                         │
│       ▼                                                         │
│   Cohere Embeddings (embed-english-v2.0)                        │
│       │                                                         │
│       ▼                                                         │
│   FAISS Vector Store  ←→  POST /query                           │
│       │                                                         │
│       ▼                                                         │
│   RetrievalQA (LangChain) + Gemini 2.0 Flash                    │
│       │                                                         │
│       └──────────────────► JSON answer                          │
└─────────────────────────────────────────────────────────────────┘
```

### Intent Routing

Every voice query is classified into one of four intents by Mistral AI before any action is taken:

| Intent | Action |
|---|---|
| `loanApplication` | Displays a guided loan application form in the UI |
| `loanEligibility` | Routes to the AI for eligibility assessment |
| `financialGuidance` | Routes to Gemini Flash for financial advice |
| `generalQuery` | Routes to Gemini Flash for general Q&A |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS v4, Radix UI, Framer Motion |
| **AI — Speech** | Sarvam AI `saaras:v2` (ASR), `bulbul:v1` (TTS) |
| **AI — Intent** | Mistral AI `mistral-small-latest` |
| **AI — Response** | Google Gemini 1.5 Flash |
| **RAG Backend** | Python, Flask, LangChain, FAISS, Cohere `embed-english-v2.0`, Gemini 2.0 Flash |
| **Auth** | NextAuth v5 (credentials-based) |
| **Database** | MongoDB (Mongoose) — chat history |

---

## Project Structure

```
FinTok2.0/
├── backend/
│   ├── docs/               # PDF loan documents (knowledge base)
│   ├── vectorstore/        # FAISS index — auto-generated at startup
│   ├── main.py             # Flask RAG server
│   └── requirements.txt
│
└── frontend/
    ├── app/
    │   ├── api/
    │   │   ├── transcribe/ # ASR + Intent Classification (Sarvam + Mistral)
    │   │   ├── flash/      # AI response (Gemini 1.5 Flash + chat history)
    │   │   ├── translate/  # Language translation (Sarvam)
    │   │   ├── tts/        # Text-to-Speech (Sarvam bulbul:v1)
    │   │   └── [...nextauth]/ # Auth endpoints
    │   ├── Components/     # AudioPlayer, LoanForm, etc.
    │   ├── models/         # Mongoose schemas (ChatHistory, User)
    │   ├── utils/          # Client-side helpers (asr_translate, flash, tts)
    │   └── page.tsx        # Main chat interface
    ├── lib/                # Auth config, utility functions
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- API keys for: [Sarvam AI](https://sarvam.ai), [Mistral AI](https://mistral.ai), [Google AI Studio](https://aistudio.google.com), [Cohere](https://cohere.com)
- A **MongoDB** connection string

---

### 1. Clone the repository

```bash
git clone https://github.com/THETITAN220/FinTok2.0.git
cd FinTok2.0
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
COHERE_API_KEY=your_cohere_api_key
GOOGLE_API_KEY=your_google_api_key
```

Start the Flask RAG server:

```bash
python main.py
```

> The server starts at `http://localhost:5000`. It loads all PDFs from `docs/`, builds the FAISS index, and is ready to answer loan queries.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Database
MONGO_URI=your_mongodb_connection_string

# AI Services
SARVAM_API_KEY=your_sarvam_api_key
MISTRAL_API_KEY=your_mistral_api_key
FLASH_API_KEY=your_google_gemini_api_key

# Gemini system prompt (optional)
SYSTEM_INSTRUCTION="You are FinTok, a helpful multilingual financial assistant..."
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `COHERE_API_KEY` | ✅ | Cohere API key for document embeddings |
| `GOOGLE_API_KEY` | ✅ | Google AI API key for Gemini 2.0 Flash (RAG) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | ✅ | Secret used to sign NextAuth session tokens |
| `NEXTAUTH_URL` | ✅ | Base URL of the app (e.g. `http://localhost:3000`) |
| `MONGO_URI` | ✅ | MongoDB connection string (chat history + users) |
| `SARVAM_API_KEY` | ✅ | Sarvam AI key for ASR, translation, and TTS |
| `MISTRAL_API_KEY` | ✅ | Mistral AI key for intent classification |
| `FLASH_API_KEY` | ✅ | Google AI key for Gemini 1.5 Flash (chat responses) |
| `SYSTEM_INSTRUCTION` | ☑️ | Custom system prompt for the Gemini chat model |

---

## Backend API Reference

The Flask backend exposes a single endpoint consumed by the frontend.

### `POST /query`

Runs a natural-language question through the RAG pipeline over loan documents.

**Request**
```json
{
  "query": "What is the maximum loan tenure for GDB home loans?"
}
```

**Response**
```json
{
  "query": "What is the maximum loan tenure for GDB home loans?",
  "answer": "GDB home loans offer a maximum tenure of 30 years..."
}
```

---

## Extending the Knowledge Base

To add more loan documents, drop PDF files into `backend/docs/`. The FAISS vector index is rebuilt from scratch every time the backend starts — no manual re-indexing needed.

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is open source under the [MIT License](LICENSE).
