import React, { useState } from 'react';
import { Clock, Trash2, ChevronRight, FileDown, FileText, FileCode } from 'lucide-react';

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

export default function ProjectRow({ project, onOpen, onDelete }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const rulesCount = project.wordsToRedact.split(',').filter(r => r.trim()).length;

    // Dynamic icon based on file type
    const getProjectIcon = () => {
        const type = (project.fileType || '').toLowerCase();
        if (type === 'pdf') return FileDown;
        if (type === 'docx' || type === 'doc') return FileText;
        if (type === 'csv') return FileText;
        if (type === 'md' || type === 'markdown') return FileCode;
        if (type === 'txt') return FileText;

        const fileName = (project.fileName || '').toLowerCase();
        if (fileName.endsWith('.pdf')) return FileDown;
        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return FileText;
        if (fileName.endsWith('.csv')) return FileText;
        if (fileName.endsWith('.md')) return FileCode;
        if (fileName.endsWith('.txt')) return FileText;

        return FileText; // Default fallback icon
    };

    const ProjectIcon = getProjectIcon();

    return (
        <div
            onClick={onOpen}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border px-4 py-5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer first:rounded-t-lg last:rounded-b-lg last:border-b-0"
            style={{ backgroundColor: 'hsl(var(--card) / 0.2)' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <ProjectIcon
                    size={16}
                    style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0, transition: 'color 0.15s' }}
                    className="group-hover:text-foreground"
                />
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(var(--foreground))', display: 'inline-block', verticalAlign: 'middle' }} className="max-w-[160px] sm:max-w-[320px]">
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
