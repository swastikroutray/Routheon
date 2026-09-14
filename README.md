# LLM Router

A zero-cost, multi-provider LLM routing proxy with a Gemini-compatible API surface and a chat web UI styled like Google Gemini.

## What It Does

Every prompt is classified by complexity (3 tiers) and routed to the cheapest model that can handle it:

| Tier | Complexity | Provider | Model |
|------|-----------|----------|-------|
| 1 | Simple (< 40 words, single question) | Gemini | `gemini-2.0-flash-lite` |
| 2 | Moderate (summarize, compare, extract) | Groq | `llama-3.1-8b-instant` |
| 3 | Complex (analyze, debug, step-by-step) | Gemini | `gemini-2.0-flash` |

A random 15% sample of tier-1/tier-2 responses are verified by re-running on the tier-3 model and scoring agreement via LLM-as-judge.

## Architecture

```
┌─────────────┐     ┌─────────────────────────────────────────┐
│  React UI   │────>│  FastAPI Backend                        │
│  (Vite)     │     │  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  port 5173  │     │  │Classifier│─>│ Router │─>│Provider│  │
│             │     │  └──────────┘  └────────┘  └────────┘  │
│             │     │       POST /v1/chat                     │
│             │     │       POST /v1beta/models/{m}:gen..     │
│             │     │       GET  /v1/stats                    │
└─────────────┘     └─────────────────────────────────────────┘
                              │                 │
                    ┌─────────┘                 └──────────┐
                    ▼                                      ▼
              ┌──────────┐  ┌──────────┐  ┌──────────────────┐
              │  Gemini  │  │   Groq   │  │   OpenRouter     │
              │ Free Tier│  │ Free Tier│  │   Free Models    │
              └──────────┘  └──────────┘  └──────────────────┘
```

## Quick Start

### 1. Get Free API Keys

- **Gemini**: https://aistudio.google.com/apikey
- **Groq**: https://console.groq.com/keys
- **OpenRouter** (optional): https://openrouter.ai/keys

### 2. Backend Setup

```bash
cd llm-router

# Create .env from example
cp .env.example .env
# Edit .env and add your API keys

# Install Python dependencies
pip install -r requirements.txt

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd llm-router/frontend

# Install dependencies
npm install

# Start dev server (proxies /v1/* to backend)
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Run the Test Script

```bash
cd llm-router
python test_router.py
```

## API Endpoints

### Gemini-Compatible Endpoint

```bash
# Exactly matches Google's Gemini API shape
curl -X POST http://localhost:8000/v1beta/models/gemini-2.0-flash:generateContent \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "What is the capital of France?"}]
    }]
  }'
```

Response matches Google's schema:
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Paris is the capital of France."}],
      "role": "model"
    },
    "finishReason": "STOP",
    "index": 0
  }],
  "usageMetadata": {
    "promptTokenCount": 8,
    "candidatesTokenCount": 12,
    "totalTokenCount": 20
  },
  "modelVersion": "gemini-2.0-flash-lite"
}
```

### Using with the Official google-genai SDK

```python
from google import genai

client = genai.Client(
    api_key="anything",  # not used, but required by SDK
    http_options={"api_version": "v1beta", "base_url": "http://localhost:8000"},
)

response = client.models.generate_content(
    model="gemini-2.0-flash",  # requested model - routing ignores this
    contents="Explain quantum computing",
)
print(response.text)
```

### Frontend Chat Endpoint

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "history": []}'
```

### Stats Dashboard

```bash
curl http://localhost:8000/v1/stats
```

## Project Structure

```
llm-router/
  app/
    config.py           # Environment variable loading
    routing.yaml        # Tier → provider/model mapping
    classifier.py       # Rule-based prompt complexity classifier
    translator.py       # Gemini API schema translation
    verifier.py         # Async response quality verification
    db.py               # SQLite logging and stats
    main.py             # FastAPI application
    providers/
      base.py           # Abstract provider interface
      gemini.py         # Google Gemini (raw HTTP)
      groq.py           # Groq (OpenAI-compatible)
      openrouter.py     # OpenRouter (OpenAI-compatible)
  frontend/
    src/
      App.jsx           # Root component
      api.js            # Backend API helpers
      components/
        Sidebar.jsx     # Collapsible chat history sidebar
        Header.jsx      # App header with dark mode toggle
        ChatArea.jsx    # Message list + input
        EmptyState.jsx  # Welcome screen with suggestions
        MessageBubble.jsx   # User/assistant messages with typing effect
        RoutingDetails.jsx  # Expandable routing metadata
        InputBar.jsx    # Auto-growing input with send button
        StatsWidget.jsx # Sidebar cost-savings dashboard
  requirements.txt
  test_router.py        # 10-prompt test script
  docker-compose.yml
  .env.example
  README.md
```

## Cost

**$0.** All providers are free tier:
- Gemini free tier: 15 RPM for Flash, 30 RPM for Flash-Lite
- Groq free tier: 30 RPM for Llama models
- OpenRouter: selected free models (not used in default config)
