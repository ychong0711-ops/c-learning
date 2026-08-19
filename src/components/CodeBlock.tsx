type Token = { text: string; cls: string | null };

const TOKEN_RE =
  /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*")|('(?:\\.|[^'\\\n])*')|(^[ \t]*#[ \t]*\w+[^\n]*)|\b(uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t|size_t|ptrdiff_t|intptr_t|uintptr_t|void|int|char|float|double|short|long|signed|unsigned|bool|true|false|NULL)\b|\b(if|else|for|while|do|switch|case|default|break|continue|return|goto|sizeof|typedef|struct|union|enum|static|const|volatile|extern|register|inline|_Static_assert)\b|(0[xX][0-9a-fA-F]+[uUlL]*|\b\d+(?:\.\d+)?[uUlLfF]*\b)|([A-Za-z_]\w*(?=[ \t]*\())/gm;

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code)) !== null) {
    if (m.index > last) tokens.push({ text: code.slice(last, m.index), cls: null });
    const cls = m[1] || m[2]
      ? "tok-cmt"
      : m[3] || m[4]
        ? "tok-str"
        : m[5]
          ? "tok-pp"
          : m[6]
            ? "tok-type"
            : m[7]
              ? "tok-kw"
              : m[8]
                ? "tok-num"
                : m[9]
                  ? "tok-fn"
                  : null;
    tokens.push({ text: m[0], cls });
    last = m.index + m[0].length;
  }
  if (last < code.length) tokens.push({ text: code.slice(last), cls: null });
  return tokens;
}

export default function CodeBlock({
  code,
  caption,
  compact,
}: {
  code: string;
  caption?: string;
  compact?: boolean;
}) {
  const tokens = tokenize(code.trim());
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-code">
      <div className="flex items-center justify-between border-b border-line/70 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-edge" />
          <span className="h-2 w-2 rounded-full bg-edge" />
          <span className="h-2 w-2 rounded-full bg-signal/70" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
          C {caption ? "· " + caption.slice(0, 40) : ""}
        </span>
      </div>
      <pre
        className={`overflow-x-auto px-4 py-3 font-mono leading-relaxed ${
          compact ? "text-[12px]" : "text-[13px]"
        }`}
      >
        <code>
          {tokens.map((t, i) =>
            t.cls ? (
              <span key={i} className={t.cls}>
                {t.text}
              </span>
            ) : (
              <span key={i}>{t.text}</span>
            )
          )}
        </code>
      </pre>
    </figure>
  );
}
