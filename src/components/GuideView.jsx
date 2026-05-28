import React from 'react';
import {
    Shield, FolderOpen, Settings, CaseSensitive, WholeWord,
    Search, Check, Type, FileCode, Clock, Download, ArrowLeft
} from 'lucide-react';

export default function GuideView({
    activeDocSection,
    setActiveDocSection,
    docSearchQuery,
    setDocSearchQuery,
    navigateToView
}) {
    const docSections = [
        {
            id: 'privacy',
            title: 'Privacy & Security',
            category: 'Core Architecture',
            icon: Shield,
            description: '100% sandboxed local execution model.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Privacy & Zero-Trust Security</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Redacta operates on a strictly <strong>zero-trust offline-first model</strong>. Since data compliance is critical when working with sensitive client records, this application guarantees that zero data is ever uploaded to external servers.
                    </p>
                    
                    <div style={{ background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Shield size={16} style={{ color: 'hsl(var(--accent))' }} />
                            Absolute Privacy Safeguards
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { title: 'Zero External APIs', desc: 'No cloud endpoints, telemetry checkers, or hidden AI wrappers are included in the build.' },
                                { title: 'Local Extraction', desc: 'Reading Word (.docx) and PDF files is performed on-device inside your browser thread using native JavaScript parsing.' },
                                { title: 'Persistent Sandboxes', desc: 'Projects are saved securely under your browser profile using IndexedDB, meaning data is persistent, offline-accessible, and fully sandboxed.' }
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'hsl(var(--accent))', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>•</span>
                                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                                        <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{item.title}:</strong> {item.desc}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'ingestion',
            title: 'Ingestion & Projects',
            category: 'Core Architecture',
            icon: FolderOpen,
            description: 'Import files on the dashboard and setup workspaces.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Dashboard Document Ingestion</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Redacta separates document ingestion from editor workspaces, placing a high-fidelity import zone directly on the home dashboard to keep the workspace clean and streamlined.
                    </p>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>Supported File Formats</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {[
                            { ext: '.pdf', desc: 'Portable Documents' },
                            { ext: '.docx', desc: 'Microsoft Word Docs' },
                            { ext: '.md', desc: 'Markdown Texts' },
                            { ext: '.csv', desc: 'Structured Data' },
                            { ext: '.txt', desc: 'Raw Plaintext' }
                        ].map((f, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.875rem' }}>
                                <span style={{ color: 'hsl(var(--accent))', fontWeight: 700 }}>•</span>
                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    <code style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '4px', padding: '2px 5px', fontSize: '0.85em', color: 'hsl(var(--foreground))', fontFamily: 'ui-monospace, monospace', marginRight: '6px' }}>{f.ext}</code> {f.desc}
                                </span>
                            </div>
                        ))}
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>Workspace Sandbox Mechanics</h4>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        When you drop a file on the homepage or click <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>Import File</strong>, Redacta extracts the text, creates a new database record, and loads a dedicated project editor workspace. This ensures you can switch between tasks without leaking state variables or pattern scan suggestions.
                    </p>
                </div>
            )
        },
        {
            id: 'controls',
            title: 'Rules & Matching Options',
            category: 'Redaction Power Tools',
            icon: Settings,
            description: 'Collapsible sidebar rules builder and advanced options.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Overhauled Rules Accordion Panel</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        The editor sidebar houses collapsible accordions to manage redaction rules without cluttering the main text interface:
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { title: 'Configure Rules', desc: 'A quick two-column builder where you define matching search patterns and custom replacements.' },
                            { title: 'Active Rules', desc: 'Visual tag cloud displaying active rules as pills with index-sorted, persistent HSL color identifiers. Click the × on any pill to instantly delete the rule.' },
                            { title: 'Edit Raw List', desc: 'Switchable plain-text toggle to edit rules as a fast comma-separated list.' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <span style={{ color: 'hsl(var(--accent))', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>•</span>
                                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{item.title}:</strong> {item.desc}
                                </span>
                            </div>
                        ))}
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>Advanced Text Matching Filters</h4>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Refine search parameters using native matching options equipped with descriptive explanations:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div style={{ padding: '20px', background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <CaseSensitive size={16} style={{ color: 'hsl(var(--accent))' }} />
                                <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--foreground))', fontWeight: 600 }}>Case Sensitive</strong>
                            </div>
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, display: 'block' }}>
                                Forces the redaction engine to respect exact letter casings. For example, "Alice" will not match "alice".
                            </span>
                        </div>

                        <div style={{ padding: '20px', background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <WholeWord size={16} style={{ color: 'hsl(var(--accent))' }} />
                                <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--foreground))', fontWeight: 600 }}>Whole Word</strong>
                            </div>
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, display: 'block' }}>
                                Ensures matching patterns only match standalone words, preventing partial matches (e.g., "cat" matching inside "catastrophe").
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'scanner',
            title: 'PII Auto-Scanner',
            category: 'Redaction Power Tools',
            icon: Search,
            description: 'Local algorithmic scan suggestions for sensitive metadata.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Algorithmic PII Pattern Extraction</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Redacta features a high-performance <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>PII Auto-Scanner</strong> that functions entirely on-device using local regular expression algorithms.
                    </p>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>Detected Pattern Categories</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {[
                            { label: 'Emails', example: 'client@company.com' },
                            { label: 'Credit Cards', example: '4111-2222-3333-4444' },
                            { label: 'Social Security (SSN)', example: '666-29-9999' },
                            { label: 'Phone Numbers', example: '+1 (555) 019-2834' }
                        ].map((p, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.875rem' }}>
                                <span style={{ color: 'hsl(var(--accent))', fontWeight: 700 }}>•</span>
                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginRight: '8px' }}>{p.label}:</strong>
                                    <code style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '4px', padding: '2px 5px', fontSize: '0.85em', color: 'hsl(var(--accent))', fontFamily: 'ui-monospace, monospace' }}>{p.example}</code>
                                </span>
                            </div>
                        ))}
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>One-Click Ingestion</h4>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        When you run a scan, matching records are grouped by category under the PII Scanner accordion. You can click the green <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>+</strong> button to ingest specific items as custom redaction rules, or click <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>Accept All</strong> to ingest all findings immediately.
                    </p>

                    <div style={{
                        background: 'hsl(142.1 70.6% 45.3% / 0.06)',
                        border: '1px solid hsl(142.1 70.6% 45.3% / 0.15)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'hsl(var(--foreground))',
                        boxSizing: 'border-box'
                    }}>
                        <Check size={16} style={{ color: 'hsl(142.1 76.2% 36.3%)', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.5, color: 'hsl(var(--muted-foreground))' }}><strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>No Matches Found State:</strong> A positive check banner appears if a scan resolves with zero sensitive matches.</span>
                    </div>
                </div>
            )
        },
        {
            id: 'selection',
            title: 'Click-to-Redact Mode',
            category: 'Redaction Power Tools',
            icon: Type,
            description: 'Floating glassmorphic text selection shortcuts.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Typing-Free Rule Creation</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Avoid manually typing redaction strings by selecting text directly inside the editor panel.
                    </p>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'hsl(var(--foreground))' }}>How it works</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    'Highlight any phrase inside the Original Text input card.',
                                    'A glassmorphic floating popover instantly displays directly above your cursor selection.',
                                    'Click the green + Add Rule trigger in the popover.',
                                    'The text is added immediately to your rules list with a generic redacting placeholder, triggering instant text update previews.'
                                ].map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                                        <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{
                            padding: '18px 24px',
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            alignSelf: 'center'
                        }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Selected:</span>
                            <span style={{ fontSize: '0.8125rem', background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>"Confidential Phrase"</span>
                            <button style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'default' }}>
                                + Redact
                            </button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'regex',
            title: 'Custom RegEx & Library',
            category: 'Redaction Power Tools',
            icon: FileCode,
            description: 'Custom slashed expressions and standard template libraries.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Regular Expression Compilation</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        For complex compliance rules, Redacta supports robust regular expressions.
                    </p>

                    <div style={{ background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'hsl(var(--foreground))' }}>RegEx Input Options</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { title: 'Manual Expressions', desc: 'Wrapping patterns in forward slashes (e.g. /[0-9]+/) signals the redaction engine to compile the input as a JavaScript regular expression pattern.' },
                                { title: 'Visual RegEx Toggle (.*)', desc: 'Toggle the regular expression switch inside the builder to automatically wrap entered search strings inside slash characters, compiling the input as a pattern.' },
                                { title: 'High-contrast "RE" Badges', desc: 'Slashed regular expression rules in your active rules cloud display an explicit high-contrast badge to keep matching expressions visually identifiable.' }
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'hsl(var(--accent))', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>•</span>
                                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                                        <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{item.title}:</strong> {item.desc}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>Template Library Dropdown</h4>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Access pre-built templates for common patterns directly in the rule configuration panel:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {[
                            { title: 'Email Format', pattern: '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/' },
                            { title: 'Phone Format', pattern: '/(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-\\s.]?\\d{3}[-\\s.]?\\d{4}/' },
                            { title: 'SSN Format', pattern: '/\\b\\d{3}-\\d{2}-\\d{4}\\b/' },
                            { title: 'Credit Cards', pattern: '/\\b\\d{4}[-.\\\\s]?\\d{4}[-.\\\\s]?\\d{4}[-.\\\\s]?\\d{4}\\b/' }
                        ].map((t, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.875rem' }}>
                                <span style={{ color: 'hsl(var(--accent))', fontWeight: 700 }}>•</span>
                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginRight: '8px' }}>{t.title}:</strong>
                                    <code style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '4px', padding: '2px 5px', fontSize: '0.85em', color: 'hsl(var(--accent))', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{t.pattern}</code>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'sequential',
            title: 'Sequential Placeholders',
            category: 'Redaction Power Tools',
            icon: Clock,
            description: 'Use sequence-aware tags to preserve document context.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Smart Sequence-Aware Indexing</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Replacing multiple different instances of sensitive patterns with identical static banners makes compliance files hard to read. Redacta solves this by providing sequential index count trackers.
                    </p>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>How to Use Sequence Indicators</h4>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        In corporate replacements, you can use either `[SEQ]` or `{"{#}"}`. When the engine replaces matches, it maintains an isolated counter for each rule and outputs sequential markers:
                    </p>

                    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                        <div style={{ padding: '20px', background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                                <span>Rule Pattern: <code>/Email/</code></span>
                                <span>Replacement: <code>[EMAIL_[SEQ]]</code></span>
                            </div>
                            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '12px', fontSize: '0.875rem' }}>
                                <p style={{ margin: '0 0 6px 0', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                                    Original text: <em>"Send to test@domain.com and copy hello@domain.com."</em>
                                </p>
                                <p style={{ margin: 0, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
                                    Redacted result: <em>"Send to <strong style={{ color: 'hsl(var(--accent))' }}>[EMAIL_1]</strong> and copy <strong style={{ color: 'hsl(var(--accent))' }}>[EMAIL_2]</strong>."</em>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'export',
            title: 'Compliance Key Export',
            category: 'Export & Layouts',
            icon: Download,
            description: 'Download original-to-replacement mapping keys locally.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Local Mapping Dictionaries</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        During text redaction, Redacta maintains an in-memory dictionary tracking exactly which original terms were replaced with what redacted values. This allows compliance auditors to audit modifications or reconstruct records offline.
                    </p>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>Supported Export Types</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div style={{ padding: '20px', background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--foreground))', display: 'block', marginBottom: '8px', fontWeight: 600 }}>JSON Mapping Log</strong>
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, display: 'block' }}>
                                Downloads a structured `.json` object mapping keys directly to replaced targets:
                                <pre style={{
                                    margin: '10px 0 0 0',
                                    padding: '12px',
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                    overflowX: 'auto',
                                    color: 'hsl(var(--foreground))'
                                }}>
                                    {"{\n  \"jane.doe@email.com\": \"[EMAIL_1]\",\n  \"555-019-2233\": \"[PHONE_1]\"\n}"}
                                </pre>
                            </span>
                        </div>

                        <div style={{ padding: '20px', background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--foreground))', display: 'block', marginBottom: '8px', fontWeight: 600 }}>CSV Spreadsheet</strong>
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, display: 'block' }}>
                                Downloads a standard `.csv` format spreadsheet loaded with `Original,Replacement` columns for fast compliance audits in Excel.
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'document-exports',
            title: 'Document Exports',
            category: 'Export & Layouts',
            icon: Download,
            description: 'Download sanitised text as PDF, Word, or plain text.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>High-Fidelity Document Formats</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Once redaction is complete, Redacta offers a suite of high-fidelity client-side document exports to download your sanitised output, preserving dynamic files names and offline execution.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { title: 'Multi-Page A4 PDF Engine', desc: 'Generates beautifully styled PDF documents in the browser. Lines wrap automatically, paragraph structure is preserved, and page breaks are dynamically calculated. Every page includes a top blue accent header line, brand watermark, active project name, and dynamic footer page numbering (Page X of Y).' },
                            { title: 'Pre-formatted Word Export (.docx)', desc: 'Compiles a fully XML-compliant Word HTML document envelope compatible with MS Office standards. Downloads with safe 1-inch margins, Arial/Calibri body text, 1.5 line spacing, and brand watermark headers. It opens natively as an editable document in Word, Google Docs, or Pages.' },
                            { title: 'Contextual OS Filenames', desc: 'Downloads are automatically named based on the active project. Spaces are replaced by underscores and illegal system symbols are stripped to keep your file systems pristine (e.g. HIPAA_Audit_2026_Sanitised.pdf).' },
                            { title: 'Modern Async Clipboard Copy', desc: 'Prioritizes the modern asynchronous navigator.clipboard API to copy text securely without warnings or layout distortions on mobile devices.' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <span style={{ color: 'hsl(var(--accent))', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>•</span>
                                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{item.title}:</strong> {item.desc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'splits',
            title: 'Previews & Dual Layouts',
            category: 'Export & Layouts',
            icon: WholeWord,
            description: 'Real-time HTML preview overlays and responsive widescreen grids.',
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Visual Highlight Previews</h3>
                    <p style={{ margin: 0, lineHeight: 1.75, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                        Redacta supports real-time highlight overlays to inspect matching records before finalizing:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { title: 'Highlight Mode', desc: 'Toggling the header switch swaps the editor input card textarea with a read-only sandboxed display highlighting matching rule structures with golden underlining.' },
                            { title: 'Rule Tooltips', desc: 'Hovering cursor targets over previews displays informative tooltips indicating which rule was triggered and what value it gets.' },
                            { title: 'Double-Pass Sandboxing', desc: 'Text is passed through standard HTML escaping helpers before highlighting, preventing malicious scripts or injection strings.' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <span style={{ color: 'hsl(var(--accent))', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>•</span>
                                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{item.title}:</strong> {item.desc}
                                </span>
                            </div>
                        ))}
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '8px 0 0 0', color: 'hsl(var(--foreground))' }}>Color-Coded Badging & Side-by-Side Splits</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div style={{ padding: '20px', background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--foreground))', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Color-Coded Output</strong>
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, display: 'block' }}>
                                Matching elements inside the output preview card are surrounded by colored borders, mapped sequentially to HSL color channels by rule index. This helps locate targets in large documents.
                            </span>
                        </div>

                        <div style={{ padding: '20px', background: 'hsl(var(--muted) / 0.25)', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--foreground))', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Widescreen Split Grid</strong>
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, display: 'block' }}>
                                Toggle the <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>Split View</strong> in the workspace header to lay out the Input and Sanitised cards side-by-side in a responsive double-column grid, making direct comparisons seamless.
                            </span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const filteredSections = docSections.filter(s =>
        s.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(docSearchQuery.toLowerCase())
    );

    const activeSectionData = docSections.find(s => s.id === activeDocSection) || docSections[0];

    return (
        <div style={{ minHeight: '100dvh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', display: 'flex', flexDirection: 'column' }} className="animate-in">
            {/* Header */}
            <header style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'hsl(var(--foreground))' }}>Redacta</span>
                        <span style={{ color: 'hsl(var(--muted-foreground) / 0.4)', fontSize: '0.875rem' }}>/</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Guide</span>
                    </div>
                    <button
                        onClick={() => navigateToView('dashboard')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))',
                            border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px 12px',
                            fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--border))'}
                        onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--secondary))'}
                    >
                        <ArrowLeft size={14} />
                        Back to Dashboard
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', minHeight: 'calc(100dvh - 58px)', boxSizing: 'border-box' }} className="flex-row p-[12px] sm:p-[24px] gap-[12px] sm:gap-[24px] md:gap-[32px]">
                {/* Sidebar navigation */}
                <aside style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }} className="w-[50px] sm:w-[220px] md:w-[280px]">
                    {/* Search in guide */}
                    <div style={{ position: 'relative' }} className="hidden sm:block">
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search guide..."
                            value={docSearchQuery}
                            onChange={e => setDocSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 10px 8px 32px', fontSize: '0.8125rem',
                                background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))',
                                borderRadius: '6px', color: 'hsl(var(--foreground))',
                                outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={e => {
                                e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.2)';
                                e.currentTarget.style.boxShadow = '0 0 0 2px hsl(var(--ring) / 0.15)';
                            }}
                            onBlur={e => {
                                e.currentTarget.style.borderColor = 'hsl(var(--border))';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Navigation List grouped by Category */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }} className="max-h-[calc(100dvh-120px)] pr-[4px]">
                        {['Core Architecture', 'Redaction Power Tools', 'Export & Layouts'].map((cat, i) => {
                            const items = filteredSections.filter(s => s.category === cat);
                            if (items.length === 0) return null;
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {i > 0 && <div className="block sm:hidden h-[1px] bg-border my-[6px]" />}
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', padding: '0 8px 4px' }} className="hidden sm:block">
                                        {cat}
                                    </span>
                                    {items.map(item => {
                                        const NavIcon = item.icon;
                                        const isActive = item.id === activeDocSection;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveDocSection(item.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                    padding: '8px 10px', background: isActive ? 'hsl(var(--muted))' : 'transparent',
                                                    border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer',
                                                    transition: 'background 0.15s', color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'
                                                }}
                                                className="justify-center sm:justify-start"
                                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)'; }}
                                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <NavIcon size={14} style={{ color: isActive ? 'hsl(var(--accent))' : 'inherit', flexShrink: 0 }} />
                                                <div style={{ minWidth: 0 }} className="hidden sm:block">
                                                    <div style={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 500 }}>{item.title}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        {filteredSections.length === 0 && (
                            <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '24px 0' }}>
                                No guide entries found for "{docSearchQuery}"
                            </div>
                        )}
                    </div>
                </aside>

                {/* Content pane */}
                <main style={{ flex: 1, minWidth: 0, paddingLeft: '8px' }}>
                    <div style={{
                        position: 'relative',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        padding: 0
                    }} className="animate-scale-in">
                        <div style={{ marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--accent))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {activeSectionData.category}
                            </span>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))' }}>
                                {activeSectionData.title}
                            </h2>
                        </div>
                        <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.5 }}>
                            {activeSectionData.description}
                        </p>
                        <div style={{ height: '1px', background: 'hsl(var(--border))', margin: '4px 0 12px 0' }}></div>
                        
                        {activeSectionData.content}
                    </div>
                </main>
            </div>
        </div>
    );
}
