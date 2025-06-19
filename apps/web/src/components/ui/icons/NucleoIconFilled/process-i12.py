import os
import re

def to_camel_case(file_name):
    # Remove the extension and 'I12px' suffix
    name = file_name.replace('-I12px.tsx', '')
    # Split by hyphens
    words = name.split('-')
    # Capitalize first letter of each word except the first one
    return words[0] + ''.join(word.capitalize() for word in words[1:])

# Get all files in the current directory
files = [f for f in os.listdir('.') if f.endswith('.tsx')]

# Filter files containing 'I12px'
i12px_files = [f for f in files if 'I12px' in f]

# Prepare the export lines
export_lines = []
for file_name in i12px_files:
    base_name = file_name.replace('.tsx', '')
    camel_name = to_camel_case(file_name)
    export_line = f'export {{ default as I12_{camel_name} }} from "./{base_name}";'
    export_lines.append(export_line)

# Read existing content of index.ts
with open('index.ts', 'r') as f:
    content = f.read()

# Append new export lines
with open('index.ts', 'a') as f:
    f.write('\n' + '\n'.join(export_lines) + '\n') 