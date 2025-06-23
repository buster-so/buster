import re

def transform_line(line):
    # Check if line contains I12Px_
    if "I12Px_" not in line:
        return line
    
    # Extract the component name after I12Px_
    match = re.search(r'from "\./I12Px_(.*?)"', line)
    if not match:
        return line
    
    # Get the original name and transform it
    original_name = match.group(1)
    transformed_name = f"{original_name}-I12px"
    
    # Replace the path in the line
    new_line = line.replace(f'"./I12Px_{original_name}"', f'"./{transformed_name}"')
    
    # Replace the export name
    new_line = new_line.replace(f"I12Px_{original_name}", transformed_name)
    
    return new_line

def main():
    # Read the original file
    with open('index.ts', 'r') as file:
        lines = file.readlines()
    
    # Transform the lines
    transformed_lines = [transform_line(line) for line in lines]
    
    # Write back to the file
    with open('index.ts', 'w') as file:
        file.writelines(transformed_lines)
    
    print("Transformation complete!")

if __name__ == "__main__":
    main() 