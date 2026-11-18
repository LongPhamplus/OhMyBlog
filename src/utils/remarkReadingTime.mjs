// Adds `minutesRead` to remarkPluginFrontmatter. Prose ~200 wpm, code ~counted at 1/3.
export function remarkReadingTime() {
  return (tree, file) => {
    let prose = 0;
    let code = 0;
    const count = s => (s.match(/\S+/g) ?? []).length;
    const walk = node => {
      if (node.type === "text" || node.type === "inlineCode")
        prose += count(node.value);
      else if (node.type === "code") code += count(node.value);
      node.children?.forEach(walk);
    };
    walk(tree);
    const minutes = Math.max(1, Math.round((prose + code / 3) / 200));
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.minutesRead = minutes;
  };
}
