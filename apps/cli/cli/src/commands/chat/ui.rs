use ratatui::{
    prelude::*,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph, Wrap},
};
use crate::commands::chat::state::{AppState, DisplayLogEntry};
use chrono::{DateTime, Local};

// --- Ratatui UI Rendering ---
pub fn ui(frame: &mut Frame, app: &mut AppState, cwd: &str) {
    let show_completions = app.is_completing && !app.completions.is_empty();
    let completion_height = if show_completions {
         // Limit height to avoid taking too much space, +1 for border
        (app.completions.len() as u16).min(5) + 1
    } else {
        0
    };

    let status_height = if app.active_tool_calls.is_empty()
        && !app.is_agent_processing
        && app.current_error.is_none()
    {
        0
    } else {
        // Calculate required height for status lines dynamically +1 for border
        let tool_call_lines = app.active_tool_calls.len() as u16;
        let thinking_line = if app.is_agent_processing && app.active_tool_calls.is_empty() { 1 } else { 0 };
        let error_line = if app.current_error.is_some() { 1 } else { 0 };
        tool_call_lines + thinking_line + error_line + 1 // +1 border
    };

    let main_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(1), // Messages/Welcome
            Constraint::Length(status_height), // Status area
            Constraint::Length(3), // Input area
            Constraint::Length(completion_height), // Completions (dynamic)
        ])
        .split(frame.size());

    let has_any_message = !app.messages.is_empty();

    // --- Main Content Area (Messages or Welcome) ---
    if !has_any_message && app.display_log.is_empty() {
        render_welcome(frame, main_chunks[0], cwd);
    } else {
        render_messages(frame, app, main_chunks[0]);
    }

    // --- Status Area --- 
    render_status(frame, app, main_chunks[1]);

    // --- Input Area ---
    render_input(frame, app, main_chunks[2]);

    // --- Completions Area ---
     if show_completions {
        render_completions(frame, app, main_chunks[3]);
    }
}

fn render_welcome(frame: &mut Frame, area: Rect, cwd: &str) {
     let welcome_tips_chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(4),
                Constraint::Length(5),
                Constraint::Min(0),
            ])
            .split(area);

    let welcome_title = Span::styled(
        "* Welcome to Buster CLI! *",
        Style::default()
            .fg(Color::Yellow)
            .add_modifier(Modifier::BOLD),
    );
    let cwd_text = Line::from(format!("  cwd: {}", cwd).fg(Color::DarkGray));
    let welcome_text = vec![
        welcome_title.into(),
        Line::from(""),
        Line::from("  Type your request and press Enter."),
        cwd_text,
    ];
    let welcome_box = Paragraph::new(welcome_text).block(
        Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Rgb(255, 165, 0))),
    );
    frame.render_widget(welcome_box, welcome_tips_chunks[0]);

    let tips_title = Line::from("Tips:");
    let tip1 = Line::from("1. Ask questions about files (e.g., 'summarize README.md')");
    let tip2 = Line::from("2. Ask to edit files (e.g., 'replace foo with bar in main.rs')");
    let tip3 = Line::from("3. Run commands (e.g., 'run git status')");
    let tips_text = vec![Line::from(""), tips_title, tip1, tip2, tip3];
    let tips_widget = Paragraph::new(tips_text);
    frame.render_widget(tips_widget, welcome_tips_chunks[1]);
}

