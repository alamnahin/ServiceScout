import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={cn(
                'prose prose-sm dark:prose-invert max-w-none',
                'prose-headings:text-foreground prose-headings:font-semibold',
                'prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4',
                'prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-3',
                'prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2',
                'prose-p:text-foreground prose-p:leading-7 prose-p:mb-3',
                'prose-a:text-primary hover:prose-a:underline prose-a:font-medium',
                'prose-strong:font-semibold prose-strong:text-foreground',
                'prose-em:text-muted-foreground prose-em:italic',
                'prose-code:text-primary prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm',
                'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto',
                'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4',
                'prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2',
                'prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2',
                'prose-li:text-foreground',
                'prose-hr:border-border prose-hr:my-6',
                'prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full',
                'prose-table:border-collapse prose-table:w-full prose-table:border prose-table:border-border',
                'prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-th:font-semibold',
                'prose-td:border prose-td:border-border prose-td:p-2',
                className
            )}
            components={{
                // Custom paragraph rendering with better spacing
                p: ({ node, ...props }) => <p className="mb-4 leading-7 text-foreground" {...props} />,

                // Custom link rendering
                a: ({ node, ...props }) => (
                    <a className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                ),

                // Custom heading rendering
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-5 mb-2 text-foreground" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />,

                // Custom list rendering
                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4 ml-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4 ml-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-foreground" {...props} />,

                // Custom code rendering
                code: ({ node, inline, ...props }: any) =>
                    inline ? (
                        <code className="bg-muted text-primary rounded px-1.5 py-0.5 font-mono text-sm" {...props} />
                    ) : (
                        <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto mb-4 text-sm font-mono">
                            <code {...props} />
                        </pre>
                    ),

                // Custom blockquote rendering
                blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4 py-2" {...props} />
                ),

                // Custom image rendering
                img: ({ node, ...props }) => (
                    <img className="rounded-lg shadow-md max-w-full h-auto my-4" {...props} />
                ),

                // Custom hr rendering
                hr: () => <hr className="border-border my-6" />,

                // Custom table rendering
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                        <table className="w-full border-collapse border border-border" {...props} />
                    </div>
                ),
                thead: ({ node, ...props }) => (
                    <thead className="bg-muted" {...props} />
                ),
                tbody: ({ node, ...props }) => (
                    <tbody {...props} />
                ),
                tr: ({ node, ...props }) => (
                    <tr className="border-b border-border hover:bg-muted/50" {...props} />
                ),
                th: ({ node, ...props }) => (
                    <th className="border border-border bg-muted px-4 py-2 text-left font-semibold text-foreground" {...props} />
                ),
                td: ({ node, ...props }) => (
                    <td className="border border-border px-4 py-2 text-foreground" {...props} />
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
