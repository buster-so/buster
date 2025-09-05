use agents::{AgentError, AgentThread};
use crate::commands::chat::completion; // Add import for completion logic
use litellm::{AgentMessage, MessageProgress, ToolCall};
use uuid::Uuid;
use std::time::Instant;
use serde_json;
use serde_json::Value;
use serde::{Deserialize, Serialize};
use std::time::SystemTime; // For timestamps

// --- Structs for specific tool results (add more as needed) ---
#[derive(Serialize, Deserialize, Debug)]
struct ListDirectoryEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: Option<u64>,
    // modified_at: Option<String>, // Ignoring for now
}

#[derive(Serialize, Deserialize, Debug)]
struct ListDirectoryResult {
    entries: Vec<ListDirectoryEntry>,
}

// --- NEW: Struct/Enum for Display Log ---
#[derive(Debug, Clone)]
pub enum DisplayLogEntry {
    ShellCommand { timestamp: SystemTime, command: String },
    ShellOutput { timestamp: SystemTime, stdout: String, stderr: String, status: String }, // Use String for status for simplicity
    ShellError { timestamp: SystemTime, error: String },
    Info { timestamp: SystemTime, message: String }, // General purpose info
}

// --- Application State Structs ---
#[derive(Debug, Clone)]
pub struct ActiveToolCall {
    pub id: String,
    pub name: String,
    pub status: String,
    pub content: Option<String>,
}

pub struct AppState {
    pub input: String,
    pub messages: Vec<AgentMessage>,
    pub display_log: Vec<DisplayLogEntry>,
    pub scroll_offset: u16,
    pub should_quit: bool,
    pub reset_scroll_request: bool,
    pub active_tool_calls: Vec<ActiveToolCall>,
    pub current_error: Option<String>,
    pub agent_thread: AgentThread,
    pub is_agent_processing: bool,

    // --- Autocompletion State ---
    pub is_completing: bool,
    pub completions: Vec<String>,
    pub completion_index: Option<usize>,
    // Store info about the text fragment being completed
    completion_fragment_start: Option<usize>,
    completion_fragment_len: Option<usize>,
}

// --- AppState Implementation ---
impl AppState {
    pub fn new(user_id: Uuid, session_id: Uuid) -> Self {
        AppState {
            input: String::new(),
            messages: vec![],
            display_log: Vec::new(),
            scroll_offset: 0,
            should_quit: false,
            reset_scroll_request: false,
            active_tool_calls: Vec::new(),
            current_error: None,
            agent_thread: AgentThread::new(Some(session_id), user_id, vec![]),
            is_agent_processing: false,

            // --- Autocompletion State ---
            is_completing: false,
            completions: Vec::new(),
            completion_index: None,
            completion_fragment_start: None,
            completion_fragment_len: None,
        }
    }

    pub fn submit_message(&mut self) {
        if !self.input.is_empty() && !self.is_agent_processing && self.active_tool_calls.is_empty()
        {
            let user_message = AgentMessage::user(self.input.clone());
            self.messages.push(user_message.clone());
            self.agent_thread.messages.push(user_message);

            self.input.clear();
            self.scroll_offset = 0;
            self.is_agent_processing = true;
            self.current_error = None;
        }
    }

    pub fn process_agent_message(&mut self, msg_result: Result<AgentMessage, AgentError>) {
        match msg_result {
            Ok(msg) => {
                self.current_error = None;
                match msg {
                    AgentMessage::Assistant {
                        id,
                        content,
                        tool_calls,
                        progress,
                        initial,
                        name,
                    } => {
                        self.handle_assistant_message(
                            id,
                            content,
                            tool_calls,
                            progress,
                            Some(initial),
                            name,
                        );
                    }
                    AgentMessage::Tool {
                        id,
                        name: tool_name,
                        content,
                        tool_call_id,
                        progress,
                    } => {
                        self.handle_tool_message(id, content, tool_call_id, tool_name, progress);
                    }
                    AgentMessage::Done => {
                        self.is_agent_processing = false;
                        self.active_tool_calls.clear();
                    }
                    AgentMessage::User { .. } | AgentMessage::Developer { .. } => {}
                }
            }
            Err(e) => {
                self.current_error = Some(format!("Agent Error: {}", e.0));
                self.is_agent_processing = false;
                self.active_tool_calls.clear();
                self.messages.push(AgentMessage::Assistant {
                    id: None,
                    content: Some(format!("Error: {}", e.0)),
                    name: Some("System".to_string()),
                    tool_calls: None,
                    progress: MessageProgress::Complete,
                    initial: false,
                });
            }
        }
        self.scroll_offset = 0;
    }