fn render_messages(frame: &mut Frame, app: &mut AppState, area: Rect) {
    use litellm::{AgentMessage, MessageProgress};
    let mut message_lines: Vec<Line> = Vec::new();

    // --- Render Agent Messages ---
    let num_messages = app.messages.len();
    for (msg_index, msg) in app.messages.iter().enumerate() {
        match msg {
            AgentMessage::User { content, .. } => {
                message_lines.push(Line::from(vec![
                    Span::styled("> ", Style::default().fg(Color::Green)),
                    Span::styled(content, Style::default().fg(Color::White)),
                ]));
                message_lines.push(Line::from("")); // Space after user message
            }
            AgentMessage::Assistant { content, progress, name, .. } => {
                let is_in_progress = *progress == MessageProgress::InProgress;
                let is_last_message = msg_index == num_messages - 1;

                // Find the index of the previous non-Developer message
                let prev_non_dev_index = app.messages[..msg_index].iter().rposition(|m| !matches!(m, AgentMessage::Developer { .. }));
                // Check if the message *immediately* before this one was a Developer message
                let prev_msg_was_dev = if msg_index > 0 {
                    matches!(app.messages.get(msg_index - 1), Some(AgentMessage::Developer { .. }))
                } else {
                    false
                };

                // Omit prefix if it's the last message AND the previous was a tool result/dev message
                let show_prefix = !(is_last_message && prev_msg_was_dev && !is_in_progress);

                let prefix = if show_prefix {
                     Some(Span::styled(
                        format!(
                            "{} {}: ",
                            if is_in_progress { "…" } else { "•" },
                            name.as_deref().unwrap_or("Assistant")
                        ),
                        Style::default()
                            .fg(Color::Cyan)
                            .add_modifier(Modifier::BOLD),
                    ))
                } else {
                    None // Don't show prefix
                };

                if let Some(c) = content {
                    let lines: Vec<&str> = c.split('\n').collect();
                    for (i, line_content) in lines.iter().enumerate() {
                        let line_span = Span::styled(*line_content, Style::default().fg(Color::White));
                        if i == 0 {
                             if let Some(p) = prefix.clone() {
                                message_lines.push(Line::from(vec![p, line_span]));
                             } else {
                                // No prefix, just the content line
                                message_lines.push(Line::from(line_span));
                             }
                        } else {
                            // Indent subsequent lines (relative to prefix or start)
                            let indent_len = prefix.as_ref().map_or(0, |p| p.content.len());
                            let indent = " ".repeat(indent_len);
                             message_lines.push(Line::from(vec![
                                Span::raw(indent),
                                line_span,
                            ]));
                        }
                    }
                } else if let Some(p) = prefix {
                    // Show prefix even if content is None (e.g., for InProgress)
                    message_lines.push(Line::from(p));
                }

                if !is_in_progress {
                    message_lines.push(Line::from("")); // Space after assistant message
                }
            }
            AgentMessage::Developer { content, name, .. } => {
                // Render tool call/result messages (usually transient)
                let prefix = Span::styled(
                    format!("{} {}: ", "🔩", name.as_deref().unwrap_or("Tool")), // Use a gear icon
                    Style::default().fg(Color::DarkGray).add_modifier(Modifier::ITALIC),
                );
                let content_style = Style::default().fg(Color::DarkGray).add_modifier(Modifier::ITALIC);

                let lines: Vec<&str> = content.split('\n').collect();
                for (i, line_content) in lines.iter().enumerate() {
                    let line_span = Span::styled(*line_content, content_style);
                    if i == 0 {
                        message_lines.push(Line::from(vec![prefix.clone(), line_span]));
                    } else {
                        message_lines.push(Line::from(vec![
                            Span::raw("  "), // Indent subsequent lines
                            line_span,
                        ]));
                    }
                }
                // No extra space after developer message, often followed by Assistant msg
            }
            _ => {} // Ignore other message types for history display
        }
    }

    // --- Render Display Log Entries (after Agent messages) ---
    for entry in &app.display_log {
        match entry {
            DisplayLogEntry::ShellCommand { timestamp, command } => {
                let time_str = DateTime::<Local>::from(*timestamp).format("%H:%M:%S").to_string();
                message_lines.push(Line::from(vec![
                    Span::styled(format!("[{}] ", time_str), Style::default().fg(Color::DarkGray)),
                    Span::styled("! ", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                    Span::styled(command, Style::default().fg(Color::Yellow)),
                ]));
            }
            DisplayLogEntry::ShellOutput { timestamp, stdout, stderr, status } => {
                let time_str = DateTime::<Local>::from(*timestamp).format("%H:%M:%S").to_string();
                let status_prefix = format!("  Status: {}", status);
                let status_style = if status.contains("exit code: 0") || status.contains("success") {
                    Style::default().fg(Color::Green)
                } else {
                    Style::default().fg(Color::Red)
                };
                message_lines.push(Line::from(vec![
                     Span::styled(format!("[{}]", time_str), Style::default().fg(Color::DarkGray)),
                     Span::styled(status_prefix, status_style),
                ]));
                if !stdout.is_empty() {
                     message_lines.push(Line::from(Span::styled("  Stdout:", Style::default().fg(Color::DarkGray))));
                     for line in stdout.lines() {
                          message_lines.push(Line::from(Span::styled(format!("    {}", line), Style::default().fg(Color::White))));
                     }
                }
                if !stderr.is_empty() {
                     message_lines.push(Line::from(Span::styled("  Stderr:", Style::default().fg(Color::DarkGray))));
                     for line in stderr.lines() {
                          message_lines.push(Line::from(Span::styled(format!("    {}", line), Style::default().fg(Color::Red))));
                     }
                }
                message_lines.push(Line::from("")); // Space after output
            }
            DisplayLogEntry::ShellError { timestamp, error } => {
                let time_str = DateTime::<Local>::from(*timestamp).format("%H:%M:%S").to_string();
                message_lines.push(Line::from(vec![
                    Span::styled(format!("[{}] ", time_str), Style::default().fg(Color::DarkGray)),
                    Span::styled("Shell Error: ", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD)),
                    Span::styled(error, Style::default().fg(Color::Red)),
                ]));
                 message_lines.push(Line::from("")); // Space after error
            }
            DisplayLogEntry::Info { timestamp, message } => {
                 let time_str = DateTime::<Local>::from(*timestamp).format("%H:%M:%S").to_string();
                 message_lines.push(Line::from(vec![
                     Span::styled(format!("[{}] ", time_str), Style::default().fg(Color::DarkGray)),
                     Span::styled(message, Style::default().fg(Color::Blue)), // Or another suitable color
                 ]));
                 message_lines.push(Line::from("")); // Space after info
            }
        }
    }

    // Add "Thinking..." indicator if processing and no tool calls active
    // (Keep this after rendering all messages)
    if app.is_agent_processing && app.active_tool_calls.is_empty() {
        // Check if the last agent message isn't already an InProgress Assistant message
        let last_agent_msg_is_thinking = matches!(app.messages.last(), Some(AgentMessage::Assistant { progress: MessageProgress::InProgress, .. }));
        if !last_agent_msg_is_thinking {
            message_lines.push(Line::from(Span::styled(
                "🤔 Thinking...",
                 Style::default().fg(Color::Yellow).add_modifier(Modifier::ITALIC),
            )));
        }
    }

    let content_height = message_lines.len() as u16;
    let view_height = area.height;
    let max_scroll = content_height.saturating_sub(view_height).max(0);

    // Handle scroll reset request
    let current_scroll = if app.reset_scroll_request {
        app.scroll_offset = 0; // Reset internal offset
        app.reset_scroll_request = false; // Consume the request
        max_scroll // Scroll to bottom
    } else if app.scroll_offset == 0 {
        max_scroll // Default to bottom if offset is 0
    } else {
        app.scroll_offset.min(max_scroll) // Use existing offset if set
    };

    let messages_widget = Paragraph::new(message_lines)
        .scroll((current_scroll, 0))
        .wrap(Wrap { trim: false });
    frame.render_widget(messages_widget, area);
}

