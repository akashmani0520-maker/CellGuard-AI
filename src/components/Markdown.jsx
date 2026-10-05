import MarkdownRenderer from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Shared GitHub-flavoured Markdown + LaTeX renderer used by both the
// CellGuard Copilot chat and the generative-AI report cards.
export default function Markdown({ content, className = "" }) {
  return (
    <div className={"text-sm leading-relaxed text-slate-100 " + className}>
      <MarkdownRenderer
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-slate-200 italic">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-bold text-white mt-4 mb-2 first:mt-0">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="text-[15px] font-bold text-white mt-5 mb-2 border-b border-slate-700 pb-1 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => <h3 className="text-sm font-semibold text-cyan-200 mt-3 mb-1.5 first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-200 mt-3 mb-1 first:mt-0">{children}</h4>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 marker:text-cyan-400">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 marker:text-cyan-400">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed my-1 [&>ul]:my-1 [&>ol]:my-1">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-cyan-500/40 pl-3 my-2 text-slate-300">{children}</blockquote>
          ),
          hr: () => <hr className="border-slate-700 my-3" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-slate-700">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-800/60 text-slate-200">{children}</thead>,
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-left font-semibold border-b border-slate-700 whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => <td className="px-2.5 py-1.5 border-b border-slate-800 text-slate-300 align-top">{children}</td>,
          code: ({ children, className: cls }) =>
            cls ? (
              <code className={"block font-mono text-xs " + cls}>{children}</code>
            ) : (
              <code className="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950/70 p-3 my-2 text-xs text-slate-200">{children}</pre>
          ),
        }}
      >
        {content || ""}
      </MarkdownRenderer>
    </div>
  );
}