    fn handle_assistant_message(
        &mut self,
        _id: Option<String>,
        content: Option<String>,
        tool_calls: Option<Vec<ToolCall>>,
        progress: MessageProgress,
        _initial: Option<bool>, // Parameter name changed to avoid conflict
        name: Option<String>,
    ) {
        let agent_name = name.unwrap_or_else(|| "Assistant".to_string());
        match progress {
            MessageProgress::InProgress => {
                self.is_agent_processing = true;

                // Clone values needed in both update/add paths *before* potential move
                let _id_clone = _id.clone();
                let content_clone = content.clone();
                let progress_clone = progress.clone();

                // --- Update or add the main Assistant message ---
                let last_assistant_msg_index = self
                    .messages
                    .iter()
                    .rposition(|msg| matches!(msg, AgentMessage::Assistant { .. }));
                let mut updated_existing = false;

                if let Some(index) = last_assistant_msg_index {
                    if let Some(AgentMessage::Assistant {
                        progress: existing_progress,
                        ..
                    }) = self.messages.get_mut(index)
                    {
                        if *existing_progress == MessageProgress::InProgress {
                            // Update existing InProgress message
                            *self.messages.get_mut(index).unwrap() = AgentMessage::Assistant {
                                id: _id,
                                content,
                                tool_calls: tool_calls.clone(),
                                progress,
                                initial: false,
                                name: Some(agent_name.clone()),
                            };
                            updated_existing = true;
                        }
                    }
                }

                if !updated_existing {
                    // Push a new Assistant message if none was updated
                    self.messages.push(AgentMessage::Assistant {
                        id: _id_clone,
                        content: content_clone,
                        tool_calls: tool_calls.clone(),
                        progress: progress_clone,
                        initial: false,
                        name: Some(agent_name.clone()),
                    });
                }

                // --- Handle tool calls (update status bar and add placeholders) ---
                // Use the original tool_calls value passed to the function
                if let Some(calls) = &tool_calls {
                    // BORROW original tool_calls
                    // Update active_tool_calls for status bar
                    self.active_tool_calls = calls
                        .iter()
                        .map(|tc| ActiveToolCall {
                            id: tc.id.clone(),
                            name: tc.function.name.clone(),
                            status: "Starting".to_string(),
                            content: None,
                        })
                        .collect();

                    // Add placeholders *after* the assistant message
                    // Check if placeholders for these specific calls already exist? (More robust)
                    let existing_tool_ids: std::collections::HashSet<String> = self
                        .messages
                        .iter()
                        .filter_map(|msg| {
                            if let AgentMessage::Developer { id: Some(id), .. } = msg {
                                Some(id.clone())
                            } else {
                                None
                            }
                        })
                        .collect();

                    for tc in calls {
                        if !existing_tool_ids.contains(&tc.id) {
                            // Format arguments nicely
                            let args_json = serde_json::to_string_pretty(&tc.function.arguments)
                                                .unwrap_or_else(|_| "<failed to format args>".to_string());
                            self.messages.push(AgentMessage::Developer {
                                id: Some(tc.id.clone()),
                                content: format!(
                                    "Executing: {}\nArgs:\n{}",
                                    tc.function.name,
                                    args_json
                                ),
                                name: Some("Tool Call".to_string()), // Change name for clarity
                            });
                        }
                    }
                } else {
                    // If no tool calls in this specific message, clear the active list only if agent isn't processing anymore?
                    // Let's keep the logic simple: don't clear here. Complete/Done will handle it.
                    // self.active_tool_calls.clear();
                }
            }
            MessageProgress::Complete => {
                // --- This block needs similar review, but the error was in InProgress ---
                // --- For now, let's assume the existing Complete logic is mostly okay, ---
                // --- but ensure tool_calls is cloned if moved into a message. ---

                if tool_calls.is_none() {
                    // === Case 1: No tool calls, final assistant response ===
                    // (Simplified logic: Assume we always update/add the last message)
                    let last_assistant_msg_index = self
                        .messages
                        .iter()
                        .rposition(|msg| matches!(msg, AgentMessage::Assistant { .. }));

                    if let Some(index) = last_assistant_msg_index {
                        // Update existing message (might be InProgress or already Complete)
                        *self.messages.get_mut(index).unwrap() = AgentMessage::Assistant {
                            id: _id,
                            content,
                            tool_calls: None,
                            progress,
                            initial: false,
                            name: Some(agent_name),
                        };
                    } else {
                        // Add new final message
                        self.messages.push(AgentMessage::Assistant {
                            id: _id,
                            content,
                            tool_calls: None,
                            progress,
                            initial: false,
                            name: Some(agent_name),
                        });
                    }

                    self.is_agent_processing = false;
                    self.active_tool_calls.clear();
                } else {
                    // === Case 2: Tool calls were generated, assistant text part is complete ===
                    // Update the assistant message that initiated tools (if it was InProgress)
                    let last_assistant_msg_index = self
                        .messages
                        .iter()
                        .rposition(|msg| matches!(msg, AgentMessage::Assistant { .. }));
                    if let Some(index) = last_assistant_msg_index {
                        if let Some(AgentMessage::Assistant {
                            progress: existing_progress,
                            ..
                        }) = self.messages.get_mut(index)
                        {
                            if *existing_progress == MessageProgress::InProgress {
                                *self.messages.get_mut(index).unwrap() = AgentMessage::Assistant {
                                    id: _id,
                                    content,                        // Update final content
                                    tool_calls: tool_calls.clone(), // CLONE for message
                                    progress,                       // Mark as Complete
                                    initial: false,
                                    name: Some(agent_name),
                                };
                            }
                        }
                    }
                    // If no InProgress found, we don't add a new Complete message here.

                    // Update status bar (borrow original tool_calls)
                    if let Some(calls) = &tool_calls {
                        // BORROW original
                        self.active_tool_calls = calls
                            .iter()
                            .map(|tc| ActiveToolCall {
                                id: tc.id.clone(),
                                name: tc.function.name.clone(),
                                status: "Pending Execution".to_string(),
                                content: None,
                            })
                            .collect();

                        // --- ADD PLACEHOLDERS HERE TOO --- 
                        // Covers the case where only a Complete message with tool_calls is sent.
                        let existing_tool_ids: std::collections::HashSet<String> = self.messages.iter().filter_map(|msg| {
                            if let AgentMessage::Developer { id: Some(id), .. } = msg { Some(id.clone()) } else { None }
                        }).collect();

                        for tc in calls {
                            if !existing_tool_ids.contains(&tc.id) {
                                // Format arguments nicely
                                let args_json = serde_json::to_string_pretty(&tc.function.arguments)
                                                    .unwrap_or_else(|_| "<failed to format args>".to_string());
                                self.messages.push(AgentMessage::Developer {
                                    id: Some(tc.id.clone()),
                                    content: format!(
                                        "Executing: {}\nArgs:\n{}",
                                        tc.function.name,
                                        args_json
                                    ),
                                    name: Some("Tool Call".to_string()), // Change name for clarity
                                });
                            }
                        }
                    }
                    // Placeholders were added by InProgress or just now. Keep processing.
                    self.is_agent_processing = true;
                }
            }
        }
    }

