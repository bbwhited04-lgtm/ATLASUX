import React, { useMemo } from "react";

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "hr" }
  | { type: "img"; alt: string; src: string };

function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.trim().startsWith("```")) {
      i += 1;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) i += 1;
      blocks.push({ type: "code", code: buf.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i += 1;
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

    // Image on its own line: ![alt](src)
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({ type: "img", alt: imgMatch[1], src: imgMatch[2] });
      i += 1;
      continue;
    }

    // Blockquote
    if (line.match(/^\s*>\s?/)) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*>\s?/)) {
        bqLines.push(lines[i].replace(/^\s*>\s?/, "").trim());
        i += 1;
      }
      blocks.push({ type: "blockquote", lines: bqLines });
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

    // Paragraphs
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }

    const p: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim().length > 0) {
      if (
        lines[i].trim().startsWith("```") ||
        lines[i].match(/^(#{1,3})\s+/) ||
        lines[i].match(/^\s*[-*]\s+/) ||
        lines[i].match(/^\s*\d+\.\s+/) ||
        lines[i].match(/^\s*>\s?/) ||
        /^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim()) ||
        lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
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
  // Inline parser: **bold**, *italic*, `code`, [text](url), ![alt](src)
  const parts: React.ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Find earliest special character
    let earliestIdx = remaining.length;
    let earliestType: "bold" | "italic" | "code" | "link" | "img" | "none" = "none";

    const boldIdx = remaining.indexOf("**");
    if (boldIdx !== -1 && boldIdx < earliestIdx) { earliestIdx = boldIdx; earliestType = "bold"; }

    const codeIdx = remaining.indexOf("`");
    if (codeIdx !== -1 && codeIdx < earliestIdx) { earliestIdx = codeIdx; earliestType = "code"; }

    // Check for italic (*) but not bold (**) — italic only if single *
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)/);
    if (italicMatch && italicMatch.index !== undefined && italicMatch.index < earliestIdx) {
      earliestIdx = italicMatch.index; earliestType = "italic";
    }

    const imgIdx = remaining.indexOf("![");
    if (imgIdx !== -1 && imgIdx < earliestIdx) { earliestIdx = imgIdx; earliestType = "img"; }

    const linkIdx = remaining.indexOf("[");
    if (linkIdx !== -1 && linkIdx < earliestIdx && (imgIdx === -1 || linkIdx !== imgIdx + 1)) {
      earliestIdx = linkIdx; earliestType = "link";
    }

    if (earliestType === "none") {
      parts.push(remaining);
      break;
    }

    // Emit text before the match
    if (earliestIdx > 0) {
      parts.push(remaining.slice(0, earliestIdx));
      remaining = remaining.slice(earliestIdx);
      continue;
    }

    // Bold **text**
    if (earliestType === "bold") {
      const end = remaining.indexOf("**", 2);
      if (end > 2) {
        parts.push(
          <strong key={parts.length} className="font-bold">
            {renderInline(remaining.slice(2, end))}
          </strong>
        );
        remaining = remaining.slice(end + 2);
        continue;
      }
    }

    // Italic *text*
    if (earliestType === "italic") {
      const rest = remaining.slice(1);
      const end = rest.search(/(?<!\*)\*(?!\*)/);
      if (end > 0) {
        parts.push(
          <em key={parts.length} className="italic">
            {renderInline(rest.slice(0, end))}
          </em>
        );
        remaining = rest.slice(end + 1);
        continue;
      }
    }

    // Inline code
    if (earliestType === "code") {
      const end = remaining.indexOf("`", 1);
      if (end > 1) {
        parts.push(
          <code
            key={parts.length}
            className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800"
          >
            {remaining.slice(1, end)}
          </code>
        );
        remaining = remaining.slice(end + 1);
        continue;
      }
    }

    // Inline image ![alt](src)
    if (earliestType === "img") {
      const closeBracket = remaining.indexOf("]", 2);
      const openParen = closeBracket > -1 ? remaining.indexOf("(", closeBracket) : -1;
      const closeParen = openParen > -1 ? remaining.indexOf(")", openParen) : -1;
      if (closeBracket > 0 && openParen === closeBracket + 1 && closeParen > openParen) {
        const alt = remaining.slice(2, closeBracket);
        const src = remaining.slice(openParen + 1, closeParen);
        parts.push(
          <img key={parts.length} src={src} alt={alt} className="my-4 max-w-full rounded-xl" />
        );
        remaining = remaining.slice(closeParen + 1);
        continue;
      }
    }

    // Link [text](url)
    if (earliestType === "link") {
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

    // Fallback: emit first char to avoid infinite loop
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

        if (b.type === "blockquote") {
          return (
            <blockquote
              key={idx}
              className="mt-4 border-l-4 border-slate-300 pl-4 italic text-slate-600"
            >
              {b.lines.map((l, li) => (
                <p key={li} className="mt-1 text-base leading-7">
                  {renderInline(l)}
                </p>
              ))}
            </blockquote>
          );
        }

        if (b.type === "hr") {
          return <hr key={idx} className="my-8 border-slate-200" />;
        }

        if (b.type === "img") {
          return (
            <figure key={idx} className="mt-6">
              <img
                src={b.src}
                alt={b.alt}
                className="max-w-full rounded-xl"
              />
              {b.alt && (
                <figcaption className="mt-2 text-center text-sm text-slate-500">
                  {b.alt}
                </figcaption>
              )}
            </figure>
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
