# redacta

A modern, client-side text redaction tool for sanitising sensitive information from plain text, Word documents, and PDFs. Features a project dashboard with local persistence, real-time regex-powered redaction, and direct export — all running in your browser with zero data sent to any server.

**Live Demo:** [redacta.charlz.dev](https://redacta.charlz.dev)

---

## Features

- **Project dashboard** — Create, search, and manage multiple redaction projects. Each project auto-saves as you type, stored in IndexedDB — nothing is ever sent to a server.
- **Real-time redaction engine** — Comma-separated `pattern:replacement` rules applied live as you type. Supports whole-word matching and case-sensitivity toggles.
- **Multi-format file import** — Upload `.txt`, `.csv`, `.docx`, and `.pdf` files. DOCX text extraction uses Mammoth.js; PDF parsing uses PDF.js — both run fully client-side.
- **Export options** — Download the sanitised output as a `.txt` file or generate a formatted `.pdf` directly in the browser using jsPDF.
- **IndexedDB persistence** — Projects are stored in IndexedDB rather than `localStorage`, removing the 5 MB limit and safely handling large document extractions.
- **Debounced autosave** — Changes are committed to the database 500 ms after you stop typing; the header shows a live "Saved locally" status.
- **Sequential default naming** — New untitled projects automatically receive names like `Untitled Project #1`, `Untitled Project #2`, etc.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4 + CSS custom properties (Vercel design tokens) |
| Icons | Lucide React |
| Storage | Native IndexedDB (promise-based wrapper) |
| Doc parsing | Mammoth.js (DOCX), PDF.js (PDF), jsPDF (export) |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/charlzx/redactr.git
cd redactr

# Install dependencies
pnpm install
```

### Development

```bash
pnpm dev
```

Opens the app at `http://localhost:5173` with hot module replacement.

### Build

```bash
pnpm build
```

Compiles and bundles to `dist/`.

### Preview production build

```bash
pnpm preview
```

### Lint

```bash
pnpm lint
```

---

## Project Structure

```
redactr/
├── src/
│   ├── App.jsx          # Dashboard, editor views and all application logic
│   ├── db.js            # Native IndexedDB promise wrapper (CRUD for projects)
│   ├── index.css        # Tailwind + Vercel-style CSS custom property tokens
│   └── main.jsx         # React entry point
├── public/              # Static assets
├── index.html           # HTML shell
├── package.json         # Dependencies and scripts
├── pnpm-workspace.yaml  # pnpm workspace and build permissions
└── vite.config.js       # Vite configuration
```

---

## Usage Guide

### Creating a project

Click **New project** on the dashboard to open a named workspace immediately.

### Redacting text

Paste text directly into the editor or upload a file. Add redaction rules in the **Controls** panel using the format `pattern:replacement` — separate multiple rules with commas. Leave the replacement blank to default to `***`.

### Managing projects

All projects are listed on the dashboard, sorted by most recently updated. Use the search bar to filter by name or content. Click the trash icon on any row to delete (with inline confirmation).

### Exporting

Use the **Copy**, **.txt**, or **Download PDF** buttons in the output panel to export the sanitised result.

---

## Browser Support

Requires a modern browser with support for:

- IndexedDB
- FileReader API
- CSS Custom Properties

Works on Chrome, Firefox, Safari, and Edge.

---

Built by [Charlz](https://charlz.dev)
