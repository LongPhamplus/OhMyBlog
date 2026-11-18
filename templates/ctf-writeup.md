---
title: "EventName 2026 — ChallengeName (web)"
description: "SSTI in a Jinja2 sandbox bypassed via ... to read the flag."
pubDatetime: 2026-11-18T09:00:00+07:00
draft: true # flip to false only after the CTF has ENDED
kind: writeup
platform: ctf
event: "EventName CTF 2026"
category: web # web | pwn | rev | crypto | forensics | malware | osint | misc ...
difficulty: medium # easy | medium | hard | insane (your judgement or the event's)
points: 450
retired: false # true = event is over and organizers allow write-ups
tags: [ssti, jinja2, python]
---

## TL;DR

| Field      | Value                                        |
| ---------- | -------------------------------------------- |
| Event      | EventName CTF 2026 (ended YYYY-MM-DD)        |
| Category   | web                                          |
| Points     | 450 (N solves)                               |
| Author     | challenge author (credit them)               |
| Files      | `chall.zip` (sha256: `...`)                  |
| Techniques | SSTI → sandbox escape → arbitrary file read  |

One-paragraph summary: what the challenge was, the bug, how you got the flag.

## Challenge description

> Paste the original description here.

## Recon

What you looked at first and why. Show commands *and* relevant output.

```console
$ curl -si http://chall.local:1337/
HTTP/1.1 200 OK
Server: Werkzeug/3.x Python/3.12
...
```

```http
POST /render HTTP/1.1
Host: chall.local:1337
Content-Type: application/x-www-form-urlencoded

name={{7*7}}
```

## Analysis

Walk through the source / binary. Explain the root cause, not just the payload.

```python file=app.py
@app.post("/render")
def render():
    # user input reaches the template engine unescaped  // [!code highlight]
    return render_template_string(f"Hello {request.form['name']}")
```

> [!note]
> Explain *why* the obvious approach did not work — dead ends are useful to readers.

## Exploitation

```python file=solve.py
#!/usr/bin/env python3
import requests

URL = "http://chall.local:1337/render"
payload = "{{ ... }}"
print(requests.post(URL, data={"name": payload}).text)
```

```console
$ python3 solve.py
Hello EVENT{...}
```

## Flag

> [!success]- Flag
> `EVENT{redact_if_the_event_asks_you_to}`

## Lessons learned

- What you would check first next time.
- How a developer should fix it (e.g. never pass user input to `render_template_string`).
- Detection idea, if any.

## References

- [Link to relevant docs / prior research](https://example.com)
