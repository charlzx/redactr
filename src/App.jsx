import React, { useState, useEffect, useCallback } from 'react';
import {
    Upload, Download, FileText, Settings, Type,
    CaseSensitive, WholeWord, Loader, FileDown,
    Plus, Search, Trash2, ArrowLeft, Shield, Check,
    ChevronRight, FolderOpen, Clock, Sun, Moon
} from 'lucide-react';
import { getAllProjects, saveProject, deleteProject } from './db';

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts) {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
}

// ── Project row component (mirrors json-editor ProjectRow) ────────────────────

function ProjectRow({ project, onOpen, onDelete }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const rulesCount = project.wordsToRedact.split(',').filter(r => r.trim()).length;

    return (
        <div
            onClick={onOpen}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border px-4 py-5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer first:rounded-t-lg last:rounded-b-lg last:border-b-0"
            style={{ backgroundColor: 'hsl(var(--card) / 0.2)' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <Shield
                    size={16}
                    style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0, transition: 'color 0.15s' }}
                    className="group-hover:text-foreground"
                />
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(var(--foreground))' }}>
                            {project.name}
                        </span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            borderRadius: '9999px', padding: '2px 8px', fontSize: '10px', fontWeight: 500,
                            background: 'hsl(213 100% 47% / 0.08)',
                            border: '1px solid hsl(213 100% 47% / 0.2)',
                            color: 'hsl(var(--accent))'
                        }}>
                            {rulesCount} {rulesCount === 1 ? 'rule' : 'rules'}
                        </span>
                    </div>
                    {project.originalText && (
                        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40ch' }}>
                            {project.originalText.slice(0, 80)}
                        </p>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    <Clock size={13} />
                    {relativeTime(project.updatedAt)}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px', justifyContent: 'flex-end' }}>
                    {confirmDelete ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'hsl(var(--background) / 0.9)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '4px 8px' }}>
                            <button onClick={onDelete} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--destructive))', cursor: 'pointer', background: 'none', border: 'none' }}>
                                Delete
                            </button>
                            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>/</span>
                            <button onClick={() => setConfirmDelete(false)} style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', background: 'none', border: 'none' }}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setConfirmDelete(true)}
                                title="Delete project"
                                style={{ padding: '6px', borderRadius: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', transition: 'color 0.15s, background 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'hsl(0 75% 50% / 0.1)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                            >
                                <Trash2 size={15} />
                            </button>
                            <ChevronRight size={15} style={{ color: 'hsl(var(--muted-foreground))', transition: 'color 0.15s' }} className="group-hover:text-foreground hidden sm:block" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Stat pill (compact, flat — no gradient cards) ─────────────────────────────

function StatPill({ label, value }) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
            borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem'
        }}>
            <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{label}</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{value}</span>
        </div>
    );
}

// ── Main App ──────────────────────────────────────────────────────────────────

