import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Upload, Download, FileText, Settings, Type,
    CaseSensitive, WholeWord, Loader, FileDown,
    Plus, Search, Trash2, ArrowLeft, Shield, Check,
    ChevronRight, ChevronDown, FolderOpen, Clock, Sun, Moon,
    HelpCircle, BookOpen, Sparkles, FileCode, Info
} from 'lucide-react';
import { getAllProjects, saveProject, deleteProject } from './db';
import ProjectRow from './components/ProjectRow';
import GuideView from './components/GuideView';

// ── Helpers ──────────────────────────────────────────────────────────────────

const RULE_TEMPLATES = [
    { name: 'Email Regex', pattern: '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/', replacement: '[EMAIL_[SEQ]]', isRegex: true },
    { name: 'Phone Regex', pattern: '/(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-\\s.]?\\d{3}[-\\s.]?\\d{4}/', replacement: '[PHONE_[SEQ]]', isRegex: true },
    { name: 'Credit Card Regex', pattern: '/\\b\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}\\b/', replacement: '[CARD_[SEQ]]', isRegex: true },
    { name: 'SSN Regex', pattern: '/\\b\\d{3}-\\d{2}-\\d{4}\\b/', replacement: '[SSN_[SEQ]]', isRegex: true },
];

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
    const [activeDocSection, setActiveDocSection] = useState('privacy');
    const [docSearchQuery, setDocSearchQuery] = useState('');
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);

    // ── Routing & Navigation Helper ──────────────────────────────────────────
    const navigateToView = (viewName, projectId = null) => {
        if (viewName === 'guide') {
            window.history.pushState(null, '', '/guide');
            setCurrentView('guide');
        } else if (viewName === 'dashboard') {
            window.history.pushState(null, '', '/');
            setCurrentView('dashboard');
            setActiveProjectId(null);
        } else if (viewName === 'editor') {
            window.history.pushState(null, '', '/');
            setCurrentView('editor');
            if (projectId) setActiveProjectId(projectId);
        }
    };

    // Listen to browser history navigation (back/forward buttons)
    useEffect(() => {
        const handleLocationChange = () => {
            const path = window.location.pathname;
            if (path === '/guide') {
                setCurrentView('guide');
            } else {
                if (activeProjectId) {
                    setCurrentView('editor');
                } else {
                    setCurrentView('dashboard');
                }
            }
        };

        handleLocationChange();

        window.addEventListener('popstate', handleLocationChange);
        return () => {
            window.removeEventListener('popstate', handleLocationChange);
        };
    }, [activeProjectId]);

    // ── Editor state ──────────────────────────────────────────────────────────
    const [originalText, setOriginalText] = useState('');
    const [redactedText, setRedactedText] = useState('');
    const [wordsToRedact, setWordsToRedact] = useState('');
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isWholeWord, setIsWholeWord] = useState(true);
    const [scannedWords, setScannedWords] = useState(0);
    const [matchesFound, setMatchesFound] = useState(0);
    const [lastCopied, setLastCopied] = useState(null);
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
    const redactedTextScrollRef = useRef(null);
    const downloadDropdownRef = useRef(null);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);

    // ── Dashboard UI state ────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'alphabetical'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isDashboardProcessingFile, setIsDashboardProcessingFile] = useState(false);
    const [dashboardImportedFileName, setDashboardImportedFileName] = useState('');
    const dashboardFileInputRef = useRef(null);

    // ── SEO & Page Metadata Management (Option A) ────────────────────────────
    useEffect(() => {
        let title = 'Redacta';
        let description = 'Securely sanitise documents, redact sensitive PII (emails, phone numbers, credit cards), and apply custom regex replacement rules offline in your browser.';

        if (currentView === 'dashboard') {
            title = 'Redacta - Safe Local Document Redaction & Sanitisation';
            description = 'Your zero-trust sandbox to securely sanitize documents, redact private details, and manage local files fully offline.';
        } else if (currentView === 'editor') {
            const activeProject = projects.find(p => p.id === activeProjectId);
            const projName = activeProject ? activeProject.name : 'Document';
            title = `Redacta Editor - ${projName}`;
            description = `Sanitise and redact sensitive data from "${projName}" using client-side algorithmic scanners, sequential placeholders, and click-to-redact rules.`;
        } else if (currentView === 'guide') {
            const docSectionNames = {
                'privacy': 'Privacy & Zero-Trust Security',
                'ingestion': 'Document Ingestion & Workspaces',
                'controls': 'Visual Rules & Settings Toggles',
                'scanner': 'Client-Side PII Auto-Scanner',
                'selection': 'Click-to-Redact Highlight Selection',
                'regex': 'Custom RegEx Patterns & Templates',
                'sequential': 'Smart Sequential Placeholders',
                'export': 'Redaction Key Map Exports',
                'document-exports': 'High-Fidelity Document & Key Exports',
                'splits': 'Scroll-Synchronized Split View & Layouts',
            };
            const sectionName = docSectionNames[activeDocSection] || 'User Guide';
            title = `Redacta Guide - ${sectionName}`;
            description = `Step-by-step documentation on ${sectionName.toLowerCase()} and safe local data sanitisation workflows in Redacta.`;
        }

        // Update document title
        document.title = title;

        // Update document meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description);
    }, [currentView, activeProjectId, projects, activeDocSection]);

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

    // ── Dropdown click outside listener ───────────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(e.target)) {
                setIsDownloadOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Synchronize scrolling in side-by-side view ────────────────────────────
    useEffect(() => {
        if (layoutMode !== 'side-by-side') return;

        const origEl = textareaRef.current;
        const redEl = redactedTextScrollRef.current;
        if (!origEl || !redEl) return;

        let activeScrollSource = null;

        const handleOrigScroll = () => {
            if (activeScrollSource && activeScrollSource !== 'orig') return;
            activeScrollSource = 'orig';
            
            const maxScrollOrig = origEl.scrollHeight - origEl.clientHeight;
            if (maxScrollOrig > 0) {
                const percentage = origEl.scrollTop / maxScrollOrig;
                const maxScrollRed = redEl.scrollHeight - redEl.clientHeight;
                redEl.scrollTop = percentage * maxScrollRed;
            }
            activeScrollSource = null;
        };

        const handleRedScroll = () => {
            if (activeScrollSource && activeScrollSource !== 'red') return;
            activeScrollSource = 'red';
            
            const maxScrollRed = redEl.scrollHeight - redEl.clientHeight;
            if (maxScrollRed > 0) {
                const percentage = redEl.scrollTop / maxScrollRed;
                const maxScrollOrig = origEl.scrollHeight - origEl.clientHeight;
                origEl.scrollTop = percentage * maxScrollOrig;
            }
            activeScrollSource = null;
        };

        origEl.addEventListener('scroll', handleOrigScroll, { passive: true });
        redEl.addEventListener('scroll', handleRedScroll, { passive: true });

        return () => {
            origEl.removeEventListener('scroll', handleOrigScroll);
            redEl.removeEventListener('scroll', handleRedScroll);
        };
    }, [layoutMode, editorMode, originalText, redactedText]);

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
                    htmlText = htmlText.replace(re, () => {
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
        navigateToView('editor', proj.id);
    };

    const handleDeleteProject = async (id, e) => {
        e.stopPropagation();
        await deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        if (activeProjectId === id) { navigateToView('dashboard'); }
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

            const fileType = file.name.split('.').pop().toLowerCase();
            const proj = {
                id: Date.now().toString(),
                name: projName,
                originalText: text,
                wordsToRedact: '',
                isCaseSensitive: false,
                isWholeWord: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                fileType,
                fileName: file.name
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
                <div
                    ref={textareaRef}
                    style={{
                        padding: '16px',
                        fontSize: '0.875rem',
                        lineHeight: 1.65,
                        color: 'hsl(var(--foreground))',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        height: layoutMode === 'side-by-side' ? '500px' : 'auto',
                        minHeight: layoutMode === 'side-by-side' ? '500px' : '260px',
                        maxHeight: layoutMode === 'side-by-side' ? '500px' : '400px',
                        overflowY: 'auto',
                        boxSizing: 'border-box'
                    }}
                >
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
                ref={textareaRef}
                style={{
                    padding: '16px',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    color: 'hsl(var(--foreground))',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    height: layoutMode === 'side-by-side' ? '500px' : 'auto',
                    minHeight: layoutMode === 'side-by-side' ? '500px' : '260px',
                    maxHeight: layoutMode === 'side-by-side' ? '500px' : '400px',
                    overflowY: 'auto',
                    boxSizing: 'border-box'
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
                    } catch {
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


    const getSanitizedProjectName = () => {
        const activeProject = projects.find(p => p.id === activeProjectId);
        const name = activeProject?.name || 'Redacted';
        return name.trim().replace(/[^a-zA-Z0-9_-]/g, '_').replace(/__+/g, '_');
    };

    const handleDownloadTxt = () => {
        if (!redactedText || redactedText.trim() === '') {
            alert('No redacted text to export.');
            return;
        }
        const blob = new Blob([redactedText], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${getSanitizedProjectName()}_Sanitised.txt`;
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadKeyJson = () => {
        if (Object.keys(redactionMap).length === 0) { alert('No redactions performed yet.'); return; }
        const blob = new Blob([JSON.stringify(redactionMap, null, 2)], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${getSanitizedProjectName()}_Redaction_Key.json`;
        const a = document.createElement('a'); a.href = url; a.download = filename;
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
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${getSanitizedProjectName()}_Redaction_Key.csv`;
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadDocx = () => {
        if (!redactedText || redactedText.trim() === '') {
            alert('No redacted text to export.');
            return;
        }
        const activeProject = projects.find(p => p.id === activeProjectId);
        const projTitle = activeProject?.name ? activeProject.name.toUpperCase() : 'DOCUMENT';
        
        // Build MS Word compatible styled HTML envelope
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>Sanitised Document</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page {
                        size: 8.5in 11in;
                        margin: 1.0in 1.0in 1.0in 1.0in;
                        mso-header-margin: .5in;
                        mso-footer-margin: .5in;
                    }
                    body {
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        font-size: 11pt;
                        line-height: 1.6;
                        color: #1f2937;
                    }
                    .header-line {
                        font-size: 8.5pt;
                        color: #4b5563;
                        border-bottom: 2px solid #0066f2;
                        padding-bottom: 6px;
                        margin-bottom: 24px;
                        font-family: 'Arial', sans-serif;
                    }
                    .header-title {
                        font-weight: bold;
                        color: #111827;
                    }
                    .footer-line {
                        font-size: 8.5pt;
                        color: #9ca3af;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 8px;
                        margin-top: 48px;
                        font-family: 'Arial', sans-serif;
                    }
                    p {
                        margin-top: 0px;
                        margin-bottom: 12px;
                        text-align: justify;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body>
                <div class="header-line">
                    <span class="header-title">REDACTA</span> &nbsp;&bull;&nbsp; SANITISED DOCUMENT &nbsp;&bull;&nbsp; ${projTitle}
                </div>
                
                ${redactedText.split('\n').map(para => {
                    const trimmed = para.replace(/\r/g, '');
                    return `<p>${trimmed || '&nbsp;'}</p>`;
                }).join('')}
                
                <div class="footer-line">
                    Confidential &nbsp;&bull;&nbsp; Processed locally by Redacta Client
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${getSanitizedProjectName()}_Sanitised.doc`;
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        if (!window.jspdf) { alert('PDF library not loaded yet.'); return; }
        if (!redactedText || redactedText.trim() === '') {
            alert('No redacted text to export.');
            return;
        }
        setIsGeneratingPdf(true);
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Set default font
            pdf.setFont('Helvetica', 'normal');
            
            // Split paragraphs to preserve structure
            const paragraphs = redactedText.split('\n');
            const leftMargin = 20;
            const rightMargin = 20;
            const topMargin = 25; // below the top header
            const bottomMargin = 20; // above the bottom footer
            const printableWidth = 210 - leftMargin - rightMargin; // 170mm
            const pageHeight = 297;
            const maxY = pageHeight - bottomMargin; // 277mm
            const lineHeight = 6.2; // spacing between text lines
            const paragraphSpacing = 3.5; // spacing between paragraphs
            
            pdf.setFontSize(10.5);
            pdf.setTextColor(31, 41, 55); // #1f2937 - charcoal gray

            let yPosition = topMargin;

            paragraphs.forEach((para) => {
                const cleanPara = para.replace(/\r/g, '');
                // Handle empty lines (paragraph break)
                if (cleanPara.trim() === '') {
                    yPosition += paragraphSpacing;
                    return;
                }

                // Split paragraph into wrapped lines
                const lines = pdf.splitTextToSize(cleanPara, printableWidth);
                
                lines.forEach((line) => {
                    // Check if we need a page break
                    if (yPosition + lineHeight > maxY) {
                        pdf.addPage();
                        yPosition = topMargin;
                    }
                    pdf.text(line, leftMargin, yPosition);
                    yPosition += lineHeight;
                });
                
                // Add a small paragraph spacing
                yPosition += paragraphSpacing - lineHeight; // compensate for last line's increment
                if (yPosition < topMargin) {
                    yPosition = topMargin; // keep boundary
                }
            });

            // Second pass: Draw brand headers, footers, pagination
            const totalPages = pdf.internal.getNumberOfPages();
            const activeProject = projects.find(p => p.id === activeProjectId);
            const projTitle = activeProject?.name ? activeProject.name.toUpperCase() : 'DOCUMENT';

            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                
                // Header accent line (Brand Accent blue: rgb(0, 102, 242))
                pdf.setDrawColor(0, 102, 242);
                pdf.setLineWidth(0.6);
                pdf.line(20, 14, 190, 14);
                
                // Header texts
                pdf.setFont('Helvetica', 'bold');
                pdf.setFontSize(8.5);
                pdf.setTextColor(17, 24, 39); // #111827
                pdf.text('REDACTA', 20, 10.5);
                
                pdf.setFont('Helvetica', 'normal');
                pdf.setTextColor(107, 114, 128); // #6b7280
                pdf.text('•  SANITIZED DOCUMENT', 38, 10.5);
                
                pdf.setFontSize(8.5);
                pdf.text(projTitle, 190, 10.5, { align: 'right' });
                
                // Footer accent line (Muted border: rgb(229, 231, 235))
                pdf.setDrawColor(229, 231, 235);
                pdf.setLineWidth(0.2);
                pdf.line(20, 281, 190, 281);
                
                // Footer text
                pdf.setFontSize(8);
                pdf.setTextColor(156, 163, 175); // #9ca3af
                pdf.text('Confidential  |  Processed locally by Redacta Client', 20, 286.5);
                pdf.text(`Page ${i} of ${totalPages}`, 190, 286.5, { align: 'right' });
            }

            const filename = `${getSanitizedProjectName()}_Sanitised.pdf`;
            pdf.save(filename);
        } catch (e) {
            console.error('Error generating PDF:', e);
            alert('Error generating PDF.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleCopy = (text, type) => {
        if (!text) return;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setLastCopied(type);
                    setTimeout(() => setLastCopied(null), 2000);
                })
                .catch(err => {
                    console.error('Async clipboard copy failed, falling back:', err);
                    fallbackCopy(text, type);
                });
        } else {
            fallbackCopy(text, type);
        }
    };

    const fallbackCopy = (text, type) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.width = '2em';
        ta.style.height = '2em';
        ta.style.padding = '0';
        ta.style.border = 'none';
        ta.style.outline = 'none';
        ta.style.boxShadow = 'none';
        ta.style.background = 'transparent';
        document.body.appendChild(ta);
        ta.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                setLastCopied(type);
                setTimeout(() => setLastCopied(null), 2000);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(ta);
    };

    // ── Filtered & Sorted projects ────────────────────────────────────────────
    const getSortedProjects = () => {
        const sorted = projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.originalText.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (sortBy === 'recent') {
            sorted.sort((a, b) => b.updatedAt - a.updatedAt);
        } else if (sortBy === 'alphabetical') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        }
        return sorted;
    };

    const filtered = getSortedProjects();

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

                    {/* Top right actions */}
                    <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => navigateToView('guide')}
                            aria-label="User Guide"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', border: '1px solid hsl(var(--border))',
                                borderRadius: '6px', background: 'transparent', cursor: 'pointer',
                                fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))',
                                transition: 'background 0.15s, color 0.15s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)';
                                e.currentTarget.style.color = 'hsl(var(--foreground))';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                            }}
                            title="Documentation"
                        >
                            <HelpCircle size={15} style={{ color: 'hsl(var(--accent))' }} />
                            <span>User Guide</span>
                        </button>
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

                        {/* Search & Sort */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    style={{
                                        background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px', padding: '8px 12px',
                                        fontSize: '0.8125rem', color: 'hsl(var(--foreground))',
                                        outline: 'none', cursor: 'pointer',
                                        transition: 'border-color 0.15s',
                                        colorScheme: 'dark light'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'hsl(var(--accent))'}
                                    onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                >
                                    <option value="recent">Recently updated</option>
                                    <option value="alphabetical">A-Z</option>
                                </select>
                            </div>
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
    // ── GUIDE VIEW ────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    if (currentView === 'guide') {
        return (
            <GuideView
                activeDocSection={activeDocSection}
                setActiveDocSection={setActiveDocSection}
                docSearchQuery={docSearchQuery}
                setDocSearchQuery={setDocSearchQuery}
                navigateToView={navigateToView}
            />
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
                            onClick={() => navigateToView('dashboard')}
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
                                        width: '100%', boxSizing: 'border-box',
                                        height: layoutMode === 'side-by-side' ? '500px' : 'auto',
                                        minHeight: layoutMode === 'side-by-side' ? '500px' : '260px',
                                        maxHeight: layoutMode === 'side-by-side' ? '500px' : 'none',
                                        background: 'transparent', border: 'none', outline: 'none',
                                        padding: '16px', resize: layoutMode === 'side-by-side' ? 'none' : 'vertical', fontSize: '0.875rem',
                                        lineHeight: 1.65, color: 'hsl(var(--foreground))',
                                        fontFamily: 'inherit', borderRadius: '0 0 10px 10px',
                                        position: 'relative', zIndex: 1, overflowY: 'auto'
                                    }}
                                />

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
                                {/* Copy Button */}
                                <button
                                    onClick={() => handleCopy(redactedText, 'redacted')}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '5px 10px', border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 500,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        background: lastCopied === 'redacted' ? 'hsl(var(--background))' : 'hsl(var(--background))',
                                        color: lastCopied === 'redacted' ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
                                        borderColor: lastCopied === 'redacted' ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--border))'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--background))'}
                                >
                                    {lastCopied === 'redacted' ? <Check size={12} /> : null}
                                    {lastCopied === 'redacted' ? 'Copied!' : 'Copy'}
                                </button>

                                {/* Unified Download Dropdown */}
                                <div ref={downloadDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                                    <button
                                        onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '5px 12px', border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            background: 'hsl(var(--primary))',
                                            color: 'hsl(var(--primary-foreground))',
                                            borderColor: 'transparent'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--primary) / 0.85)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--primary))'}
                                    >
                                        <Download size={12} />
                                        <span>Download</span>
                                        <ChevronDown size={12} style={{ opacity: 0.8, transform: isDownloadOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                                    </button>
                                    
                                    {isDownloadOpen && (
                                        <div
                                            className="animate-scale-in"
                                            style={{
                                                position: 'absolute', right: 0, marginTop: '6px',
                                                width: '200px', background: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))', borderRadius: '8px',
                                                boxShadow: '0 10px 30px hsl(0 0% 0% / 0.1)', zIndex: 30,
                                                padding: '6px 0', boxSizing: 'border-box'
                                            }}
                                        >
                                            <div style={{ padding: '6px 12px 4px 12px', fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Documents
                                            </div>
                                            <button
                                                onClick={() => { handleDownloadTxt(); setIsDownloadOpen(false); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                    padding: '8px 12px', background: 'transparent', border: 'none',
                                                    fontSize: '0.8125rem', color: 'hsl(var(--foreground))', textAlign: 'left',
                                                    cursor: 'pointer', boxSizing: 'border-box', transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FileText size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                <span>Plain Text (.txt)</span>
                                            </button>
                                            <button
                                                onClick={() => { handleDownloadDocx(); setIsDownloadOpen(false); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                    padding: '8px 12px', background: 'transparent', border: 'none',
                                                    fontSize: '0.8125rem', color: 'hsl(var(--foreground))', textAlign: 'left',
                                                    cursor: 'pointer', boxSizing: 'border-box', transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FileText size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                <span>Word Document (.docx)</span>
                                            </button>
                                            <button
                                                onClick={() => { handleDownloadPdf(); setIsDownloadOpen(false); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                    padding: '8px 12px', background: 'transparent', border: 'none',
                                                    fontSize: '0.8125rem', color: 'hsl(var(--foreground))', textAlign: 'left',
                                                    cursor: 'pointer', boxSizing: 'border-box', transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FileDown size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                <span>PDF Document (.pdf)</span>
                                            </button>
                                            
                                            <div style={{ height: '1px', background: 'hsl(var(--border))', margin: '6px 0' }}></div>
                                            
                                            <div style={{ padding: '6px 12px 4px 12px', fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Compliance Keys
                                            </div>
                                            <button
                                                onClick={() => { handleDownloadKeyJson(); setIsDownloadOpen(false); }}
                                                disabled={Object.keys(redactionMap).length === 0}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                    padding: '8px 12px', background: 'transparent', border: 'none',
                                                    fontSize: '0.8125rem', color: 'hsl(var(--foreground))', textAlign: 'left',
                                                    cursor: Object.keys(redactionMap).length === 0 ? 'not-allowed' : 'pointer', boxSizing: 'border-box', transition: 'background 0.15s',
                                                    opacity: Object.keys(redactionMap).length === 0 ? 0.5 : 1
                                                }}
                                                onMouseEnter={e => { if (Object.keys(redactionMap).length > 0) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FileCode size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                <span>JSON Key Map</span>
                                            </button>
                                            <button
                                                onClick={() => { handleDownloadKeyCsv(); setIsDownloadOpen(false); }}
                                                disabled={Object.keys(redactionMap).length === 0}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                    padding: '8px 12px', background: 'transparent', border: 'none',
                                                    fontSize: '0.8125rem', color: 'hsl(var(--foreground))', textAlign: 'left',
                                                    cursor: Object.keys(redactionMap).length === 0 ? 'not-allowed' : 'pointer', boxSizing: 'border-box', transition: 'background 0.15s',
                                                    opacity: Object.keys(redactionMap).length === 0 ? 0.5 : 1
                                                }}
                                                onMouseEnter={e => { if (Object.keys(redactionMap).length > 0) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FileText size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                <span>CSV Key Spreadsheet</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div
                            ref={redactedTextScrollRef}
                            id="redacted-output-content"
                            style={{
                                height: layoutMode === 'side-by-side' ? '500px' : 'auto',
                                minHeight: layoutMode === 'side-by-side' ? '500px' : '260px',
                                maxHeight: layoutMode === 'side-by-side' ? '500px' : 'none',
                                padding: '16px', fontSize: '0.875rem', lineHeight: 1.65,
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowY: 'auto',
                                color: 'hsl(var(--foreground))', boxSizing: 'border-box'
                            }}
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
