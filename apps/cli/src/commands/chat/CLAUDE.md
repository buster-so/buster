# CLAUDE.md - Chat Module

This document provides guidance for Claude Code (claude.ai/code) when working with the Buster CLI chat implementation.

## Architecture Overview

The Buster CLI chat module is a terminal-based interactive chat interface that connects to an AI agent with specialized data engineering capabilities. It's specifically designed for working with:

- DBT projects (data build tool)
- Buster semantic layer
- General data engineering tasks

### Key Components

- **BusterCliAgent**: Core component that manages the AI connection and tool integration
- **AppState**: Maintains chat state, message history, and UI elements
- **UI Layer**: Terminal-based interface using Ratatui and Crossterm
- **Tool Integration**: Facilitates AI interaction with the filesystem, DBT commands, and Buster API

## Code Organization

- `mod.rs`: Main module entry point and public API
- `args.rs`: Command-line argument parsing
- `config.rs`: Configuration management
- `logic.rs`: Core chat execution logic
- `state.rs`: Chat session state management
- `ui.rs`: Terminal UI implementation
- `completion.rs`: Path and command autocompletion

## AI Agent Tools

The agent is equipped with a set of tools similar to those available to Claude Code (claude.ai/code). These tools enable the agent to interact with the filesystem and execute commands. Many tools support batch operations by accepting arrays of inputs.

### Core CLI Tools

1. **BashTool (Bash)**
   - **Parameters**:
     - `command` (string, required): Shell command to execute
     - `description` (string, optional): Short description of command
     - `timeout` (number, optional): Timeout in milliseconds
   - **Returns**: Terminal output (stdout/stderr combined)
   - **Notes**: Executes commands via `sh -c`

2. **ViewTool (View)**
   - **Single file mode parameters**:
     - `file_path` (string, required): Path to file
     - `offset` (number, optional): Line number to start reading from
     - `limit` (number, optional): Maximum number of lines to read
   - **Multiple file mode parameters**:
     - `file_paths` (array, required): Array of paths to read
   - **Returns**: File content with line numbers in cat -n format
   - **Notes**: Can read multiple files in a single operation

3. **ReplaceTool (Replace)**
   - **Parameters**:
     - `file_path` (string, required): Path to file
     - `content` (string, required): Content to write
   - **Returns**: Success message
   - **Notes**: Always overwrites existing files and creates parent directories if needed

4. **EditTool (Edit)**
   - **Parameters**:
     - `file_path` (string, required): Path to file
     - `old_string` (string, required): Text to replace
     - `new_string` (string, required): New text
     - `expected_replacements` (number, optional): Number of expected matches
   - **Returns**: Success message
   - **Notes**: Validates that the exact expected number of replacements are made

5. **LSTool (LS)**
   - **Parameters**:
     - `path` (string, required): Directory to list
     - `ignore` (array, optional): Glob patterns to ignore
   - **Returns**: Directory listing (file/dir with names)
   - **Notes**: Simple directory listing with ignore pattern support

6. **GrepTool (GrepTool)**
   - **Parameters**:
     - `pattern` (string, required): Regex pattern to search for
     - `path` (string, optional): Directory to search in
     - `include` (string, optional): File pattern to include
   - **Returns**: Matches formatted as "file:line: content"
   - **Notes**: Uses regex for searching with file pattern filtering

7. **GlobTool (GlobTool)**
   - **Parameters**:
     - `pattern` (string, required): Glob pattern to match
     - `path` (string, optional): Directory to search from
   - **Returns**: List of matching file paths sorted by modification time
   - **Notes**: Uses glob patterns for file matching

## Implementation Notes

The tools are designed to work like Claude Code tools, with similar parameter names and output formats. This makes it easy to port code between the CLI agent and Claude Code.

## Implementation Structure

Buster CLI tools follow a consistent object-oriented pattern and return simple string outputs instead of structured outputs:

```rust
// 1. Parameter definition with multi-mode support
#[derive(Serialize, Deserialize, Debug)]
pub struct ViewSingleParams {
    file_path: String,
    offset: Option<usize>,
    limit: Option<usize>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ViewParams {
    #[serde(flatten)]
    single: Option<ViewSingleParams>,
    #[serde(rename = "file_paths")]
    multiple: Option<Vec<String>>,
}

// 2. Tool implementation
pub struct ViewTool {
    agent: Arc<Agent>,
}

// 3. Constructor method
impl ViewTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
    
    // Helper methods may be included
    async fn read_single_file(&self, file_path: &str, offset: Option<usize>, limit: Option<usize>) -> Result<String, anyhow::Error> {
        // Implementation...
    }
}

// 4. ToolExecutor implementation
#[async_trait]
impl ToolExecutor for ViewTool {
    type Params = ViewParams;
    type Output = String; // Simple string output

    fn get_name(&self) -> String {
        "View".to_string() // Match Claude Code tool name
    }

    fn get_schema(&self) -> Value {
        // JSON Schema definition with oneOf for multi-mode support
        serde_json::json!({
            "name": self.get_name(),
            "description": "Reads a file from the local filesystem",
            "parameters": {
                "type": "object",
                "oneOf": [
                    {
                        "properties": {
                            "file_path": { "type": "string" },
                            // ...
                        },
                    },
                    {
                        "properties": {
                            "file_paths": { "type": "array" },
                            // ...
                        },
                    }
                ]
            }
        })
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // Handle different input modes
        if let Some(file_paths) = params.multiple {
            // Handle multiple files
        } else if let Some(single) = params.single {
            // Handle single file
        } else {
            // Error case
        }
    }
}
```