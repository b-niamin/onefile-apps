#!/usr/bin/env sh
# Install or refresh agent skills into .ai/skills with the skills.sh CLI.
#   tools/update-skills.sh                    refresh the default set
#   tools/update-skills.sh owner/repo skill   add one more skill
# The CLI installs into a temp project; we copy the result into .ai/skills and
# keep skills-lock.json at the repo root.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
git init -q .
[ -f "$ROOT/skills-lock.json" ] && cp "$ROOT/skills-lock.json" .
if [ $# -eq 2 ]; then
  npx -y skills@latest add "$1" --skill "$2" -a claude-code -y
else
  npx -y skills@latest add anthropics/skills --skill frontend-design --skill webapp-testing --skill web-artifacts-builder -a claude-code -y
  npx -y skills@latest add pbakaus/impeccable --skill impeccable -a claude-code -y
  npx -y skills@latest add humanlayer/skills --skill visual-pr -a claude-code -y
fi
mkdir -p "$ROOT/.ai/skills"
for s in .claude/skills/*; do
  name="$(basename "$s")"
  rm -rf "$ROOT/.ai/skills/$name"
  cp -R "$s" "$ROOT/.ai/skills/$name"
  echo "updated .ai/skills/$name"
done
cp skills-lock.json "$ROOT/skills-lock.json"
# impeccable ships its license at the repo root, not inside the skill folder
if [ -d "$ROOT/.ai/skills/impeccable" ] && [ ! -f "$ROOT/.ai/skills/impeccable/LICENSE.txt" ]; then
  git clone -q --depth 1 https://github.com/pbakaus/impeccable "$TMP/impeccable-src"
  cp "$TMP/impeccable-src/LICENSE" "$ROOT/.ai/skills/impeccable/LICENSE.txt"
  cp "$TMP/impeccable-src/NOTICE.md" "$ROOT/.ai/skills/impeccable/NOTICE.md"
fi
# humanlayer/skills also keeps its license at the repo root
if [ -d "$ROOT/.ai/skills/visual-pr" ] && [ ! -f "$ROOT/.ai/skills/visual-pr/LICENSE.txt" ]; then
  git clone -q --depth 1 https://github.com/humanlayer/skills "$TMP/humanlayer-src"
  cp "$TMP/humanlayer-src/LICENSE" "$ROOT/.ai/skills/visual-pr/LICENSE.txt"
fi
echo "Review the diff (git diff .ai skills-lock.json) before committing."
