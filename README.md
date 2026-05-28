# Redacta

A modern, offline-first compliance text redaction workspace. Features a project dashboard with local IndexedDB persistence, real-time regex-powered matching, visual preview highlights, and client-side multi-format exports.

All operations and text extractions run **100% locally in your browser** — zero data is ever sent to any external server.

**Live Demo:** [redacta.charlz.dev](https://redacta.charlz.dev)

---

## Key Features

- **Project Dashboard & Sorting:** Search and organize multiple projects locally with responsive sorting (Recently Updated, A-Z).
- **Real-Time Redaction Engine:** Define case-sensitive, whole-word, or regular expression matching patterns. Supports smart sequential placeholders (e.g. `[EMAIL_[SEQ]]`).
- **PII Auto-Scanner:** Locally scans and identifies sensitive metadata patterns: Emails, Phone Numbers, Credit Cards, and SSNs.
- **Original Match Previews:** Real-time visual underlines with interactive hover tooltips highlighting matched rules.
- **Scroll-Synchronized Workspace:** Side-by-side or stacked grid layouts with percentage-synchronized scroll bars.
- **Unified Document Exporters:**
  - **PDF Document:** Multi-page A4 layout compiler with dynamic watermark headers and footers (`Page X of Y`).
  - **Word Document:** XML-compliant pre-formatted `.docx` template exports.
  - **Compliance Keys:** Download original-to-replacement audit mapping logs as UTF-8 CSV or JSON.

---

## Tech Stack

- **Framework:** React 19 + Vite 7
- **Styling:** CSS variables (Vercel HSL design tokens)
- **Icons:** Lucide React
- **Storage:** Native IndexedDB
- **Parsers & Engines:** Mammoth.js (DOCX extraction), PDF.js (PDF extraction), jsPDF (PDF export)

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (recommended)

### Setup

```bash
# Clone the repository
git clone https://github.com/charlzx/redactr.git
cd redactr

# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Build production assets
pnpm build
```

---

Built by [Charlz](https://charlz.dev)
