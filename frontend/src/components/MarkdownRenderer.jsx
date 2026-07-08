import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

function InlineCode({ children }) {
  return (
    <code className="rounded bg-gray-800 px-1.5 py-0.5 text-sm font-mono text-blue-400">
      {children}
    </code>
  );
}

function CodeBlock({ className, children }) {
  const codeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  if (!className?.includes('language-')) {
    return <InlineCode>{children}</InlineCode>;
  }

  const handleCopy = async () => {
    const text = codeRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-4">
      <pre className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-4">
        <code ref={codeRef} className={className}>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 opacity-0 transition-opacity hover:bg-gray-600 group-hover:opacity-100"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function CustomLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
      {children}
    </a>
  );
}

function CustomBlockquote({ children }) {
  return (
    <blockquote className="my-4 border-l-4 border-purple-500 pl-4 italic text-gray-500">
      {children}
    </blockquote>
  );
}

function CustomTable({ children }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-300">{children}</table>
    </div>
  );
}

function CustomTableHeader({ children }) {
  return (
    <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  );
}

function CustomTableCell({ children }) {
  return (
    <td className="border border-gray-300 px-3 py-2">{children}</td>
  );
}

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children }) => <>{children}</>,
        code: CodeBlock,
        a: CustomLink,
        blockquote: CustomBlockquote,
        table: CustomTable,
        th: CustomTableHeader,
        td: CustomTableCell,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
