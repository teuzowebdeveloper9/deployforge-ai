function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[0.9em] text-cyan-100">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function normalizeMarkdown(content: string) {
  const trimmed = content.trim();
  const fencedMarkdown = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return fencedMarkdown ? fencedMarkdown[1] : content;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = normalizeMarkdown(content).split("\n");
  const blocks: JSX.Element[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-3 space-y-1.5 pl-1">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-slate-300">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  function flushCode() {
    if (codeLines.length === 0) return;
    blocks.push(
      <pre key={`code-${blocks.length}`} className="my-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-5 text-cyan-50">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
    codeLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      flushList();
      const text = line.replace(/^#{1,3}\s+/, "");
      blocks.push(
        <h3 key={`heading-${blocks.length}`} className="mb-2 mt-4 text-base font-semibold text-white">
          {renderInline(text)}
        </h3>
      );
      continue;
    }
    if (/^([-*]|\d+\.)\s+/.test(line)) {
      listItems.push(line.replace(/^([-*]|\d+\.)\s+/, ""));
      continue;
    }
    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-2 break-words leading-6 text-slate-300">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  flushCode();

  return <div className="max-w-none overflow-visible break-words text-sm">{blocks}</div>;
}
