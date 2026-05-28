import React, { useState, useEffect, useCallback } from 'react';
import { 
    Upload, Download, FileText, Settings, Type, 
    CaseSensitive, WholeWord, Clock, Loader, FileType, 
    Plus, Search, Trash2, ArrowLeft, Shield, Check, FileDown
} from 'lucide-react';
import { getAllProjects, saveProject, deleteProject } from './db';

// Helper component for Stat Cards
const StatCard = ({ title, value, icon, bgColor }) => (
    <div className={`${bgColor} px-6 py-4 rounded-xl shadow-sm flex items-center justify-between text-white transition-all duration-300 hover:scale-[1.02]`}>
        <div>
            <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-white/40">
            {icon}
        </div>
    </div>
);

// Main Application Component
const App = () => {
    // STATE MANAGEMENT
    // ----------------
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'editor'
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    
    // Editor State (mirrors active project)
    const [originalText, setOriginalText] = useState("");
    const [redactedText, setRedactedText] = useState("");
    const [wordsToRedact, setWordsToRedact] = useState("");
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isWholeWord, setIsWholeWord] = useState(true);

    const [scannedWords, setScannedWords] = useState(0);
    const [matchesFound, setMatchesFound] = useState(0);
    const [lastCopied, setLastCopied] = useState(null);

    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [processingError, setProcessingError] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Dashboard UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Load external libraries on mount
    useEffect(() => {
        const loadScript = (src, id) => { 
            if (!document.getElementById(id)) { 
                const script = document.createElement('script'); 
                script.src = src; 
                script.id = id; 
                document.body.appendChild(script); 
            }
        };
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js", "mammoth-js");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js", "pdf-js");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf-js");
    }, []);

    // Load projects from IndexedDB on startup
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const list = await getAllProjects();
                setProjects(list);
            } catch (err) {
                console.error("Failed to load projects:", err);
            }
        };
        fetchProjects();
    }, []);

    // CORE REDACTION LOGIC
    // --------------------------------------------------------
    const performRedaction = useCallback(() => {
        if (!originalText) { 
            setRedactedText(""); 
            setScannedWords(0); 
            setMatchesFound(0); 
            return; 
        }
        let currentRedactedText = originalText;
        let totalMatches = 0;
        const redactionPairs = wordsToRedact.split(',').map(pairStr => { 
            const parts = pairStr.split(':'); 
            const pattern = (parts[0] || '').trim(); 
            const replacement = parts.length > 1 ? parts.slice(1).join(':').trim() : '***'; 
            return { pattern, replacement }; 
        }).filter(p => p.pattern.length > 0);
        
        if (redactionPairs.length > 0) {
            redactionPairs.forEach(({ pattern, replacement }) => {
                try {
                    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const flags = isCaseSensitive ? 'g' : 'gi';
                    const regexPattern = isWholeWord ? `\\b${escapedPattern}\\b` : escapedPattern;
                    const regex = new RegExp(regexPattern, flags);
                    const wordMatches = currentRedactedText.match(regex);
                    if (wordMatches) totalMatches += wordMatches.length;
                    currentRedactedText = currentRedactedText.replace(regex, replacement);
                } catch (error) { 
                    console.error("Invalid Regex:", error); 
                }
            });
        }
        
        setRedactedText(currentRedactedText);
        setScannedWords(originalText.trim().split(/\s+/).filter(Boolean).length);
        setMatchesFound(totalMatches);
    }, [originalText, wordsToRedact, isCaseSensitive, isWholeWord]);

    useEffect(() => { 
        performRedaction(); 
    }, [performRedaction]);

    // DEBOUNCED AUTOSAVE EFFECT
    // -------------------------
    useEffect(() => {
        if (!activeProjectId) return;

        const triggerAutoSave = () => {
            setIsSaving(true);
            setProjects(prev => {
                const activeProj = prev.find(p => p.id === activeProjectId);
                if (!activeProj) {
                    setIsSaving(false);
                    return prev;
                }

                const updatedProj = {
                    ...activeProj,
                    originalText,
                    wordsToRedact,
                    isCaseSensitive,
                    isWholeWord,
                    updatedAt: Date.now()
                };

                saveProject(updatedProj)
                    .catch(err => console.error("Failed to auto-save project:", err))
                    .finally(() => {
                        setTimeout(() => setIsSaving(false), 300);
                    });

                return prev.map(p => p.id === activeProjectId ? updatedProj : p);
            });
        };

        const timer = setTimeout(() => {
            triggerAutoSave();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [originalText, wordsToRedact, isCaseSensitive, isWholeWord, activeProjectId]);
    
    // PROJECT LIFECYCLE MANAGEMENT
    // ----------------------------
    const suggestDefaultName = () => {
        let maxNum = 0;
        projects.forEach(p => {
            const match = p.name.match(/^Untitled Project #(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        return `Untitled Project #${maxNum + 1}`;
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const finalName = newProjectName.trim() || suggestDefaultName();
        const newProj = {
            id: Date.now().toString(),
            name: finalName,
            originalText: "Hello world! You can contact me at test@example.com or call 555-123-4567. The UI is now simpler and more focused.",
            wordsToRedact: "world:planet, test@example.com:[EMAIL_REDACTED], 555-123-4567",
            isCaseSensitive: false,
            isWholeWord: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        try {
            await saveProject(newProj);
            setProjects(prev => [newProj, ...prev]);
            
            // Set active state & transition
            setActiveProjectId(newProj.id);
            setOriginalText(newProj.originalText);
            setWordsToRedact(newProj.wordsToRedact);
            setIsCaseSensitive(newProj.isCaseSensitive);
            setIsWholeWord(newProj.isWholeWord);
            
            setNewProjectName('');
            setIsCreateModalOpen(false);
            setCurrentView('editor');
        } catch (err) {
            console.error("Failed to create project:", err);
        }
    };

    const handleOpenProject = (project) => {
        setActiveProjectId(project.id);
        setOriginalText(project.originalText);
        setWordsToRedact(project.wordsToRedact);
        setIsCaseSensitive(project.isCaseSensitive);
        setIsWholeWord(project.isWholeWord);
        setCurrentView('editor');
    };

    const handleDeleteProject = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            if (activeProjectId === id) {
                setActiveProjectId(null);
                setCurrentView('dashboard');
            }
        } catch (err) {
            console.error("Failed to delete project:", err);
        }
    };

    const formatTimeAgo = (timestamp) => {
        const diffMs = Date.now() - timestamp;
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return 'Just now';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDays = Math.floor(diffHr / 24);
        return `${diffDays}d ago`;
    };

    // FILE & CLIPBOARD HANDLERS
    // -------------------------
    const handleFileUpload = (event) => { 
        const file = event.target.files[0]; 
        if (!file) return; 
        setIsProcessingFile(true); 
        setProcessingError(''); 
        setOriginalText(''); 
        const reader = new FileReader(); 
        if (file.name.endsWith('.docx')) { 
            reader.onload = (e) => processDocx(e.target.result); 
            reader.readAsArrayBuffer(file); 
        } else if (file.name.endsWith('.pdf')) { 
            reader.onload = (e) => processPdf(e.target.result); 
            reader.readAsArrayBuffer(file); 
        } else { 
            reader.onload = (e) => { 
                setOriginalText(e.target.result); 
                setIsProcessingFile(false); 
            }; 
            reader.readAsText(file); 
        } 
        event.target.value = null; 
    };

    const processDocx = (arrayBuffer) => { 
        if (!window.mammoth) { 
            setProcessingError("DOCX library not loaded yet. Please try again."); 
            setIsProcessingFile(false); 
            return; 
        } 
        window.mammoth.extractRawText({ arrayBuffer }).then(result => { 
            setOriginalText(result.value); 
            setIsProcessingFile(false); 
        }).catch(err => { 
            console.error("DOCX processing error:", err); 
            setProcessingError("Could not read the .docx file."); 
            setIsProcessingFile(false); 
        }); 
    };

    const processPdf = async (arrayBuffer) => { 
        if (!window.pdfjsLib) { 
            setProcessingError("PDF library not loaded yet. Please try again."); 
            setIsProcessingFile(false); 
            return; 
        } 
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`; 
        try { 
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise; 
            let fullText = ''; 
            for (let i = 1; i <= pdf.numPages; i++) { 
                const page = await pdf.getPage(i); 
                const textContent = await page.getTextContent(); 
                fullText += textContent.items.map(item => item.str).join(' ') + '\n'; 
            } 
            setOriginalText(fullText); 
        } catch (err) { 
            console.error("PDF processing error:", err); 
            setProcessingError("Could not read the .pdf file."); 
        } finally { 
            setIsProcessingFile(false); 
        } 
    };
    
    const handleDownloadTxt = () => {
        const blob = new Blob([redactedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = 'redacted-text.txt';
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        if (!window.jspdf) {
            alert("PDF generation library is not loaded yet. Please try again in a moment.");
            return;
        }
        setIsGeneratingPdf(true);
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            const lines = pdf.splitTextToSize(redactedText, 180);
            pdf.text(lines, 10, 10);
            pdf.save('redacted-document.pdf');
        } catch(err) {
            console.error("Error generating PDF:", err);
            alert("An error occurred while generating the PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleCopyToClipboard = (textToCopy, type) => { 
        const textArea = document.createElement("textarea"); 
        textArea.value = textToCopy; 
        document.body.appendChild(textArea); 
        textArea.select(); 
        try { 
            document.execCommand('copy'); 
            setLastCopied(type); 
            setTimeout(() => setLastCopied(null), 2000); 
        } catch (err) { 
            console.error('Failed to copy text: ', err); 
        } 
        document.body.removeChild(textArea); 
    };

    // FILTERED PROJECTS FOR SEARCH
    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.originalText.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // RENDER METHOD
    // ------------------------------------------
    if (currentView === 'dashboard') {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen text-slate-800 font-sans">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    
                    {/* Header Banner */}
                    <header className="flex flex-col md:flex-row items-center justify-between mb-12 pb-6 border-b border-slate-200/60">
                        <div className="flex items-center space-x-3 mb-6 md:mb-0">
                            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl shadow-md text-white">
                                <Shield size={28} className="animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">Redacta</h1>
                                <p className="text-slate-500 text-sm font-medium">Safe client-side data sanitization</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-200 flex items-center space-x-2 active:scale-95 cursor-pointer"
                        >
                            <Plus size={18} />
                            <span>Create New Project</span>
                        </button>
                    </header>

                    {/* Stats & Search */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search projects by name or content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-sm font-semibold text-slate-600">Local DB Status: Ready</span>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-medium">Total Projects</span>
                            <span className="text-xl font-bold text-slate-700">{projects.length}</span>
                        </div>
                    </div>

                    {/* Project Listings Grid */}
                    {filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map((project) => {
                                const rulesCount = project.wordsToRedact.split(',').filter(r => r.trim()).length;
                                return (
                                    <div 
                                        key={project.id}
                                        onClick={() => handleOpenProject(project)}
                                        className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer p-6 flex flex-col justify-between group relative overflow-hidden"
                                    >
                                        {/* Subtle top indicator hover line */}
                                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-violet-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                                        
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{project.name}</h3>
                                                <button 
                                                    onClick={(e) => handleDeleteProject(project.id, e)}
                                                    className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Project"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 mb-4">
                                                <Clock size={12} />
                                                <span>{formatTimeAgo(project.updatedAt)}</span>
                                            </p>
                                            <p className="text-slate-600 text-sm line-clamp-3 mb-6 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                                {project.originalText || <span className="italic text-slate-400">Empty project content.</span>}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                {rulesCount} {rulesCount === 1 ? 'rule' : 'rules'}
                                            </span>
                                            <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                                                <span>Open workspace</span>
                                                <span>→</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm backdrop-blur-md">
                            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No projects found</h3>
                            <p className="text-slate-500 text-sm mb-8">
                                {searchQuery ? "We couldn't find any matches for your query." : "Get started by creating a new redaction workspace for your documents."}
                            </p>
                            <button 
                                onClick={() => {
                                    if (searchQuery) setSearchQuery('');
                                    setIsCreateModalOpen(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md transition cursor-pointer inline-flex items-center space-x-2"
                            >
                                <Plus size={16} />
                                <span>{searchQuery ? "Clear Search & Create" : "Create First Project"}</span>
                            </button>
                        </div>
                    )}

                    {/* Create Project Modal */}
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-all duration-300">
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Create New Project</h3>
                                    <p className="text-slate-500 text-sm mb-6">Enter a name for your redaction project. You can change this later.</p>
                                    
                                    <form onSubmit={handleCreateProject} className="space-y-5">
                                        <div>
                                            <label htmlFor="projectName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Project Name</label>
                                            <input 
                                                id="projectName"
                                                type="text"
                                                autoFocus
                                                placeholder={suggestDefaultName()}
                                                value={newProjectName}
                                                onChange={(e) => setNewProjectName(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                            />
                                        </div>
                                        
                                        <div className="flex space-x-3 pt-3">
                                            <button 
                                                type="button"
                                                onClick={() => { setIsCreateModalOpen(false); setNewProjectName(''); }}
                                                className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl text-slate-600 transition cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-md cursor-pointer"
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
            </div>
        );
    }

    // Editor View
    return (
        <div className="bg-slate-50 text-slate-800 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* Editor Header */}
                <header className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-200/60 gap-4">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setCurrentView('dashboard')}
                            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shadow-sm"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                {projects.find(p => p.id === activeProjectId)?.name}
                            </h1>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Workspace</span>
                                <span className="text-slate-300">•</span>
                                {isSaving ? (
                                    <span className="inline-flex items-center text-indigo-500 text-xs font-semibold">
                                        <Loader className="animate-spin mr-1" size={12} />
                                        <span>Saving to DB...</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-emerald-500 text-xs font-semibold">
                                        <Check size={12} className="mr-1" />
                                        <span>Autosaved offline</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
                    
                    {/* Controls Sidebar */}
                    <div className="lg:col-span-1 lg:sticky lg:top-8 space-y-6 mb-8 lg:mb-0">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                            <h2 className="text-lg font-bold mb-4 flex items-center text-slate-700">
                                <Settings className="mr-2 text-slate-400" size={18} />
                                <span>Controls</span>
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="wordsToRedact" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Words & Replacements</label>
                                    <textarea 
                                        id="wordsToRedact" 
                                        value={wordsToRedact} 
                                        onChange={(e) => setWordsToRedact(e.target.value)} 
                                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm" 
                                        placeholder="Format: word:replacement, pattern:new_text, another_word"
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-relaxed">
                                        Use `pattern:replacement`. Separate with commas. If no replacement is provided, `***` is used.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <label className="flex items-center space-x-2 cursor-pointer text-sm font-semibold text-slate-600 select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={isCaseSensitive} 
                                            onChange={() => setIsCaseSensitive(!isCaseSensitive)} 
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <CaseSensitive size={16} className="text-slate-400" />
                                        <span>Case Sensitive</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer text-sm font-semibold text-slate-600 select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={isWholeWord} 
                                            onChange={() => setIsWholeWord(!isWholeWord)} 
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <WholeWord size={16} className="text-slate-400" />
                                        <span>Whole Word</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                           <StatCard title="Words Scanned" value={scannedWords} bgColor="bg-emerald-500" icon={<FileText size={32}/>} />
                           <StatCard title="Matches Found" value={matchesFound} bgColor="bg-indigo-500" icon={<Type size={32}/>} />
                        </div>
                    </div>

                    {/* Text Workspace */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Original Text Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col relative" style={{minHeight: '40vh'}}>
                            {isProcessingFile && ( 
                                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-2xl backdrop-blur-xs">
                                    <Loader className="animate-spin text-indigo-500 mb-3" size={48} />
                                    <p className="text-slate-600 font-semibold">Processing your file...</p>
                                </div> 
                            )}
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h2 className="text-lg font-bold text-slate-700">Original Text</h2>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="file-upload" className="cursor-pointer bg-white hover:bg-slate-50 text-slate-600 font-semibold py-2 px-4 rounded-xl transition border border-slate-200 inline-flex items-center shadow-xs text-sm">
                                        <Upload size={14} className="mr-2"/>
                                        <span>Upload File</span>
                                    </label>
                                    <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.csv,.docx,.pdf" />
                                </div>
                            </div>
                            <textarea 
                                value={originalText} 
                                onChange={(e) => setOriginalText(e.target.value)} 
                                className="w-full flex-grow p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm leading-relaxed" 
                                placeholder="Paste text or upload a file..."
                            />
                            {processingError && <p className="text-red-500 text-xs font-semibold mt-2">{processingError}</p>}
                        </div>
                        
                        {/* Redacted Output Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col relative" style={{minHeight: '40vh'}}>
                            {isGeneratingPdf && ( 
                                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-2xl backdrop-blur-xs">
                                    <Loader className="animate-spin text-indigo-500 mb-3" size={48} />
                                    <p className="text-slate-600 font-semibold">Generating PDF...</p>
                                </div> 
                            )}
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h2 className="text-lg font-bold text-slate-700">Sanitized Output</h2>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={handleDownloadTxt} 
                                        className="bg-white hover:bg-slate-50 text-slate-600 font-semibold py-2 px-4 rounded-xl transition border border-slate-200 inline-flex items-center shadow-xs text-sm cursor-pointer"
                                    >
                                        <Download size={14} className="mr-2"/>
                                        <span>.txt</span>
                                    </button>
                                    <button 
                                        onClick={handleDownloadPdf} 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl transition inline-flex items-center shadow-md text-sm cursor-pointer" 
                                        disabled={isGeneratingPdf}
                                    >
                                        <FileDown size={14} className="mr-2"/>
                                        <span>Download PDF</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCopyToClipboard(redactedText, 'redacted')} 
                                        className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-xl transition shadow-sm text-sm cursor-pointer"
                                    >
                                        {lastCopied === 'redacted' ? 'Copied!' : 'Copy Text'}
                                    </button>
                                </div>
                            </div>
                            <div 
                                id="redacted-output-content" 
                                className="w-full flex-grow p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed" 
                                dangerouslySetInnerHTML={{ __html: redactedText }}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
