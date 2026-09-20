// A small lexical colorizer, not a parser. React escapes every token; learner
// source is never inserted as HTML. Runtime diagnostics remain authoritative.
export function codeTokens(source: string) {
  return source
    .split(
      /(\/\/[^\n]*|#[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|class|import|export|from|def|print|True|False|None|async|await|new|true|false|null|undefined|SELECT|FROM|WHERE|AS|JOIN|GROUP|BY|ORDER|type|interface)\b|\b\d+(?:\.\d+)?\b)/g,
    )
    .map((text) => ({
      text,
      color: /^(\/\/|#|--|\/\*)/.test(text)
        ? "text-slate-400"
        : /^["'`]/.test(text)
          ? "text-emerald-300"
          : /^\d/.test(text)
            ? "text-amber-300"
            : /^(const|let|var|function|return|if|else|for|while|class|import|export|from|def|print|True|False|None|async|await|new|true|false|null|undefined|SELECT|FROM|WHERE|AS|JOIN|GROUP|BY|ORDER|type|interface)$/.test(
                  text,
                )
              ? "text-sky-300"
              : "text-white/90",
    }));
}
