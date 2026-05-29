"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders agent replies, which come back as Markdown (**bold**, lists,
 * headings, tables, code…). Without this they showed raw `**`/`#` symbols.
 *
 * Styling is done with per-element Tailwind classes (no typography plugin) so
 * it matches the dark theme and stays readable inside the chat bubble.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-brand-300 underline underline-offset-2 hover:text-brand-100"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-1 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          h1: ({ children }) => (
            <h1 className="mt-2 mb-1 text-base font-bold text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-2 mb-1 text-base font-semibold text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2 mb-1 text-sm font-semibold text-white">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brand-300/40 pl-3 text-white/70">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = (className ?? "").includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-ink-900/70 p-3 font-mono text-xs text-brand-100">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-ink-900/70 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-1">{children}</pre>,
          hr: () => <hr className="my-2 border-white/10" />,
          table: ({ children }) => (
            <div className="my-1 overflow-x-auto">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-white/10 px-2 py-1 text-left font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-white/10 px-2 py-1 align-top">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