const App = () => {
    // ── View & project state ──────────────────────────────────────────────────
    const [currentView, setCurrentView] = useState('dashboard');
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);

    // ── Editor state ──────────────────────────────────────────────────────────
    const [originalText, setOriginalText] = useState('');
    const [redactedText, setRedactedText] = useState('');
    const [wordsToRedact, setWordsToRedact] = useState('');
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isWholeWord, setIsWholeWord] = useState(true);
    const [scannedWords, setScannedWords] = useState(0);
    const [matchesFound, setMatchesFound] = useState(0);
    const [lastCopied, setLastCopied] = useState(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [processingError, setProcessingError] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── Dashboard UI state ────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // ── Load external libs ────────────────────────────────────────────────────
    useEffect(() => {
        const load = (src, id) => {
            if (!document.getElementById(id)) {
                const s = document.createElement('script');
                s.src = src; s.id = id;
                document.body.appendChild(s);
            }
        };
        load('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth-js');
        load('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js', 'pdf-js');
        load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-js');
    }, []);

    // ── Theme ─────────────────────────────────────────────────────
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('redacta-theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('redacta-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => setIsDark(v => !v);

    // ── Load projects from IndexedDB ──────────────────────────────────────────
    useEffect(() => {
        getAllProjects().then(setProjects).catch(console.error);
    }, []);

    // ── Redaction engine ──────────────────────────────────────────────────────
    const performRedaction = useCallback(() => {
        if (!originalText) { setRedactedText(''); setScannedWords(0); setMatchesFound(0); return; }
        let text = originalText;
        let total = 0;
        const pairs = wordsToRedact.split(',').map(s => {
            const parts = s.split(':');
            return { pattern: (parts[0] || '').trim(), replacement: parts.length > 1 ? parts.slice(1).join(':').trim() : '***' };
        }).filter(p => p.pattern.length > 0);

        pairs.forEach(({ pattern, replacement }) => {
            try {
                const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const flags = isCaseSensitive ? 'g' : 'gi';
                const re = new RegExp(isWholeWord ? `\\b${escaped}\\b` : escaped, flags);
                const m = text.match(re);
                if (m) total += m.length;
                text = text.replace(re, replacement);
            } catch (e) { console.error('Invalid regex', e); }
        });

        setRedactedText(text);
        setScannedWords(originalText.trim().split(/\s+/).filter(Boolean).length);
        setMatchesFound(total);
    }, [originalText, wordsToRedact, isCaseSensitive, isWholeWord]);

    useEffect(() => { performRedaction(); }, [performRedaction]);

    // ── Debounced autosave ────────────────────────────────────────────────────
    useEffect(() => {
        if (!activeProjectId) return;
        const timer = setTimeout(() => {
            setIsSaving(true);
            setProjects(prev => {
                const proj = prev.find(p => p.id === activeProjectId);
                if (!proj) { setIsSaving(false); return prev; }
                const updated = { ...proj, originalText, wordsToRedact, isCaseSensitive, isWholeWord, updatedAt: Date.now() };
                saveProject(updated)
                    .catch(console.error)
                    .finally(() => setTimeout(() => setIsSaving(false), 300));
                return prev.map(p => p.id === activeProjectId ? updated : p);
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [originalText, wordsToRedact, isCaseSensitive, isWholeWord, activeProjectId]);

    // ── Project CRUD ──────────────────────────────────────────────────────────
    const suggestDefaultName = () => {
        let max = 0;
        projects.forEach(p => {
            const m = p.name.match(/^Untitled Project #(\d+)$/i);
            if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
        });
        return `Untitled Project #${max + 1}`;
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const name = newProjectName.trim() || suggestDefaultName();
        const proj = {
            id: Date.now().toString(), name,
            originalText: '', wordsToRedact: '',
            isCaseSensitive: false, isWholeWord: true,
            createdAt: Date.now(), updatedAt: Date.now()
        };
        await saveProject(proj);
        setProjects(prev => [proj, ...prev]);
        openProject(proj);
        setNewProjectName('');
        setIsCreateModalOpen(false);
    };

    const openProject = (proj) => {
        setActiveProjectId(proj.id);
        setOriginalText(proj.originalText);
        setWordsToRedact(proj.wordsToRedact);
        setIsCaseSensitive(proj.isCaseSensitive);
        setIsWholeWord(proj.isWholeWord);
        setCurrentView('editor');
    };

    const handleDeleteProject = async (id, e) => {
        e.stopPropagation();
        await deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        if (activeProjectId === id) { setActiveProjectId(null); setCurrentView('dashboard'); }
    };

    // ── File handlers ─────────────────────────────────────────────────────────
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsProcessingFile(true); setProcessingError(''); setOriginalText('');
        const reader = new FileReader();
        if (file.name.endsWith('.docx')) { reader.onload = e => processDocx(e.target.result); reader.readAsArrayBuffer(file); }
        else if (file.name.endsWith('.pdf')) { reader.onload = e => processPdf(e.target.result); reader.readAsArrayBuffer(file); }
        else { reader.onload = e => { setOriginalText(e.target.result); setIsProcessingFile(false); }; reader.readAsText(file); }
        event.target.value = null;
    };

    const processDocx = (buf) => {
        if (!window.mammoth) { setProcessingError('DOCX library not loaded. Please retry.'); setIsProcessingFile(false); return; }
        window.mammoth.extractRawText({ arrayBuffer: buf })
            .then(r => { setOriginalText(r.value); setIsProcessingFile(false); })
            .catch(() => { setProcessingError('Could not read the .docx file.'); setIsProcessingFile(false); });
    };

    const processPdf = async (buf) => {
        if (!window.pdfjsLib) { setProcessingError('PDF library not loaded. Please retry.'); setIsProcessingFile(false); return; }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        try {
            const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(it => it.str).join(' ') + '\n';
            }
            setOriginalText(text);
        } catch { setProcessingError('Could not read the .pdf file.'); }
        finally { setIsProcessingFile(false); }
    };

    const handleDownloadTxt = () => {
        const blob = new Blob([redactedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'redacted-text.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        if (!window.jspdf) { alert('PDF library not loaded yet.'); return; }
        setIsGeneratingPdf(true);
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            pdf.text(pdf.splitTextToSize(redactedText, 180), 10, 10);
            pdf.save('redacted-document.pdf');
        } catch { alert('Error generating PDF.'); }
        finally { setIsGeneratingPdf(false); }
    };

    const handleCopy = (text, type) => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); setLastCopied(type); setTimeout(() => setLastCopied(null), 2000); }
        catch (e) { console.error(e); }
        document.body.removeChild(ta);
    };

    // ── Filtered projects ─────────────────────────────────────────────────────
    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.originalText.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeProject = projects.find(p => p.id === activeProjectId);

    // ─────────────────────────────────────────────────────────────────────────
    // ── DASHBOARD VIEW ────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    if (currentView === 'dashboard') {
        return (
            <div style={{ minHeight: '100dvh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', position: 'relative' }}>
                <main style={{ margin: '0 auto', maxWidth: '720px', padding: '64px 24px', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }} className="animate-in">

                    {/* Theme toggle — top right */}
                    <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                        <button
                            id="theme-toggle"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            style={{ position: 'relative', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.4)', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', transition: 'background 0.15s, color 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                            onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)'}
                        >
                            {isDark
                                ? <Sun size={16} style={{ transition: 'transform 0.2s' }} />
                                : <Moon size={16} style={{ transition: 'transform 0.2s' }} />
                            }
                        </button>
                    </div>

                    {/* ── Title block ── */}
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Redacta</h1>
                        <p style={{ marginTop: '8px', fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))' }}>
                            Client-side text redaction — nothing leaves your browser.
                        </p>
                        <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                                    border: 'none', borderRadius: '6px', padding: '8px 14px',
                                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                                    transition: 'opacity 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                <Plus size={15} />
                                New project
                            </button>
                        </div>
                    </div>

                    {/* ── Projects section ── */}
                    <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '36px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Projects</h2>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '3px 8px' }}>
                                {filtered.length} of {projects.length}
                            </span>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
                            <input
                                id="project-search"
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px', padding: '8px 12px 8px 36px',
                                    fontSize: '0.875rem', color: 'hsl(var(--foreground))',
                                    outline: 'none', transition: 'border-color 0.15s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'hsl(var(--accent))'}
                                onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                            />
                        </div>

                        {/* List / empty state */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {projects.length === 0 ? (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', padding: '64px 24px', textAlign: 'center',
                                    border: '1px dashed hsl(var(--border))', borderRadius: '12px',
                                    background: 'hsl(var(--card) / 0.2)'
                                }} className="animate-slide-up">
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                        <FolderOpen size={22} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                    </div>
                                    <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 8px 0' }}>No projects yet</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', maxWidth: '320px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                                        Create a project to start redacting. All data is stored locally in your browser.
                                    </p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                                            border: 'none', borderRadius: '6px', padding: '8px 14px',
                                            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        <Plus size={14} /> New project
                                    </button>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', border: '1px dashed hsl(var(--border))', borderRadius: '12px' }}>
                                    No projects match &ldquo;{searchQuery}&rdquo;
                                </div>
                            ) : (
                                <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--card) / 0.1)', overflow: 'hidden' }}>
                                    {filtered.map(proj => (
                                        <ProjectRow
                                            key={proj.id}
                                            project={proj}
                                            onOpen={() => openProject(proj)}
                                            onDelete={(e) => handleDeleteProject(proj.id, e || { stopPropagation: () => {} })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <p style={{ marginTop: '48px', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                        Built by <a href="https://charlz.dev" target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>Charlz</a>
                    </p>
                </main>

                {/* ── Create modal ── */}
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'hsl(0 0% 0% / 0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px hsl(0 0% 0% / 0.2)' }} className="animate-scale-in">
                            <div style={{ padding: '24px' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>New project</h3>
                                <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 20px 0' }}>
                                    Give your redaction workspace a name.
                                </p>
                                <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <input
                                        id="project-name-input"
                                        type="text"
                                        autoFocus
                                        placeholder={suggestDefaultName()}
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px', padding: '9px 12px', fontSize: '0.875rem',
                                            color: 'hsl(var(--foreground))', outline: 'none', transition: 'border-color 0.15s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'hsl(var(--accent))'}
                                        onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => { setIsCreateModalOpen(false); setNewProjectName(''); }}
                                            style={{ padding: '8px 14px', border: '1px solid hsl(var(--border))', borderRadius: '6px', background: 'transparent', fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))', cursor: 'pointer', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ padding: '8px 14px', border: 'none', borderRadius: '6px', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            Create
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ── EDITOR VIEW ───────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100dvh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>

            {/* ── Header (matches json-editor header style) ── */}
            <header style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 24px' }}>
                    {/* Breadcrumb: Projects / name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <button
                            id="back-to-projects"
                            onClick={() => setCurrentView('dashboard')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', cursor: 'pointer', padding: '4px 0', transition: 'color 0.15s', flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--foreground))'}
                            onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                        >
                            <ArrowLeft size={15} />
                            <span>Projects</span>
                        </button>
                        <span style={{ color: 'hsl(var(--muted-foreground) / 0.4)', fontSize: '0.875rem' }}>/</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {activeProject?.name ?? 'Workspace'}
                        </span>
                    </div>

                    {/* Right: theme toggle + save status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        id="theme-toggle-editor"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        style={{ position: 'relative', padding: '6px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.4)', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                        onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)'}
                    >
                        {isDark
                            ? <Sun size={15} />
                            : <Moon size={15} />
                        }
                    </button>

                    {/* Save status */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                        {isSaving ? (
                            <>
                                <Loader size={11} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--accent))' }} />
                                <span style={{ color: 'hsl(var(--accent))' }}>Saving…</span>
                            </>
                        ) : (
                            <>
                                <Check size={11} style={{ color: '#22c55e' }} />
                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Saved locally</span>
                            </>
                        )}
                    </div>
                    </div>
                </div>
            </header>

            {/* ── Main workspace ── */}
            <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }} className="animate-in">

                {/* ── Left: Controls ── */}
                <aside>
                    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--card))', padding: '20px', marginBottom: '16px' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                            <Settings size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                            Controls
                        </h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label htmlFor="wordsToRedact" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                Words &amp; Replacements
                            </label>
                            <textarea
                                id="wordsToRedact"
                                value={wordsToRedact}
                                onChange={e => setWordsToRedact(e.target.value)}
                                placeholder="word:replacement, another:***"
                                style={{
                                    width: '100%', boxSizing: 'border-box', height: '96px',
                                    background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px', padding: '9px 12px', resize: 'none',
                                    fontSize: '0.8125rem', color: 'hsl(var(--foreground))',
                                    fontFamily: 'ui-monospace, monospace', outline: 'none', transition: 'border-color 0.15s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'hsl(var(--accent))'}
                                onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                            />
                            <p style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px', lineHeight: 1.5 }}>
                                Format: <code style={{ fontFamily: 'ui-monospace, monospace' }}>pattern:replacement</code>. Defaults to <code>***</code>.
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { id: 'case-sensitive', label: 'Case sensitive', icon: <CaseSensitive size={13} />, checked: isCaseSensitive, onChange: () => setIsCaseSensitive(v => !v) },
                                { id: 'whole-word', label: 'Whole word only', icon: <WholeWord size={13} />, checked: isWholeWord, onChange: () => setIsWholeWord(v => !v) },
                            ].map(({ id, label, icon, checked, onChange }) => (
                                <label key={id} htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                                    <input type="checkbox" id={id} checked={checked} onChange={onChange} style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'hsl(var(--accent))' }} />
                                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{icon}</span>
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--card))', overflow: 'hidden' }}>
                        {[
                            { label: 'Words scanned', value: scannedWords, icon: <FileText size={13} /> },
                            { label: 'Matches found', value: matchesFound, icon: <Type size={13} /> },
                        ].map(({ label, value, icon }, i) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i === 0 ? '1px solid hsl(var(--border))' : 'none' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                                    {icon}{label}
                                </span>
                                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '0.9375rem', color: 'hsl(var(--foreground))' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ── Right: Text panels ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Original text */}
                    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--card))', position: 'relative' }}>
                        {isProcessingFile && (
                            <div style={{ position: 'absolute', inset: 0, background: 'hsl(var(--background) / 0.8)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '10px', gap: '12px' }}>
                                <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--accent))' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Processing file…</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Original text</span>
                            <label htmlFor="file-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))', cursor: 'pointer', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '5px 10px', background: 'hsl(var(--background))', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--background))'}
                            >
                                <Upload size={13} /> Upload file
                            </label>
                            <input id="file-upload" type="file" style={{ display: 'none' }} onChange={handleFileUpload} accept=".txt,.csv,.docx,.pdf" />
                        </div>
                        <textarea
                            value={originalText}
                            onChange={e => setOriginalText(e.target.value)}
                            placeholder="Paste your text here or upload a file above…"
                            style={{
                                width: '100%', boxSizing: 'border-box', minHeight: '260px',
                                background: 'transparent', border: 'none', outline: 'none',
                                padding: '16px', resize: 'vertical', fontSize: '0.875rem',
                                lineHeight: 1.65, color: 'hsl(var(--foreground))',
                                fontFamily: 'inherit', borderRadius: '0 0 10px 10px'
                            }}
                        />
                        {processingError && (
                            <p style={{ padding: '0 16px 12px', fontSize: '0.75rem', color: 'hsl(var(--destructive))' }}>{processingError}</p>
                        )}
                    </div>

                    {/* Redacted output */}
                    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--card))', position: 'relative' }}>
                        {isGeneratingPdf && (
                            <div style={{ position: 'absolute', inset: 0, background: 'hsl(var(--background) / 0.8)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '10px', gap: '12px' }}>
                                <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--accent))' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Generating PDF…</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Sanitised output</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Copy', onClick: () => handleCopy(redactedText, 'redacted'), active: lastCopied === 'redacted', variant: 'outline' },
                                    { label: '.txt', onClick: handleDownloadTxt, icon: <Download size={12} />, variant: 'outline' },
                                    { label: 'Download PDF', onClick: handleDownloadPdf, icon: <FileDown size={12} />, variant: 'primary', disabled: isGeneratingPdf },
                                ].map(({ label, onClick, icon, active, variant, disabled }) => (
                                    <button
                                        key={label}
                                        onClick={onClick}
                                        disabled={disabled}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '5px 10px', border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 500,
                                            cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                                            background: variant === 'primary' ? 'hsl(var(--primary))' : 'hsl(var(--background))',
                                            color: variant === 'primary' ? 'hsl(var(--primary-foreground))' : active ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
                                            borderColor: variant === 'primary' ? 'transparent' : active ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--border))',
                                            opacity: disabled ? 0.5 : 1
                                        }}
                                        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = variant === 'primary' ? 'hsl(var(--primary) / 0.85)' : 'hsl(var(--muted))'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = variant === 'primary' ? 'hsl(var(--primary))' : 'hsl(var(--background))'; }}
                                    >
                                        {icon}{label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div
                            id="redacted-output-content"
                            style={{ minHeight: '260px', padding: '16px', fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowY: 'auto', color: 'hsl(var(--foreground))' }}
                            dangerouslySetInnerHTML={{ __html: redactedText }}
                        />
                    </div>
                </div>

            </main>

            {/* Spinner keyframe injection */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default App;