    fn handle_tool_message(
        &mut self,
        _id: Option<String>,
        content: String,
        tool_call_id: String,
        tool_name: Option<String>,
        progress: MessageProgress,
    ) {
        let name = tool_name.unwrap_or_else(|| "Unknown Tool".to_string());
        let mut found_message = false;

        // Update the placeholder message in the main history
        for msg in self.messages.iter_mut() {
            if let AgentMessage::Developer { id: msg_id, content: msg_content, name: msg_name, .. } = msg {
                if msg_id.as_ref() == Some(&tool_call_id) {
                    *msg_name = Some(format!("{} Result", name)); // Update name to indicate result
                    *msg_content = match progress {
                        MessageProgress::InProgress => {
                             // Try to show formatted partial content if possible, else raw
                            format!("Running {}: {}...", name, content)
                        },
                        MessageProgress::Complete => {
                            // Attempt to parse and format known tool outputs
                            match name.as_str() {
                                "list_directory" => {
                                    match serde_json::from_str::<ListDirectoryResult>(&content) {
                                        Ok(parsed_result) => {
                                            let mut formatted = String::from("Entries:\n");
                                            for entry in parsed_result.entries {
                                                formatted.push_str(&format!(
                                                    "  - {} ({})\n",
                                                    entry.name,
                                                    if entry.is_dir { "directory" } else { "file" }
                                                ));
                                            }
                                            formatted.trim_end().to_string() // Remove trailing newline
                                        }
                                        Err(_) => format!("Result ({}):\n{}", name, content), // Fallback to raw JSON on parse error
                                    }
                                }
                                // Add more known tool formatters here
                                _ => format!("Result ({}):\n{}", name, content), // Default: show raw JSON
                            }
                        },
                    };
                    found_message = true;
                    break;
                }
            }
        }
        if !found_message {
            eprintln!(
                "Warning: Could not find placeholder message for tool call ID: {}",
                tool_call_id
            );
            // Optionally, add a new Developer message anyway?
            // self.messages.push(AgentMessage::Developer { ... });
        }

        // --- Original logic to update status bar ---
        if let Some(tool) = self
            .active_tool_calls
            .iter_mut()
            .find(|t| t.id == tool_call_id)
        {
            match progress {
                MessageProgress::InProgress => {
                    tool.status = "Running".to_string();
                    tool.content = Some(content); // Update status bar content too
                    self.is_agent_processing = true; // Keep processing
                }
                MessageProgress::Complete => {
                    // Remove from active list, but don't change is_agent_processing yet.
                    // The agent needs to process the result.
                    self.active_tool_calls.retain(|t| t.id != tool_call_id);
                    // Only set is_agent_processing = true if this was the *last* active tool call.
                    // The agent will send AgentMessage::Done or a final Assistant message later.
                    if self.active_tool_calls.is_empty() {
                        self.is_agent_processing = true; // Still true, agent needs to process results
                    }
                }
            }
        } else {
            eprintln!(
                "Warning: Received tool message for unknown or completed call ID: {}",
                tool_call_id
            );
        }
    }

