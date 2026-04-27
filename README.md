# FinTok 2.0

**FinTok 2.0** is an AI-powered financial assistant that lets users ask questions about loan documents in natural language. It uses a Retrieval-Augmented Generation (RAG) pipeline on the backend and a modern Next.js interface on the frontend.

---

## Features

- 🔍 **RAG-powered Q&A** — Ask questions about loan documents; the AI retrieves relevant context and answers using Google Gemini.
- 📄 **PDF Knowledge Base** — Loan documents from multiple banks (FFB, GDB, GGM, GTB, NHB) are indexed and searchable.
- 🔐 **Authentication** — User sign-in via NextAuth.
- 💬 **Conversational UI** — Clean chat interface built with Next.js, Tailwind CSS, and Framer Motion.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Radix UI, Framer Motion |
| Backend  | Python, Flask, LangChain, FAISS, Cohere Embeddings, Google Gemini |
| Auth     | NextAuth v5 |
| Database | MongoDB (via Mongoose) |

---

## Project Structure

```
FinTok2.0/
├── backend/
│   ├── docs/          # PDF loan documents used as knowledge base
│   ├── vectorstore/   # FAISS index (auto-generated on startup)
│   ├── main.py        # Flask API server
│   └── requirements.txt
└── frontend/
    ├── app/           # Next.js app router pages & API routes
    ├── components/    # Reusable UI components
    ├── lib/           # Utility functions
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Cohere API key](https://cohere.com/)
- A [Google AI API key](https://aistudio.google.com/)
- A MongoDB connection string

---

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
COHERE_API_KEY=your_cohere_api_key
GOOGLE_API_KEY=your_google_api_key
```

Start the Flask server:

```bash
python main.py
```

The API will be available at `http://localhost:5000`.

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

### `POST /query`

Send a question to the RAG pipeline.

**Request body:**
```json
{
  "query": "What is the interest rate for GDB loans?"
}
```

**Response:**
```json
{
  "query": "What is the interest rate for GDB loans?",
  "answer": "..."
}
```

---

## Adding Documents

Place additional PDF files in the `backend/docs/` directory. The FAISS index is rebuilt automatically each time the backend starts.

---

## License

This project is open source. See [LICENSE](LICENSE) for details.
