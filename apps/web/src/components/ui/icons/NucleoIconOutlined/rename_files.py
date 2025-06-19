import os
import re

def process_files():
    # Get the current directory
    directory = os.getcwd()
    
    # Process all .tsx files
    for filename in os.listdir(directory):
        if filename.endswith('.tsx'):
            file_path = os.path.join(directory, filename)
            
            # Read the content of the file
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Replace in content
            new_content = content.replace('12px_', '').replace('18px_', '')
            
            # Write the modified content back
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
            
            # Rename the file if needed
            new_filename = filename.replace('12px_', '').replace('18px_', '')
            if new_filename != filename:
                new_file_path = os.path.join(directory, new_filename)
                try:
                    os.rename(file_path, new_file_path)
                    print(f"Renamed: {filename} -> {new_filename}")
                except OSError as e:
                    print(f"Error renaming {filename}: {e}")

if __name__ == "__main__":
    print("Starting file processing...")
    process_files()
    print("File processing completed!") 