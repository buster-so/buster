#!/bin/bash

arg=$1
baseDir="packages/ai/evals"

if [ -z "$arg" ]; then
  cd "$baseDir" && npx braintrust eval
else
  file=$(find "$baseDir" -type f -name "*.eval*.ts" | grep -E "${arg}\.eval|${arg}/" | head -n 1)
  if [ -n "$file" ]; then
    npx braintrust eval "$file"
  else
    dir=$(find "$baseDir" -type d -name "${arg}" | head -n 1)
    if [ -n "$dir" ]; then
      npx braintrust eval "$dir"
    else
      echo "No file or directory found for \"${arg}\""
      exit 1
    fi
  fi
fi