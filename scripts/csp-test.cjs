/* eslint-disable */
// Usage: node scripts/csp-test.cjs   (needs `wrangler pages dev dist --port 8788` running)
// BASE=https://YOUR_PROJECT.pages.dev node scripts/csp-test.cjs   (test production)
const { chromium } = require("/home/long/.cache/ms-playwright-go/1.50.1/package");
const BASE = process.env.BASE ?? "http://127.0.0.1:8788";
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium" });
  for (const scheme of ["light", "dark"]) {
    const page = await browser.newPage({ colorScheme: scheme });
    const errs = [];
    page.on("console", m => { if (m.type() === "error" || /Content.Security/i.test(m.text())) errs.push(m.text()); });
    page.on("pageerror", e => errs.push("pageerror: " + e.message));
    for (const path of ["/", "/posts/hello-world/", "/writeups/?platform=htb", "/search/", "/about/", "/disclaimer/"]) {
      errs.length = 0;
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      let extra = "";
      if (path.startsWith("/posts/")) {
        await page.waitForSelector("div.mermaid[data-processed] svg", { timeout: 10000 }).then(() => extra += " mermaid=OK").catch(() => extra += " mermaid=FAIL");
        extra += " copyBtns=" + await page.locator("button.copy-code").count();
        extra += " minRead=" + (await page.locator("text=min read").count() > 0);
      }
      if (path.startsWith("/search/")) {
        await page.locator("input").first().fill("csp");
        await page.waitForTimeout(1500);
        extra += " searchResults=" + await page.locator(".pagefind-ui__result").count();
      }
      console.log(`[${scheme}] ${path} errors=${errs.length}${extra}`);
      errs.forEach(e => console.log("   ! " + e.slice(0, 220)));
    }
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
