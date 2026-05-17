# Nootes

**AI-powered lecture notes for Israeli high school students.**

Upload a class recording and Nootes transcribes it with Whisper, then transforms it into structured Cornell Notes in Hebrew using GPT-4o-mini — formatted like a real notebook page, ready to study from.

---

## How It Works

1. **Sign in** with Google
2. **Upload** a lecture recording (MP3, WAV, M4A, FLAC, WebM, OGG — up to 25 MB)
3. Nootes **transcribes** the audio using OpenAI Whisper (Hebrew-optimized)
4. GPT-4o-mini **summarizes** the transcript into Cornell Notes format
5. Your **notebook** appears — with main notes, cue questions, and a summary
6. **Download** it as an image to keep or share

The notebook page polls for progress in real time so you always see where things are: transcribing → summarizing → done.

---

## Output Format

Notes are generated using the **Cornell Note-Taking Method**:

| Section | Description |
|---|---|
| **Notes** | Main lecture content, structured with headings and bullet points |
| **Cues** | Study questions and key vocabulary for active recall |
| **Summary** | 1–3 sentence takeaway from the entire lecture |

All output is in Hebrew and styled to look like a handwritten notebook page. You can download the finished notebook as a JPEG.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + DaisyUI |
| Auth | NextAuth v4 (Google OAuth) |
| Database | PostgreSQL via Prisma |
| File Storage | Vercel Blob |
| AI — Transcription | OpenAI Whisper (`whisper-1`) |
| AI — Summarization | OpenAI GPT-4o-mini |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database
- An OpenAI API key
- A Google OAuth app (client ID + secret)
- A Vercel Blob store (or any compatible storage)

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://...

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

OPENAI_API_KEY=sk-...

BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### 3. Set up the database

```bash
npx prisma migrate deploy
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  page.tsx                  # Landing page with upload button
  layout.tsx                # Root layout
  components/
    UploadAudio.tsx          # File picker + upload flow
    NavBar.tsx               # Top navigation
    AuthButton.tsx           # Sign in / sign out
  notebook/[id]/
    Notebook.tsx             # Cornell notes viewer + download
  api/
    upload/recording/        # Handles multipart upload to Vercel Blob
    notebook/[id]/           # Returns notebook status and content
    auth/                    # NextAuth route handler
  actions/
    createNotebook.ts        # Server action to create a notebook record

lib/
  openai.ts                  # Whisper transcription + GPT-4o-mini summarization
  blob.ts                    # Vercel Blob helpers
  auth.ts                    # NextAuth config
  prisma.ts                  # Prisma client singleton

prisma/
  schema.prisma              # Notebook + User models

server-parameters.json       # Prompts, polling interval, daily limits
```

---

## Configuration

[server-parameters.json](server-parameters.json) controls runtime behavior:

```json
{
  "daily_limit": 5,
  "notebook_polling_interval": 5000,
  "prompts": {
    "transcribe": "...",
    "summarize": "..."
  }
}
```

- **`daily_limit`** — max uploads per user per day
- **`notebook_polling_interval`** — how often the notebook page checks for updates (ms)
- **`prompts`** — the system prompts sent to Whisper and GPT-4o-mini

---

## Notebook Pipeline

```
Upload audio
     │
     ▼
Vercel Blob (multipart)
     │
     ▼
Whisper transcription (Hebrew, whisper-1)
     │
     ▼
GPT-4o-mini summarization → JSON { title, notes, cues, summary }
     │
     ▼
Notebook status: completed
     │
     ▼
Client renders Cornell Notes page
```

Notebook status transitions: `pending → transcribing → summarizing → completed` (or `failed`).

---

## License

Private project — all rights reserved.
