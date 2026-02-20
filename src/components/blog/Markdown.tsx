import React, { useMemo } from "react";

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string };

function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.trim().startsWith("```")) {
      const fence = line.trim();
      i += 1;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      // consume closing fence if present
      if (i < lines.length && lines[i].trim().startsWith("```")) i += 1;
      blocks.push({ type: "code", code: buf.join("\n") });
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length as 1 | 2 | 3;
      blocks.push({ type: "h", level, text: h[2].trim() });
      i += 1;
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraphs (merge consecutive non-empty lines)
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }

    const p: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim().length > 0) {
      // stop before lists/headings/fences
      if (
        lines[i].trim().startsWith("```") ||
        lines[i].match(/^(#{1,3})\s+/) ||
        lines[i].match(/^\s*[-*]\s+/) ||
        lines[i].match(/^\s*\d+\.\s+/)
      ) {
        break;
      }
      p.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "p", text: p.join(" ") });
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode {
  // Very small inline parser: `code` and [text](url)
  const parts: React.ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const codeIdx = remaining.indexOf("`");
    const linkIdx = remaining.indexOf("[");

    const nextIdx =
      codeIdx === -1
        ? linkIdx
        : linkIdx === -1
          ? codeIdx
          : Math.min(codeIdx, linkIdx);

    if (nextIdx === -1) {
      parts.push(remaining);
      break;
    }

    if (nextIdx > 0) {
      parts.push(remaining.slice(0, nextIdx));
      remaining = remaining.slice(nextIdx);
      continue;
    }

    // inline code
    if (remaining.startsWith("`")) {
      const end = remaining.indexOf("`", 1);
      if (end > 1) {
        const code = remaining.slice(1, end);
        parts.push(
          <code
            key={parts.length}
            className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800"
          >
            {code}
          </code>
        );
        remaining = remaining.slice(end + 1);
        continue;
      }
    }

    // link [text](url)
    if (remaining.startsWith("[")) {
      const closeBracket = remaining.indexOf("]");
      const openParen = remaining.indexOf("(", closeBracket);
      const closeParen = remaining.indexOf(")", openParen);
      if (closeBracket > 0 && openParen === closeBracket + 1 && closeParen > openParen) {
        const label = remaining.slice(1, closeBracket);
        const url = remaining.slice(openParen + 1, closeParen);
        const external = url.startsWith("http");
        parts.push(
          <a
            key={parts.length}
            href={url}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="font-semibold text-slate-900 underline underline-offset-4"
          >
            {label}
          </a>
        );
        remaining = remaining.slice(closeParen + 1);
        continue;
      }
    }

    // fallback: emit first char to avoid infinite loop
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return <>{parts}</>;
}

export default function Markdown({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <div>
      {blocks.map((b, idx) => {
        if (b.type === "h") {
          const cls =
            b.level === 1
              ? "mt-8 text-xl font-bold text-slate-800"
              : b.level === 2
                ? "mt-8 text-lg font-bold text-slate-800"
                : "mt-6 text-base font-bold text-slate-800";
          const Tag = b.level === 1 ? "h2" : b.level === 2 ? "h3" : "h4";
          return (
            <Tag key={idx} className={cls}>
              {renderInline(b.text)}
            </Tag>
          );
        }

        if (b.type === "p") {
          return (
            <p key={idx} className="mt-4 text-base leading-7 text-slate-700">
              {renderInline(b.text)}
            </p>
          );
        }

        if (b.type === "ul") {
          return (
            <ul key={idx} className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700">
              {b.items.map((it, i) => (
                <li key={i} className="leading-7">
                  {renderInline(it)}
                </li>
              ))}
            </ul>
          );
        }

        if (b.type === "ol") {
          return (
            <ol key={idx} className="mt-4 list-decimal space-y-2 pl-6 text-base text-slate-700">
              {b.items.map((it, i) => (
                <li key={i} className="leading-7">
                  {renderInline(it)}
                </li>
              ))}
            </ol>
          );
        }

        if (b.type === "code") {
          return (
            <pre
              key={idx}
              className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
            >
              <code>{b.code}</code>
            </pre>
          );
        }

        return null;
      })}
    </div>
  );
}
