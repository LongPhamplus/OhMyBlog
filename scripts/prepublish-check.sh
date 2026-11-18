#!/usr/bin/env bash
# Pre-publish OPSEC check for posts and images.
#   scripts/prepublish-check.sh                 # check whole content tree
#   scripts/prepublish-check.sh path/to/post.md # check specific files/dirs
#   scripts/prepublish-check.sh --fix-exif ...  # also strip image metadata in place
#   CI=1 scripts/prepublish-check.sh            # non-interactive, fail on HIGH only
# Exit code: 1 if any HIGH finding (secrets, GPS/device EXIF, active-writeup leak).
set -uo pipefail

FIX_EXIF=0
if [[ "${1:-}" == "--fix-exif" ]]; then FIX_EXIF=1; shift; fi
TARGETS=("$@")
[[ ${#TARGETS[@]} -eq 0 ]] && TARGETS=(src/content src/assets public)

RED=$'\e[31m'; YEL=$'\e[33m'; GRN=$'\e[32m'; RST=$'\e[0m'
HIGH=0; WARN=0
high() { echo "${RED}[HIGH]${RST} $*"; HIGH=$((HIGH + 1)); }
warn() { echo "${YEL}[WARN]${RST} $*"; WARN=$((WARN + 1)); }

mapfile -t TEXT < <(find "${TARGETS[@]}" -type f \( -name '*.md' -o -name '*.mdx' \) 2>/dev/null)
mapfile -t IMGS < <(find "${TARGETS[@]}" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.heic' -o -iname '*.tif' -o -iname '*.tiff' \) 2>/dev/null)

grep_report() { # level label regex [exclude-regex]
  local level=$1 label=$2 re=$3 ex=${4:-'^$'}
  [[ ${#TEXT[@]} -eq 0 ]] && return
  while IFS= read -r hit; do
    [[ -z "$hit" ]] && continue
    if echo "$hit" | grep -Eq "$ex"; then continue; fi
    $level "$label: $hit"
  done < <(grep -HnEo -e "$re" "${TEXT[@]}" 2>/dev/null)
}

echo "== 1. Secrets"
if command -v gitleaks >/dev/null 2>&1; then
  for t in "${TARGETS[@]}"; do
    [[ -e "$t" ]] || continue
    gitleaks dir "$t" --no-banner --redact --exit-code 1 >/dev/null 2>&1 || high "gitleaks found secrets in $t (run: gitleaks dir $t -v)"
  done
else
  warn "gitleaks not installed - using regex fallback (install: https://github.com/gitleaks/gitleaks)"
fi
grep_report high "AWS key"      'AKIA[0-9A-Z]{16}'
grep_report high "GitHub token" '(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{60,}'
grep_report high "Slack token"  'xox[abprs]-[A-Za-z0-9-]{10,}'
grep_report high "Private key"  '-----BEGIN ([A-Z]+ )?PRIVATE KEY-----'
grep_report high "Google API"   'AIza[0-9A-Za-z_-]{35}'
grep_report warn "JWT"          'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
grep_report warn "password="    '(password|passwd|pwd|secret|api[_-]?key)[[:space:]]*[:=][[:space:]]*[^[:space:]<]{6,}' '<redacted>|REDACTED|\*\*\*'

echo "== 2. Network identifiers (review: lab IPs are OK, YOUR real IPs are not)"
# allow: loopback, HTB/THM lab ranges, RFC5737 documentation ranges, 0.0.0.0
grep_report warn "IPv4" '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' ':(127\.|0\.0\.0\.0|10\.10\.|10\.129\.|10\.13[0-9]\.|10\.8\.|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)'
grep_report warn "Internal host" '\b[a-z0-9-]+\.(corp|internal|intranet|lan|local)\b' '\.(htb|thm)\b|corp\.local'
grep_report warn "Email" '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b' '@example\.(com|org)|noreply@'

echo "== 3. Flags & hashes (fine for ENDED CTFs, never for active ones)"
grep_report warn "Flag format" '\b(HTB|THM|picoCTF|flag|FLAG|CTF)\{[^}]{3,}\}'
grep_report warn "32-hex (HTB user/root.txt?)" '\b[a-f0-9]{32}\b'

echo "== 4. Write-up embargo"
for f in "${TEXT[@]}"; do
  fm=$(awk 'NR==1&&/^---/{f=1;next} f&&/^---/{exit} f' "$f")
  if echo "$fm" | grep -Eq '^kind:[[:space:]]*writeup' \
     && ! echo "$fm" | grep -Eq '^draft:[[:space:]]*true' \
     && ! echo "$fm" | grep -Eq '^retired:[[:space:]]*true'; then
    high "$f: write-up is not draft and not retired:true"
  fi
done

echo "== 5. Image metadata (EXIF/XMP/IPTC)"
if command -v exiftool >/dev/null 2>&1; then
  for img in "${IMGS[@]}"; do
    meta=$(exiftool -s -s -s -q -m -GPSPosition -Make -Model -SerialNumber -Artist -Creator -OwnerName -HostComputer "$img" 2>/dev/null | tr '\n' ' ')
    if [[ -n "${meta// /}" ]]; then
      if [[ $FIX_EXIF -eq 1 ]]; then
        exiftool -q -m -all= -tagsfromfile @ -Orientation -ColorSpaceTags -overwrite_original "$img" \
          && echo "${GRN}[FIXED]${RST} stripped metadata: $img"
      else
        high "$img has metadata: $meta (re-run with --fix-exif)"
      fi
    fi
  done
else
  warn "exiftool not installed (apt install libimage-exiftool-perl) - images NOT checked"
fi

echo
echo "== Manual checklist (a script cannot read screenshots for you):"
cat <<'EOF'
  [ ] Screenshots: no real hostnames, usernames, tabs, bookmarks, Slack/Discord, VPN IP, taskbar clock/timezone
  [ ] Terminal prompts: no real user@hostname, no home path with real name
  [ ] Burp/ZAP history panes: only lab targets visible
  [ ] Platform rules: machine retired / CTF ended / organizers allow write-ups
  [ ] Real-world bug: vendor fixed it or disclosure deadline passed; PoC is non-weaponized
  [ ] Employer/client data: none, not even blurred (blur can be reversed - use solid boxes)
EOF

echo
echo "Result: ${HIGH} high, ${WARN} warning(s)"
[[ $HIGH -gt 0 ]] && exit 1
exit 0
