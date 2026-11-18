---
title: "Notes: <tool or technique>"
description: "Short practical notes on <tool>: setup, the 5 commands I actually use, and gotchas."
pubDatetime: 2026-11-18T09:00:00+07:00
draft: true
kind: notes
category: ad # optional
comments: false
tags: [cheatsheet, tool-name]
---

## What / why

Two sentences: what it is and when you reach for it.

## Setup

```bash
pipx install <tool>
```

## Commands I actually use

```powershell
# Windows side example
Get-ADUser -Filter * -Properties ServicePrincipalName | Where-Object { $_.ServicePrincipalName }
```

```bash
# Linux side example
tool -u user -p 'Passw0rd!' -d corp.local --dc-ip 10.0.0.10
```

```asm
; asm snippet example
xor  eax, eax
push eax
```

## Gotchas

> [!warning]
> Something that bit you.

## Further reading

- <link>
