export function Markdown({ text }: { text: string }) {
  const bold = (l: string) =>
    l
      .split(/(\*\*[^*]+\*\*)/)
      .map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {text
        .split("\n")
        .filter((l) => l.trim())
        .map((l, i) => {
          if (l.startsWith("#"))
            return (
              <h4 key={i} className="pt-2 font-display font-bold text-primary">
                {l.replace(/^#+\s*/, "")}
              </h4>
            );
          if (/^\s*([-*]|\d+\.)\s/.test(l))
            return (
              <p
                key={i}
                className="pl-4 before:-ml-4 before:mr-2 before:text-accent before:content-['●']"
              >
                {bold(l.replace(/^\s*([-*]|\d+\.)\s/, ""))}
              </p>
            );
          return <p key={i}>{bold(l)}</p>;
        })}
    </div>
  );
}