    pub fn scroll_up(&mut self) {
        self.scroll_offset = self.scroll_offset.saturating_add(1);
        self.reset_scroll_request = false; // User manually scrolled
    }

    pub fn scroll_down(&mut self) {
        self.scroll_offset = self.scroll_offset.saturating_sub(1);
        self.reset_scroll_request = false; // User manually scrolled
    }

    // --- Autocompletion Methods ---

    /// Updates the list of path completions based on the current input.
    pub fn update_completions(&mut self, cwd: &str) {
        let (new_completions, target_opt) = completion::get_completions(&self.input, cwd);
        if !new_completions.is_empty() {
            if let Some(target) = target_opt {
                self.completions = new_completions;
                self.completion_index = Some(0); // Select the first one
                self.is_completing = true;
                // Store target info for applying the completion later
                self.completion_fragment_start = Some(target.fragment_start_index);
                self.completion_fragment_len = Some(target.fragment.len());
            } else {
                // This case might occur if completions were generated but the target info is missing (shouldn't happen with current logic)
                self.cancel_completion();
            }
        } else {
            self.cancel_completion();
        }
    }

    /// Starts completion if not already active, or applies if only one unambiguous option.
    pub fn start_or_apply_completion(&mut self, cwd: &str) {
        if self.is_completing {
            // If already completing, Tab likely means apply (handled elsewhere)
            return;
        }
        let (new_completions, target_opt) = completion::get_completions(&self.input, cwd);
        match new_completions.len() {
            0 => self.cancel_completion(),
            1 => {
                 // Apply immediately if only one option
                 if let Some(target) = target_opt {
                     let selected_completion = new_completions[0].clone(); // Clone before potentially modifying state
                     self.completions = new_completions;
                     self.completion_index = Some(0);
                     self.completion_fragment_start = Some(target.fragment_start_index);
                     self.completion_fragment_len = Some(target.fragment.len());
                     if self.apply_completion() { // Apply the single completion
                         // If it was a directory, update completions immediately
                         if selected_completion.ends_with('/') {
                            self.update_completions(cwd);
                         }
                     }
                 } else {
                      self.cancel_completion(); // Should have target if completions exist
                 }
            }
            _ => {
                // Multiple options, enter completion mode
                 if let Some(target) = target_opt {
                    self.completions = new_completions;
                    self.completion_index = Some(0); // Select the first one
                    self.is_completing = true;
                    self.completion_fragment_start = Some(target.fragment_start_index);
                    self.completion_fragment_len = Some(target.fragment.len());
                } else {
                    self.cancel_completion(); // Should have target if completions exist
                }
            }
        }
    }

    /// Cycles through the completion list.
    pub fn cycle_completion(&mut self, forward: bool) {
        if !self.is_completing || self.completions.is_empty() {
            return;
        }
        let current_index = self.completion_index.unwrap_or(0);
        let next_index = if forward {
            (current_index + 1) % self.completions.len()
        } else {
            (current_index + self.completions.len() - 1) % self.completions.len()
        };
        self.completion_index = Some(next_index);
    }

    /// Applies the currently selected completion to the input field.
    /// Returns true if a completion was successfully applied.
    pub fn apply_completion(&mut self) -> bool {
        if let (Some(index), Some(start), Some(len)) =
            (self.completion_index, self.completion_fragment_start, self.completion_fragment_len)
        {
            if let Some(selected_completion) = self.completions.get(index).cloned() {
                // Replace the fragment in the input string
                let end = start + len;
                if end <= self.input.len() { // Basic sanity check
                    self.input.replace_range(start..end, &selected_completion);

                    let is_dir = selected_completion.ends_with('/');
                    self.cancel_completion(); // Exit completion mode after applying

                    // Return true, let the caller decide if update_completions is needed (e.g., for dirs)
                    return true;
                } else {
                    // Index out of bounds - indicates an issue, cancel
                    self.cancel_completion();
                    return false;
                }
            }
        }
        // If no index or target info, cancel
        self.cancel_completion();
        false
    }

    /// Cancels the current completion mode.
    pub fn cancel_completion(&mut self) {
        self.is_completing = false;
        self.completions.clear();
        self.completion_index = None;
        self.completion_fragment_start = None;
        self.completion_fragment_len = None;
    }
}