fn render_status(frame: &mut Frame, app: &AppState, area: Rect) {
    if area.height == 0 { return; } // Don't render if no space

    let mut status_items: Vec<ListItem> = Vec::new();

    for tool in &app.active_tool_calls {
        let content_preview = tool.content.as_deref().unwrap_or("");
        let display_content = if content_preview.len() > 50 {
            format!("{}...", &content_preview[..50])
        } else {
            content_preview.to_string()
        };
        status_items.push(ListItem::new(Line::from(vec![
            Span::styled("Tool: ", Style::default().fg(Color::Magenta)),
            Span::styled(
                format!("{} ({})", tool.name, tool.status),
                Style::default().fg(Color::Yellow),
            ),
            Span::styled(
                format!(" {}", display_content),
                Style::default().fg(Color::DarkGray),
            ),
        ])));
    }

    if app.is_agent_processing && app.active_tool_calls.is_empty() {
        status_items.push(ListItem::new(Line::from(Span::styled(
            "Agent is thinking...",
            Style::default().fg(Color::Yellow),
        ))));
    }

    if let Some(err) = &app.current_error {
        status_items.push(ListItem::new(Line::from(Span::styled(
            err,
            Style::default().fg(Color::Red),
        ))));
    }

    let status_list = List::new(status_items).block(
        Block::default()
            .borders(Borders::TOP) // Use only top border
            .border_style(Style::default().fg(Color::DarkGray)),
    );
    frame.render_widget(status_list, area);
}

