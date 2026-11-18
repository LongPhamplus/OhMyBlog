---
title: "Hello, world: how this blog is built"
description: "A security-hardened static blog: Astro, Cloudflare Pages, strict CSP with hashes, secret scanning and EXIF checks in CI."
pubDatetime: 2026-11-18T09:00:00+07:00
kind: post
tags: [blog, csp, supply-chain]
---

First post. Pipeline:

```mermaid
flowchart LR
  A[Markdown] --> B[GitHub] --> C[Actions: gitleaks + OPSEC + build] --> D[Cloudflare Pages]
```

```console
$ pnpm build
[csp] 12 pages, 3 inline script hash(es) -> dist/_headers
```

> [!note]
> Every inline script is hashed into the CSP at build time.

> [!success]- Flag
> `FLAG{example_only}`
