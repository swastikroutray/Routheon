# Routheon

### Intelligent LLM Routing for Faster, Cheaper AI Inference

Routheon is a **multi-provider LLM routing proxy** that analyzes incoming prompts, determines their complexity, and dynamically routes them to an appropriate language model.

Instead of sending every request to the most powerful model, Routheon uses **tier-based routing** to balance **latency, cost, and response quality**.

---

## What is Routheon?

Different prompts require different levels of reasoning.

A request like:

> "What is Python?"

doesn't need the same model as:

> "Debug this distributed system and explain the failure modes."

Routheon acts as an intelligent layer between the application and LLM providers:

```text
                    User
                     │
                     ▼
              ┌─────────────┐
              │   Routheon  │
              │    Router   │
              └──────┬──────┘
                     │
              Prompt Classifier
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Tier 1     Tier 2     Tier 3
       Simple    Moderate    Complex
          │          │          │
          ▼          ▼          ▼
       Gemini       Groq      Gemini
          │          │          │
          └──────────┼──────────┘
                     ▼
                  Response
```

## Key Features

1) **Complexity-Aware Routing**: Classifies prompts into different reasoning tiers.

2) **Multi-Provider Support**: Google Gemini, Groq, OpenRouter

3) **Latency Optimization**: Simple requests can be handled by faster lightweight models.

4) **Cost-Aware Inference**: Avoids unnecessarily using high-capability models for simple tasks.

5) **Provider Fallback**: Automatically switches to another configured provider when the preferred provider is unavailable.

6) **Response Verification**: A sample of lower-tier responses can be re-evaluated using a stronger model to monitor routing quality.

7) **Routing Analytics**: Tracks latency, token usage, providers, models and request statistics.

##Routing Architecture

Routheon currently uses three routing tiers:
|  Tier   | Request Type | Example                                               |
| ------- | ------------ | ----------------------------------------------------- |
|  Tier 1 | Simple       | "What is an API?"                                     |
|  Tier 2 | Moderate     | "Compare REST and GraphQL."                           |
|  Tier 3 | Complex      | "Debug this code and explain the issue step-by-step." |

The routing configuration is separated from the application logic, allowing providers and models to be changed through configuration.

## Response Verification

Routheon includes an optional verification mechanism to monitor whether routing lower-complexity requests affects response quality.

For a sampled request:
```text
                    Original Prompt
                          │
                          ▼
                    Routheon Router
                          │
                          ▼
                    Lower-Tier Model
                          │
                    Original Answer
                          │
                          ▼
                  ┌───────────────┐
                  │ Stronger Model│
                  │   + Judge     │
                  └───────┬───────┘
                          │
                          ▼
                    Agreement Check
```
This creates a feedback mechanism for evaluating the quality of routing decisions.

## Tech Stack

**Backend**: Python, FastAPI, Uvicorn, HTTPX, SQLite / aiosqlite, PyYAML

**Frontend**: React, Vite, JavaScript, Tailwind CSS

**LLM Providers**: Google Gemini, Groq, OpenRouter

## Project Structure
```text
Routheon/
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── routing.yaml
│   ├── classifier.py
│   ├── translator.py
│   ├── verifier.py
│   ├── db.py
│   │
│   └── providers/
│       ├── gemini.py
│       ├── groq.py
│       └── openrouter.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt
├── .gitignore
└── README.md
```
## Why Routheon?

Most LLM applications directly call a single model or provider.

Routheon introduces an intermediate routing layer that makes model selection an explicit engineering decision.

The goal is to **use the smallest suitable model for each request while maintaining response quality**, reducing unnecessary latency and inference cost.

## License

This project is licensed under the MIT License.