fn render_input(frame: &mut Frame, app: &AppState, area: Rect) {
    let input_prefix = "> ";
    // Input is disabled visually if agent is processing OR if actively showing completions
    let is_input_disabled = app.is_agent_processing || !app.active_tool_calls.is_empty() || app.is_completing;
    let is_shell_command = app.input.starts_with('!'); // Check for shell command prefix

    let mut input_style = if is_input_disabled {
        Style::default().fg(Color::DarkGray)
    } else {
        Style::default().fg(Color::White)
    };

    // Change color to red if it's a shell command and input is not disabled
    if is_shell_command && !is_input_disabled {
        input_style = input_style.fg(Color::Red);
    }

    let input_widget = Paragraph::new(Line::from(vec![
        Span::styled(input_prefix, input_style),
        Span::styled(&app.input, input_style),
    ]))
    .block(
        Block::default()
            .borders(Borders::ALL)
            .border_style(input_style),
    )
    .wrap(Wrap { trim: false });
    frame.render_widget(input_widget, area);

    // --- Cursor ---
    if !is_input_disabled {
        frame.set_cursor(
            area.x + 1 + input_prefix.len() as u16 + app.input.chars().count() as u16, // +1 for left border
            area.y + 1,
        )
    }
}

// --- NEW FUNCTION for rendering completions ---
fn render_completions(frame: &mut Frame, app: &AppState, area: Rect) {
    if !app.is_completing || app.completions.is_empty() || area.height == 0 {
        return;
    }

    // Calculate visible range based on selection and area height
    let list_height = area.height.saturating_sub(1); // -1 for border
    let selected = app.completion_index.unwrap_or(0);
    let start_index = if selected >= list_height as usize {
        selected.saturating_sub(list_height as usize -1)
    } else {
        0
    };

    // Render the list, potentially starting from a different index to keep selection visible
    let visible_items: Vec<ListItem> = app
        .completions
        .iter()
        .enumerate()
        .skip(start_index)
        .take(list_height as usize)
        .map(|(i, comp)| {
            let style = if Some(i) == app.completion_index {
                Style::default().fg(Color::Black).bg(Color::Yellow)
            } else {
                Style::default().fg(Color::White)
            };
            ListItem::new(Line::from(Span::styled(comp, style)))
        })
        .collect();

    let visible_list = List::new(visible_items)
        .block(Block::default().borders(Borders::TOP).border_style(Style::default().fg(Color::Yellow)));

    frame.render_widget(visible_list, area);
} 