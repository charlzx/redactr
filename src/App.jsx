import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const RULE_TEMPLATES = [
    { name: 'Email Regex', pattern: '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/', replacement: '[EMAIL_[SEQ]]', isRegex: true },
    { name: 'Phone Regex', pattern: '/(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-\\s.]?\\d{3}[-\\s.]?\\d{4}/', replacement: '[PHONE_[SEQ]]', isRegex: true },
    { name: 'Credit Card Regex', pattern: '/\\b\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}\\b/', replacement: '[CARD_[SEQ]]', isRegex: true },
    { name: 'SSN Regex', pattern: '/\\b\\d{3}-\\d{2}-\\d{4}\\b/', replacement: '[SSN_[SEQ]]', isRegex: true },
];

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
    const [isDragging, setIsDragging] = useState(false);
    const [importedFileName, setImportedFileName] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [rulePattern, setRulePattern] = useState('');
    const [ruleReplacement, setRuleReplacement] = useState('');
    const [ruleIsRegex, setRuleIsRegex] = useState(false);
    const [redactionMap, setRedactionMap] = useState({});
    const [editorMode, setEditorMode] = useState('edit');
    const [htmlRedactedText, setHtmlRedactedText] = useState('');
    const [layoutMode, setLayoutMode] = useState('stacked');
    const [isEditingRawRules, setIsEditingRawRules] = useState(false);
    const [isConfigRulesOpen, setIsConfigRulesOpen] = useState(true);
    const [isActiveRulesOpen, setIsActiveRulesOpen] = useState(true);
    const [isOptionsOpen, setIsOptionsOpen] = useState(true);
    const [piiSuggestions, setPiiSuggestions] = useState([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [piiHasScanned, setPiiHasScanned] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const textareaRef = useRef(null);

    // ── Dashboard UI state ────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isDashboardProcessingFile, setIsDashboardProcessingFile] = useState(false);
    const [dashboardImportedFileName, setDashboardImportedFileName] = useState('');
    const dashboardFileInputRef = useRef(null);

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
        if (!originalText) { 
            setRedactedText(''); 
            setHtmlRedactedText(''); 
            setScannedWords(0); 
            setMatchesFound(0); 
            setRedactionMap({}); 
            return; 
        }
        let text = originalText;
        
        let htmlText = originalText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        let total = 0;
        const mapping = {};
        const pairs = wordsToRedact.split(',').map(s => {
            const parts = s.split(':');
            return { pattern: (parts[0] || '').trim(), replacement: parts.length > 1 ? parts.slice(1).join(':').trim() : '***' };
        }).filter(p => p.pattern.length > 0);

        const PALETTE = [
            'hsl(213 100% 47%)', // Blue
            'hsl(142 71% 45%)',  // Emerald
            'hsl(262 83% 58%)',  // Violet
            'hsl(24 94% 50%)',   // Orange
            'hsl(339 90% 51%)',  // Rose
            'hsl(187 92% 38%)',  // Teal
            'hsl(47 95% 42%)',   // Amber
        ];

        pairs.forEach(({ pattern, replacement }, idx) => {
            try {
                let re;
                const isRegExPattern = pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2;
                if (isRegExPattern) {
                    const innerPattern = pattern.slice(1, -1);
                    const flags = isCaseSensitive ? 'g' : 'gi';
                    re = new RegExp(innerPattern, flags);
                } else {
                    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const flags = isCaseSensitive ? 'g' : 'gi';
                    re = new RegExp(isWholeWord ? `\\b${escaped}\\b` : escaped, flags);
                }

                const color = PALETTE[idx % PALETTE.length];

                if (replacement.includes('[SEQ]') || replacement.includes('{#}')) {
                    let seqCount = 1;
                    const matches = text.match(re);
                    if (matches) {
                        total += matches.length;
                        text = text.replace(re, (match) => {
                            const rep = replacement.replace('[SEQ]', seqCount).replace('{#}', seqCount);
                            mapping[match] = rep;
                            seqCount++;
                            return rep;
                        });
                    }

                    let htmlSeqCount = 1;
                    htmlText = htmlText.replace(re, (match) => {
                        const rep = replacement.replace('[SEQ]', htmlSeqCount).replace('{#}', htmlSeqCount);
                        htmlSeqCount++;
                        return `<span style="background: ${color}1a; border: 1px solid ${color}4d; color: ${color}; border-radius: 4px; padding: 1px 5px; font-weight: 600; font-family: ui-monospace, monospace; font-size: 0.75rem; white-space: nowrap;" title="Redacted by rule: ${pattern}">${rep}</span>`;
                    });
                } else {
                    const matches = text.match(re);
                    if (matches) {
                        total += matches.length;
                        matches.forEach(match => {
                            mapping[match] = replacement;
                        });
                        text = text.replace(re, replacement);
                        
                        htmlText = htmlText.replace(re, () => {
                            return `<span style="background: ${color}1a; border: 1px solid ${color}4d; color: ${color}; border-radius: 4px; padding: 1px 5px; font-weight: 600; font-family: ui-monospace, monospace; font-size: 0.75rem; white-space: nowrap;" title="Redacted by rule: ${pattern}">${replacement}</span>`;
                        });
                    }
                }
            } catch (e) { console.error('Invalid regex', e); }
        });

        setRedactedText(text);
        setHtmlRedactedText(htmlText);
        setScannedWords(originalText.trim().split(/\s+/).filter(Boolean).length);
        setMatchesFound(total);
        setRedactionMap(mapping);
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
        setPiiSuggestions([]);
        setIsScannerOpen(false);
        setIsScanning(false);
        setPiiHasScanned(false);
        setSelectedText('');
        setEditorMode('edit');
        setHtmlRedactedText('');
        setCurrentView('editor');
    };

    const handleDeleteProject = async (id, e) => {
        e.stopPropagation();
        await deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        if (activeProjectId === id) { setActiveProjectId(null); setCurrentView('dashboard'); }
    };

    const handleDashboardImportClick = () => {
        dashboardFileInputRef.current?.click();
    };

    const handleDashboardFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        event.target.value = null;

        setIsDashboardProcessingFile(true);
        setDashboardImportedFileName(file.name);

        try {
            const text = await extractTextFromFile(file);
            let name = file.name;
            const lastDot = name.lastIndexOf('.');
            if (lastDot !== -1) {
                name = name.slice(0, lastDot);
            }
            const projName = name || 'Imported Project';

            const proj = {
                id: Date.now().toString(),
                name: projName,
                originalText: text,
                wordsToRedact: '',
                isCaseSensitive: false,
                isWholeWord: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await saveProject(proj);
            setProjects(prev => [proj, ...prev]);
            openProject(proj);
        } catch (err) {
            alert(err || 'Failed to read the file.');
        } finally {
            setIsDashboardProcessingFile(false);
            setDashboardImportedFileName('');
        }
    };

    const activeRules = React.useMemo(() => {
        return wordsToRedact.split(',').map(s => {
            const parts = s.split(':');
            return { pattern: (parts[0] || '').trim(), replacement: parts.slice(1).join(':').trim() || '***' };
        }).filter(r => r.pattern.length > 0);
    }, [wordsToRedact]);

    const handleAddRule = (e) => {
        if (e) e.preventDefault();
        let pat = rulePattern.trim();
        if (!pat) return;

        if (ruleIsRegex) {
            if (!pat.startsWith('/') || !pat.endsWith('/')) {
                pat = `/${pat}/`;
            }
        }

        const rep = ruleReplacement.trim() || '***';
        const newRuleStr = rep === '***' ? pat : `${pat}:${rep}`;

        let newWordsStr = wordsToRedact.trim();
        if (newWordsStr) {
            const rulesArr = newWordsStr.split(',').map(s => s.trim());
            const index = rulesArr.findIndex(r => {
                const p = r.split(':')[0].trim();
                return p.toLowerCase() === pat.toLowerCase();
            });

            if (index !== -1) {
                rulesArr[index] = newRuleStr;
            } else {
                rulesArr.push(newRuleStr);
            }
            newWordsStr = rulesArr.join(', ');
        } else {
            newWordsStr = newRuleStr;
        }

        setWordsToRedact(newWordsStr);
        setRulePattern('');
        setRuleReplacement('');
        setRuleIsRegex(false);
    };

    const handleDeleteRule = (patternToDelete) => {
        const rulesArr = wordsToRedact.split(',').map(s => s.trim());
        const filteredRules = rulesArr.filter(r => {
            const p = r.split(':')[0].trim();
            return p.toLowerCase() !== patternToDelete.toLowerCase();
        });
        setWordsToRedact(filteredRules.join(', '));
    };

    const handleScanText = () => {
        if (!originalText) {
            setPiiSuggestions([]);
            return;
        }

        setIsScanning(true);
        setTimeout(() => {
            const text = originalText;
            const suggestions = [];

            const addUnique = (match, type, label) => {
                const pat = match.trim();
                if (!pat) return;
                if (!suggestions.some(s => s.pattern.toLowerCase() === pat.toLowerCase())) {
                    suggestions.push({ pattern: pat, replacement: '[REDACTED]', type, label });
                }
            };

            const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
            emails.forEach(e => addUnique(e, 'email', 'Email'));

            const phones = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
            phones.forEach(p => addUnique(p, 'phone', 'Phone'));

            const cards = text.match(/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g) || [];
            cards.forEach(c => addUnique(c, 'card', 'Card'));

            const ssns = text.match(/\b\d{3}-\d{2}-\d{4}\b/g) || [];
            ssns.forEach(s => addUnique(s, 'ssn', 'SSN'));

            setPiiSuggestions(suggestions);
            setIsScanning(false);
            setIsScannerOpen(true);
            setPiiHasScanned(true);
        }, 400);
    };

    const handleAcceptSuggestion = (suggestion) => {
        const pat = suggestion.pattern;
        const rep = suggestion.replacement;
        const newRuleStr = rep === '***' ? pat : `${pat}:${rep}`;

        let newWordsStr = wordsToRedact.trim();
        if (newWordsStr) {
            const rulesArr = newWordsStr.split(',').map(s => s.trim());
            const index = rulesArr.findIndex(r => {
                const p = r.split(':')[0].trim();
                return p.toLowerCase() === pat.toLowerCase();
            });

            if (index !== -1) {
                rulesArr[index] = newRuleStr;
            } else {
                rulesArr.push(newRuleStr);
            }
            newWordsStr = rulesArr.join(', ');
        } else {
            newWordsStr = newRuleStr;
        }

        setWordsToRedact(newWordsStr);
        setPiiSuggestions(prev => prev.filter(s => s.pattern !== pat));
    };

    const handleAcceptAllSuggestions = () => {
        if (piiSuggestions.length === 0) return;

        let newWordsStr = wordsToRedact.trim();
        const rulesArr = newWordsStr ? newWordsStr.split(',').map(s => s.trim()) : [];

        piiSuggestions.forEach(s => {
            const pat = s.pattern;
            const rep = s.replacement;
            const newRuleStr = rep === '***' ? pat : `${pat}:${rep}`;

            const index = rulesArr.findIndex(r => {
                const p = r.split(':')[0].trim();
                return p.toLowerCase() === pat.toLowerCase();
            });

            if (index !== -1) {
                rulesArr[index] = newRuleStr;
            } else {
                rulesArr.push(newRuleStr);
            }
        });

        setWordsToRedact(rulesArr.join(', '));
        setPiiSuggestions([]);
    };

    const handleTextareaSelection = (e) => {
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        if (start !== undefined && end !== undefined && start !== end) {
            const selected = e.target.value.substring(start, end).trim();
            if (selected.length > 0 && selected.length < 100) {
                setSelectedText(selected);
                return;
            }
        }
        setSelectedText('');
    };

    const handleAddSelectionAsRule = () => {
        if (!selectedText) return;
        const pat = selectedText.trim();
        let newWordsStr = wordsToRedact.trim();
        
        if (newWordsStr) {
            const rulesArr = newWordsStr.split(',').map(s => s.trim());
            const index = rulesArr.findIndex(r => {
                const p = r.split(':')[0].trim();
                return p.toLowerCase() === pat.toLowerCase();
            });

            if (index === -1) {
                rulesArr.push(pat);
            }
            newWordsStr = rulesArr.join(', ');
        } else {
            newWordsStr = pat;
        }

        setWordsToRedact(newWordsStr);
        setSelectedText('');

        if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd;
            textareaRef.current.focus();
        }
    };

    const renderHighlightedOriginalText = () => {
        if (!originalText) {
            return (
                <div style={{ padding: '16px', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', fontSize: '0.875rem' }}>
                    Type or paste some content first to see matched highlights.
                </div>
            );
        }

        let safeText = originalText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const pairs = wordsToRedact.split(',').map(s => {
            const parts = s.split(':');
            return { pattern: (parts[0] || '').trim(), replacement: parts.length > 1 ? parts.slice(1).join(':').trim() : '***' };
        }).filter(p => p.pattern.length > 0);

        if (pairs.length === 0) {
            return (
                <div style={{ padding: '16px', fontSize: '0.875rem', lineHeight: 1.65, color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '260px', maxHeight: '400px', overflowY: 'auto' }}>
                    {originalText}
                </div>
            );
        }

        pairs.forEach(({ pattern, replacement }) => {
            try {
                let re;
                const isRegExPattern = pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2;
                if (isRegExPattern) {
                    const innerPattern = pattern.slice(1, -1);
                    const flags = isCaseSensitive ? 'g' : 'gi';
                    re = new RegExp(innerPattern, flags);
                } else {
                    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const flags = isCaseSensitive ? 'g' : 'gi';
                    re = new RegExp(isWholeWord ? `\\b${escaped}\\b` : escaped, flags);
                }

                safeText = safeText.replace(re, (match) => {
                    return `<span style="background: hsl(38 92% 50% / 0.18); border-bottom: 2px solid hsl(38 92% 50%); border-radius: 2px; padding: 1px 2px; font-weight: 600; cursor: help;" title="Matched Rule: ${pattern} &rarr; ${replacement}">${match}</span>`;
                });
            } catch (e) { console.error('Highlight regex error', e); }
        });

        return (
            <div
                style={{
                    padding: '16px',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    color: 'hsl(var(--foreground))',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    minHeight: '260px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: safeText }}
            />
        );
    };

    // ── File handlers ─────────────────────────────────────────────────────────

    /** Strip common Markdown syntax to extract readable plain text */
    const markdownToPlainText = (md) => {
        return md
            // fenced code blocks
            .replace(/```[\s\S]*?```/g, '')
            // inline code
            .replace(/`[^`]*`/g, '')
            // headings
            .replace(/^#{1,6}\s+/gm, '')
            // bold / italic
            .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
            // links — keep label
            .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')
            // blockquotes
            .replace(/^>\s?/gm, '')
            // horizontal rules
            .replace(/^[-*_]{3,}$/gm, '')
            // list markers
            .replace(/^[\s]*[-*+]\s+/gm, '')
            .replace(/^[\s]*\d+\.\s+/gm, '')
            .trim();
    };

    /** Extract plain text from any supported file format */
    const extractTextFromFile = (file) => {
        return new Promise((resolve, reject) => {
            const name = file.name.toLowerCase();
            const reader = new FileReader();

            if (name.endsWith('.docx')) {
                reader.onload = e => {
                    const buf = e.target.result;
                    if (!window.mammoth) {
                        reject('DOCX library not loaded. Please retry.');
                        return;
                    }
                    window.mammoth.extractRawText({ arrayBuffer: buf })
                        .then(r => resolve(r.value))
                        .catch(() => reject('Could not read the .docx file.'));
                };
                reader.onerror = () => reject('Could not read the .docx file.');
                reader.readAsArrayBuffer(file);
            } else if (name.endsWith('.pdf')) {
                reader.onload = async e => {
                    const buf = e.target.result;
                    if (!window.pdfjsLib) {
                        reject('PDF library not loaded. Please retry.');
                        return;
                    }
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                    try {
                        const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
                        let text = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(it => it.str).join(' ') + '\n';
                        }
                        resolve(text);
                    } catch (err) {
                        reject('Could not read the .pdf file.');
                    }
                };
                reader.onerror = () => reject('Could not read the .pdf file.');
                reader.readAsArrayBuffer(file);
            } else {
                // .txt, .csv, .md and any other plain text
                reader.onload = e => {
                    const raw = e.target.result;
                    const text = name.endsWith('.md') ? markdownToPlainText(raw) : raw;
                    resolve(text);
                };
                reader.onerror = () => reject('Could not read the file.');
                reader.readAsText(file);
            }
        });
    };

    /** Unified file dispatcher — routes by extension */
    const processFile = (file) => {
        if (!file) return;
        setIsProcessingFile(true);
        setProcessingError('');
        setOriginalText('');
        setImportedFileName(file.name);
        extractTextFromFile(file)
            .then(text => {
                setOriginalText(text);
            })
            .catch(err => {
                setProcessingError(err);
            })
            .finally(() => {
                setIsProcessingFile(false);
            });
    };

    const handleDownloadTxt = () => {
        const blob = new Blob([redactedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'redacted-text.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadKeyJson = () => {
        if (Object.keys(redactionMap).length === 0) { alert('No redactions performed yet.'); return; }
        const blob = new Blob([JSON.stringify(redactionMap, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'redaction-key.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadKeyCsv = () => {
        if (Object.keys(redactionMap).length === 0) { alert('No redactions performed yet.'); return; }
        let csvContent = 'Original,Replacement\n';
        Object.entries(redactionMap).forEach(([orig, rep]) => {
            const escapedOrig = orig.replace(/"/g, '""');
            const escapedRep = rep.replace(/"/g, '""');
            csvContent += `"${escapedOrig}","${escapedRep}"\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'redaction-key.csv';
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

    const renderAccordionSection = (title, isOpen, onToggle, children) => (
        <div style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left', outline: 'none'
                }}
            >
                <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>
                    {title}
                </span>
                <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground) / 0.7)', transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    ▶
                </span>
            </button>
            {isOpen && (
                <div style={{ padding: '0 20px 16px' }}>
                    {children}
                </div>
            )}
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // ── DASHBOARD VIEW ────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    if (currentView === 'dashboard') {
        return (
            <div style={{ minHeight: '100dvh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', position: 'relative' }}>
                {isDashboardProcessingFile && (
                    <div style={{ position: 'fixed', inset: 0, background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, gap: '16px' }}>
                        <Loader size={36} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--accent))' }} />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Extracting text…</p>
                            {dashboardImportedFileName && <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px' }}>{dashboardImportedFileName}</p>}
                        </div>
                    </div>
                )}
                <main style={{ margin: '0 auto', maxWidth: '720px', padding: '64px 24px', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }} className="animate-in">

                    {/* Theme toggle — top right */}
                    <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                        <button
                            id="theme-toggle"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            style={{ position: 'relative', padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', transition: 'background 0.15s, color 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
                                onClick={handleDashboardImportClick}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'transparent', color: 'hsl(var(--foreground))',
                                    border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '8px 14px',
                                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <Upload size={15} />
                                Import file
                            </button>
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
                            <input
                                ref={dashboardFileInputRef}
                                type="file"
                                onChange={handleDashboardFileUpload}
                                accept=".txt,.csv,.md,.docx,.pdf"
                                style={{ display: 'none' }}
                            />
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
                                        Create a project or import a file to start redacting. All data is stored locally in your browser.
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <button
                                            onClick={handleDashboardImportClick}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: 'transparent', color: 'hsl(var(--foreground))',
                                                border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '8px 14px',
                                                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Upload size={14} /> Import file
                                        </button>
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
                    {/* Segmented Layout Mode Controls */}
                    <div style={{ display: 'flex', background: 'hsl(var(--muted))', borderRadius: '6px', padding: '2px', border: '1px solid hsl(var(--border))' }} className="hidden sm:flex">
                        <button
                            onClick={() => setLayoutMode('stacked')}
                            title="Stacked Layout"
                            style={{
                                padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                background: layoutMode === 'stacked' ? 'hsl(var(--card))' : 'transparent',
                                color: layoutMode === 'stacked' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                boxShadow: layoutMode === 'stacked' ? '0 1px 3px hsl(0 0% 0% / 0.1)' : 'none'
                            }}
                        >
                            Stacked
                        </button>
                        <button
                            onClick={() => setLayoutMode('side-by-side')}
                            title="Side-by-side Layout"
                            style={{
                                padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                background: layoutMode === 'side-by-side' ? 'hsl(var(--card))' : 'transparent',
                                color: layoutMode === 'side-by-side' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                boxShadow: layoutMode === 'side-by-side' ? '0 1px 3px hsl(0 0% 0% / 0.1)' : 'none'
                            }}
                        >
                            Split View
                        </button>
                    </div>

                    <button
                        id="theme-toggle-editor"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        style={{ position: 'relative', padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
            <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }} className="animate-in">

                {/* ── Left: Controls ── */}
                <aside>
                    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--card))', overflow: 'hidden' }}>
                        
                        {/* Header */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--foreground))' }}>
                                <Shield size={14} style={{ color: 'hsl(var(--accent))' }} />
                                Text Controls
                            </h2>
                            <button
                                onClick={() => setIsEditingRawRules(!isEditingRawRules)}
                                style={{ background: 'transparent', border: 'none', color: 'hsl(var(--muted-foreground))', fontSize: '0.725rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s', textTransform: 'uppercase', letterSpacing: '0.03em' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--foreground))'}
                                onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                            >
                                {isEditingRawRules ? 'Visual Mode' : 'Raw Text'}
                            </button>
                        </div>

                        {/* Rules Body */}
                        {isEditingRawRules ? (
                            <div style={{ padding: '20px' }}>
                                <label htmlFor="wordsToRedact" style={{ display: 'block', fontSize: '0.725rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                    Raw Rules List
                                </label>
                                <textarea
                                    id="wordsToRedact"
                                    value={wordsToRedact}
                                    onChange={e => setWordsToRedact(e.target.value)}
                                    placeholder="word:replacement, another:***"
                                    style={{
                                        width: '100%', boxSizing: 'border-box', height: '150px',
                                        background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px', padding: '9px 12px', resize: 'none',
                                        fontSize: '0.8125rem', color: 'hsl(var(--foreground))',
                                        fontFamily: 'ui-monospace, monospace', outline: 'none', transition: 'border-color 0.15s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'hsl(var(--accent))'}
                                    onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                />
                                <p style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px', lineHeight: 1.5, margin: 0 }}>
                                    Format: <code style={{ fontFamily: 'ui-monospace, monospace' }}>pattern:replacement</code>. Separate with commas.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                
                                {/* Accordion 1: Configure Rules */}
                                {renderAccordionSection("Configure Rules", isConfigRulesOpen, () => setIsConfigRulesOpen(!isConfigRulesOpen), (
                                    <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                                        <select
                                            onChange={e => {
                                                const idx = parseInt(e.target.value, 10);
                                                if (!isNaN(idx) && idx >= 0) {
                                                    const t = RULE_TEMPLATES[idx];
                                                    setRulePattern(t.pattern);
                                                    setRuleReplacement(t.replacement);
                                                    setRuleIsRegex(t.isRegex);
                                                } else {
                                                    setRulePattern('');
                                                    setRuleReplacement('');
                                                    setRuleIsRegex(false);
                                                }
                                                e.target.value = "";
                                            }}
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))',
                                                borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem',
                                                color: 'hsl(var(--muted-foreground))', outline: 'none', transition: 'border-color 0.15s',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">-- Rule Template --</option>
                                            {RULE_TEMPLATES.map((t, idx) => (
                                                <option key={idx} value={idx}>{t.name}</option>
                                            ))}
                                        </select>

                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder={ruleIsRegex ? "Regex Pattern" : "Redact..."}
                                                value={rulePattern}
                                                onChange={e => setRulePattern(e.target.value)}
                                                style={{
                                                    flex: 1.2, minWidth: 0, boxSizing: 'border-box',
                                                    background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))',
                                                    borderRadius: '6px', padding: '8px 10px', fontSize: '0.8125rem',
                                                    color: 'hsl(var(--foreground))', outline: 'none', transition: 'border-color 0.15s',
                                                    fontFamily: ruleIsRegex ? 'ui-monospace, monospace' : 'inherit'
                                                }}
                                                onFocus={e => e.target.style.borderColor = 'hsl(var(--accent))'}
                                                onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setRuleIsRegex(v => !v)}
                                                title="Toggle Regular Expression"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '34px', height: '34px', borderRadius: '6px',
                                                    background: ruleIsRegex ? 'hsl(var(--accent) / 0.1)' : 'transparent',
                                                    border: '1px solid',
                                                    borderColor: ruleIsRegex ? 'hsl(var(--accent) / 0.3)' : 'hsl(var(--border))',
                                                    color: ruleIsRegex ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
                                                    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                                                    fontSize: '0.875rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace'
                                                }}
                                            >
                                                .*
                                            </button>
                                            <input
                                                type="text"
                                                placeholder="With..."
                                                value={ruleReplacement}
                                                onChange={e => setRuleReplacement(e.target.value)}
                                                style={{
                                                    flex: 1, minWidth: 0, boxSizing: 'border-box',
                                                    background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))',
                                                    borderRadius: '6px', padding: '8px 10px', fontSize: '0.8125rem',
                                                    color: 'hsl(var(--foreground))', outline: 'none', transition: 'border-color 0.15s'
                                                }}
                                                onFocus={e => e.target.style.borderColor = 'hsl(var(--accent))'}
                                                onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                            />
                                            <button
                                                type="submit"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '34px', height: '34px', borderRadius: '6px',
                                                    background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                                                    border: 'none', cursor: 'pointer', transition: 'opacity 0.15s', flexShrink: 0
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                            >
                                                <Plus size={15} />
                                            </button>
                                        </div>
                                    </form>
                                ))}

                                {/* Accordion 2: Active Rules (Visual Tag Cloud) */}
                                {renderAccordionSection(`Active Rules (${activeRules.length})`, isActiveRulesOpen, () => setIsActiveRulesOpen(!isActiveRulesOpen), (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '150px', overflowY: 'auto', paddingRight: '2px', paddingTop: '4px' }}>
                                        {activeRules.length === 0 ? (
                                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
                                                No active rules. Add one above!
                                            </span>
                                        ) : (
                                            activeRules.map((rule, idx) => {
                                                const isReg = rule.pattern.startsWith('/') && rule.pattern.endsWith('/') && rule.pattern.length > 2;
                                                return (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                            padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem',
                                                            background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))',
                                                            color: 'hsl(var(--foreground))', transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        {isReg && (
                                                            <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 3px', borderRadius: '3px', background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', lineHeight: 1 }}>
                                                                RE
                                                            </span>
                                                        )}
                                                        <strong style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }} title={rule.pattern}>{rule.pattern}</strong>
                                                        <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>:</span>
                                                        <span style={{ color: 'hsl(var(--accent))', fontFamily: 'ui-monospace, monospace', fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60px' }} title={rule.replacement}>{rule.replacement}</span>
                                                        <button
                                                            onClick={() => handleDeleteRule(rule.pattern)}
                                                            style={{ background: 'none', border: 'none', padding: 0, margin: '0 0 0 2px', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', width: '12px', height: '12px', transition: 'color 0.15s' }}
                                                            onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--destructive))'}
                                                            onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                );
                                            })
                                        )}
                                    </div>
                                ))}

                                {/* Accordion: PII Auto-Scanner */}
                                {renderAccordionSection("PII Auto-Scanner", isScannerOpen, () => setIsScannerOpen(!isScannerOpen), (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                                        <button
                                            type="button"
                                            onClick={handleScanText}
                                            disabled={isScanning || !originalText}
                                            style={{
                                                width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                                cursor: (!originalText || isScanning) ? 'not-allowed' : 'pointer', border: '1px solid hsl(var(--border))',
                                                background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
                                                opacity: (!originalText || isScanning) ? 0.6 : 1, transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={e => { if (originalText && !isScanning) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--background))'; }}
                                        >
                                            {isScanning ? (
                                                <>
                                                    <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                                    Scanning...
                                                </>
                                            ) : (
                                                <>
                                                    <Search size={12} />
                                                    Scan Document
                                                </>
                                            )}
                                        </button>

                                        {piiSuggestions.length > 0 && (
                                            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                                                        Found {piiSuggestions.length} sensitive patterns
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleAcceptAllSuggestions}
                                                        style={{ background: 'transparent', border: 'none', color: 'hsl(var(--accent))', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                                                    >
                                                        Accept All
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto', paddingRight: '2px' }}>
                                                    {piiSuggestions.map((sug, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'hsl(var(--muted) / 0.2)', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px', color: 'hsl(var(--foreground))' }} title={sug.pattern}>
                                                                    {sug.pattern}
                                                                </span>
                                                                <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))' }}>
                                                                    {sug.label} suggestion
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAcceptSuggestion(sug)}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    width: '20px', height: '20px', borderRadius: '4px', border: 'none',
                                                                    background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                                                                    cursor: 'pointer', fontSize: '0.75rem'
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!originalText && (
                                            <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', textAlign: 'center' }}>
                                                Add text to active document to scan.
                                            </span>
                                        )}
                                        {originalText && piiSuggestions.length === 0 && !isScanning && (
                                            piiHasScanned ? (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                                    background: 'hsl(142 71% 45% / 0.08)', border: '1px solid hsl(142 71% 45% / 0.2)',
                                                    borderRadius: '6px', padding: '8px 10px', color: 'hsl(142 71% 45%)', fontSize: '0.725rem', fontWeight: 600
                                                }}>
                                                    <span>✔ Scan complete. No sensitive patterns found!</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', textAlign: 'center' }}>
                                                    Scan to auto-detect emails, phones, credit cards.
                                                </span>
                                            )
                                        )}
                                    </div>
                                ))}

                                {/* Accordion 3: Advanced Options */}
                                {renderAccordionSection("Advanced Options", isOptionsOpen, () => setIsOptionsOpen(!isOptionsOpen), (
                                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                                        <button
                                            onClick={() => setIsCaseSensitive(v => !v)}
                                            title="Case Sensitive (Match exact casing of characters)"
                                            style={{
                                                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                                cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                                background: isCaseSensitive ? 'hsl(var(--accent) / 0.08)' : 'transparent',
                                                borderColor: isCaseSensitive ? 'hsl(var(--accent) / 0.3)' : 'hsl(var(--border))',
                                                color: isCaseSensitive ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'
                                            }}
                                        >
                                            <CaseSensitive size={13} />
                                            Match Case
                                        </button>
                                        <button
                                            onClick={() => setIsWholeWord(v => !v)}
                                            title="Whole Words Only (Avoid redacting parts of larger words)"
                                            style={{
                                                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                                                cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                                background: isWholeWord ? 'hsl(var(--accent) / 0.08)' : 'transparent',
                                                borderColor: isWholeWord ? 'hsl(var(--accent) / 0.3)' : 'hsl(var(--border))',
                                                color: isWholeWord ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'
                                            }}
                                        >
                                            <WholeWord size={13} />
                                            Whole Words
                                        </button>
                                    </div>
                                ))}

                            </div>
                        )}

                        {/* Stats Badges */}
                        <div style={{ background: 'hsl(var(--muted) / 0.2)', borderTop: '1px solid hsl(var(--border))', display: 'flex' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 8px', borderRight: '1px solid hsl(var(--border))' }}>
                                <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                                    Words Scanned
                                </span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: 'ui-monospace, monospace' }}>
                                    {scannedWords}
                                </span>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 8px' }}>
                                <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                                    Redacted
                                </span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: 'ui-monospace, monospace' }}>
                                    {matchesFound}
                                </span>
                            </div>
                        </div>

                    </div>
                </aside>

                {/* ── Right: Text panels ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: layoutMode === 'side-by-side' ? '1fr 1fr' : '1fr',
                    gap: '20px',
                    alignItems: 'start'
                }}>

                    {/* Original text */}
                    <div
                        style={{
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '10px', background: 'hsl(var(--card))',
                            position: 'relative'
                        }}
                    >
                        {/* Panel header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Original text</span>
                                {importedFileName && (
                                    <span style={{ fontSize: '0.6875rem', fontFamily: 'ui-monospace, monospace', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {importedFileName}
                                    </span>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', background: 'hsl(var(--muted))', borderRadius: '6px', padding: '2px', border: '1px solid hsl(var(--border))' }}>
                                <button
                                    onClick={() => setEditorMode('edit')}
                                    style={{
                                        padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                        background: editorMode === 'edit' ? 'hsl(var(--card))' : 'transparent',
                                        color: editorMode === 'edit' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                        boxShadow: editorMode === 'edit' ? '0 1px 3px hsl(0 0% 0% / 0.1)' : 'none'
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setEditorMode('highlight')}
                                    style={{
                                        padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                        background: editorMode === 'highlight' ? 'hsl(var(--card))' : 'transparent',
                                        color: editorMode === 'highlight' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                        boxShadow: editorMode === 'highlight' ? '0 1px 3px hsl(0 0% 0% / 0.1)' : 'none'
                                    }}
                                >
                                    Highlights
                                </button>
                            </div>
                        </div>

                        {editorMode === 'highlight' ? (
                            renderHighlightedOriginalText()
                        ) : (
                            <>
                                <textarea
                                    ref={textareaRef}
                                    value={originalText}
                                    onChange={e => { setOriginalText(e.target.value); setPiiHasScanned(false); if (!e.target.value) setImportedFileName(''); }}
                                    onMouseUp={handleTextareaSelection}
                                    onKeyUp={handleTextareaSelection}
                                    placeholder="Type or paste your content here..."
                                    style={{
                                        width: '100%', boxSizing: 'border-box', minHeight: '260px',
                                        background: 'transparent', border: 'none', outline: 'none',
                                        padding: '16px', resize: 'vertical', fontSize: '0.875rem',
                                        lineHeight: 1.65, color: 'hsl(var(--foreground))',
                                        fontFamily: 'inherit', borderRadius: '0 0 10px 10px',
                                        position: 'relative', zIndex: 1
                                    }}
                                />
                        {processingError && (
                            <p style={{ padding: '0 16px 12px', fontSize: '0.75rem', color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                ⚠ {processingError}
                            </p>
                        )}
                        {selectedText && (
                            <div
                                className="animate-scale-in"
                                style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    left: 0,
                                    right: 0,
                                    margin: '0 auto',
                                    width: 'max-content',
                                    maxWidth: 'calc(100% - 32px)',
                                    zIndex: 10,
                                    background: 'hsl(var(--card) / 0.95)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid hsl(var(--accent) / 0.3)',
                                    boxShadow: '0 8px 30px hsl(var(--accent) / 0.12)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                                    Redact <strong style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--accent) / 0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid hsl(var(--accent) / 0.2)', fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace' }}>{selectedText.length > 15 ? selectedText.slice(0, 15) + '...' : selectedText}</strong>?
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={handleAddSelectionAsRule}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 10px',
                                            background: 'hsl(var(--accent))',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'opacity 0.15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        <Plus size={12} />
                                        Add Rule
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedText('');
                                            if (textareaRef.current) {
                                                textareaRef.current.selectionStart = textareaRef.current.selectionEnd;
                                                textareaRef.current.focus();
                                            }
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '5px',
                                            color: 'hsl(var(--muted-foreground))',
                                            padding: '4px 8px',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                            </>
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
                                    { label: 'Export JSON Key', onClick: handleDownloadKeyJson, variant: 'outline', disabled: Object.keys(redactionMap).length === 0 },
                                    { label: 'Export CSV Key', onClick: handleDownloadKeyCsv, variant: 'outline', disabled: Object.keys(redactionMap).length === 0 },
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
                            dangerouslySetInnerHTML={{ __html: htmlRedactedText }}
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
