#!/usr/bin/env sh
# Point every agent's skills folder at .ai/skills.
set -eu
cd "$(dirname "$0")/.."
for dir in .claude .agents; do
  mkdir -p "$dir"
  if [ -e "$dir/skills" ] && [ ! -L "$dir/skills" ]; then
    echo "$dir/skills exists and is not a symlink; leaving it alone" >&2
    continue
  fi
  ln -sfn ../.ai/skills "$dir/skills"
  echo "$dir/skills -> ../.ai/skills"
done
