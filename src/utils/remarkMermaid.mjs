// Turns ```mermaid fences into <div class="mermaid"> before Shiki sees them,
// so they are rendered client-side (self-hosted mermaid, lazy-loaded) instead of
// being highlighted as code. A <div> (not <pre>) keeps the theme's copy button away.
const escape = s =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function remarkMermaid() {
  return tree => {
    const walk = node => {
      if (!node.children) return;
      node.children = node.children.map(child => {
        if (child.type === "code" && child.lang === "mermaid") {
          return {
            type: "html",
            value: `<div class="mermaid not-prose" data-pagefind-ignore>${escape(child.value)}</div>`,
          };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
