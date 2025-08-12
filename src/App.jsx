import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, FileText, Settings, Type, CaseSensitive, WholeWord, Clock, Loader, FileType } from 'lucide-react';

// Helper component for Stat Cards
const StatCard = ({ title, value, icon, bgColor }) => (
    <div className={`${bgColor} px-6 py-4 rounded-lg shadow-md flex items-center justify-between text-white`}>
        <div>
            <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-white/60">
            {icon}
        </div>
    </div>
);

// Main Application Component
const App = () => {
    // STATE MANAGEMENT
    // ----------------
    const [originalText, setOriginalText] = useState("Hello world! You can contact me at test@example.com or call 555-123-4567. The UI is now simpler and more focused.");
    const [redactedText, setRedactedText] = useState("");
    const [wordsToRedact, setWordsToRedact] = useState("world:planet, test@example.com:[EMAIL_REDACTED], 555-123-4567");

    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isWholeWord, setIsWholeWord] = useState(true);

    const [scannedWords, setScannedWords] = useState(0);
    const [matchesFound, setMatchesFound] = useState(0);
    const [lastCopied, setLastCopied] = useState(null);

    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [processingError, setProcessingError] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);


    // Load external libraries on mount
    useEffect(() => {
        const loadScript = (src, id) => { if (!document.getElementById(id)) { const script = document.createElement('script'); script.src = src; script.id = id; document.body.appendChild(script); }};
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js", "mammoth-js");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js", "pdf-js");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf-js");
    }, []);

    // CORE REDACTION LOGIC
    // --------------------------------------------------------
    const performRedaction = useCallback(() => {
        if (!originalText) { setRedactedText(""); setScannedWords(0); setMatchesFound(0); return; }
        let currentRedactedText = originalText;
        let totalMatches = 0;
        const redactionPairs = wordsToRedact.split(',').map(pairStr => { const parts = pairStr.split(':'); const pattern = (parts[0] || '').trim(); const replacement = parts.length > 1 ? parts.slice(1).join(':').trim() : '***'; return { pattern, replacement }; }).filter(p => p.pattern.length > 0);
        
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
                } catch (error) { console.error("Invalid Regex:", error); }
            });
        }
        
        setRedactedText(currentRedactedText);
        setScannedWords(originalText.trim().split(/\s+/).filter(Boolean).length);
        setMatchesFound(totalMatches);
    }, [originalText, wordsToRedact, isCaseSensitive, isWholeWord]);

    useEffect(() => { performRedaction(); }, [performRedaction]);
    
    // FILE & CLIPBOARD HANDLERS
    // -------------------------
    const handleFileUpload = (event) => { const file = event.target.files[0]; if (!file) return; setIsProcessingFile(true); setProcessingError(''); setOriginalText(''); const reader = new FileReader(); if (file.name.endsWith('.docx')) { reader.onload = (e) => processDocx(e.target.result); reader.readAsArrayBuffer(file); } else if (file.name.endsWith('.pdf')) { reader.onload = (e) => processPdf(e.target.result); reader.readAsArrayBuffer(file); } else { reader.onload = (e) => { setOriginalText(e.target.result); setIsProcessingFile(false); }; reader.readAsText(file); } event.target.value = null; };
    const processDocx = (arrayBuffer) => { if (!window.mammoth) { setProcessingError("DOCX library not loaded yet. Please try again."); setIsProcessingFile(false); return; } window.mammoth.extractRawText({ arrayBuffer }).then(result => { setOriginalText(result.value); setIsProcessingFile(false); }).catch(err => { console.error("DOCX processing error:", err); setProcessingError("Could not read the .docx file."); setIsProcessingFile(false); }); };
    const processPdf = async (arrayBuffer) => { if (!window.pdfjsLib) { setProcessingError("PDF library not loaded yet. Please try again."); setIsProcessingFile(false); return; } window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`; try { const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise; let fullText = ''; for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const textContent = await page.getTextContent(); fullText += textContent.items.map(item => item.str).join(' ') + '\n'; } setOriginalText(fullText); } catch (err) { console.error("PDF processing error:", err); setProcessingError("Could not read the .pdf file."); } finally { setIsProcessingFile(false); } };
    
    const handleDownloadTxt = () => {
        const blob = new Blob([redactedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'redacted-text.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
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
            // Split text into lines that fit the PDF page width
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

    // RENDER METHOD
    // ------------------------------------------
    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="py-8 text-center"><h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Redactr</h1><p className="text-gray-500 mt-2">A Modern, Client-Side Text Redaction Tool</p></header>
                <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
                    <div className="lg:col-span-1 lg:sticky lg:top-8 space-y-8 m-4 lg:mt-0">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-700"><Settings className="mr-2 text-gray-400"/>Controls</h2>
                            <div className="space-y-5">
                                <div><label htmlFor="wordsToRedact" className="block text-sm font-medium text-gray-600 mb-1">Words & Replacements</label><textarea id="wordsToRedact" value={wordsToRedact} onChange={(e) => setWordsToRedact(e.target.value)} className="w-full h-24 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Format: word:replacement, pattern:new_text, another_word"/><p className="text-xs text-gray-400 mt-1">Use `pattern:replacement`. If no replacement is given, `***` is used.</p></div>
                                <div className="flex items-center justify-between pt-2"><label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-600"><input type="checkbox" checked={isCaseSensitive} onChange={() => setIsCaseSensitive(!isCaseSensitive)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><CaseSensitive size={16}/><span>Case Sensitive</span></label><label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-600"><input type="checkbox" checked={isWholeWord} onChange={() => setIsWholeWord(!isWholeWord)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><WholeWord size={16}/><span>Whole Word</span></label></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                           <StatCard title="Words Scanned" value={scannedWords} bgColor="bg-green-500" icon={<FileText size={40}/>} />
                           <StatCard title="Matches Found" value={matchesFound} bgColor="bg-blue-500" icon={<Type size={40}/>} />
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-8 m-4 mt-8 lg:mt-0">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col relative" style={{minHeight: '40vh'}}>
                            {isProcessingFile && ( <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-lg"><Loader className="animate-spin text-blue-500" size={48} /><p className="mt-4 text-gray-600">Processing your file...</p></div> )}
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-xl font-semibold text-gray-700">Original Text</h2><div className="flex items-center space-x-2"><label htmlFor="file-upload" className="cursor-pointer bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-md transition border border-gray-300 inline-flex items-center"><Upload size={16} className="mr-2"/><span>Upload File</span></label><input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.csv,.docx,.pdf" /></div></div>
                            <textarea value={originalText} onChange={(e) => setOriginalText(e.target.value)} className="w-full flex-grow p-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none" placeholder="Paste text or upload a file..."/>
                            {processingError && <p className="text-red-500 text-sm mt-2">{processingError}</p>}
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col relative" style={{minHeight: '40vh'}}>
                             {isGeneratingPdf && ( <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-lg"><Loader className="animate-spin text-blue-500" size={48} /><p className="mt-4 text-gray-600">Generating PDF...</p></div> )}
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-xl font-semibold text-gray-700">Redacted Output</h2><div className="flex items-center space-x-2">
                                <button onClick={handleDownloadTxt} className="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-md transition border border-gray-300 inline-flex items-center"><Download size={16} className="mr-2"/><span>.txt</span></button>
                                <button onClick={handleDownloadPdf} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition inline-flex items-center" disabled={isGeneratingPdf}><FileType size={16} className="mr-2"/><span>Download as PDF</span></button>
                                <button onClick={() => handleCopyToClipboard(redactedText, 'redacted')} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition">{lastCopied === 'redacted' ? 'Copied!' : 'Copy'}</button>
                            </div></div>
                            <div id="redacted-output-content" className="w-full flex-grow p-3 bg-gray-50 border border-gray-200 rounded-md overflow-y-auto whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: redactedText }}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
