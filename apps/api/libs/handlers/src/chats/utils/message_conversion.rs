use anyhow::Result;
use litellm::{AgentMessage, MessageProgress, ToolCall};
use serde_json::{json, Value};

/// Converts AgentMessage to CoreMessage format (AI SDK compatible)
/// This ensures that messages saved to the database can be properly loaded
/// and used by the TypeScript AI workflows
pub fn agent_message_to_core_message(msg: &AgentMessage) -> Result<Value> {
    match msg {
        AgentMessage::Developer { content, .. } => Ok(json!({
            "role": "system",
            "content": content
        })),
        
        AgentMessage::User { content, .. } => Ok(json!({
            "role": "user",
            "content": content
        })),
        
        AgentMessage::Assistant { content, tool_calls, .. } => {
            let mut message = json!({
                "role": "assistant",
            });
            
            // Handle content - can be text or array of content items
            if let Some(tool_calls) = tool_calls {
                // If there are tool calls, create an array of content items
                let mut content_array = Vec::new();
                
                // Add text content if present
                if let Some(text) = content {
                    content_array.push(json!({
                        "type": "text",
                        "text": text
                    }));
                }
                
                // Add tool calls
                for tool_call in tool_calls {
                    content_array.push(json!({
                        "type": "tool-call",
                        "toolCallId": tool_call.id,
                        "toolName": tool_call.function.name,
                        "args": serde_json::from_str::<Value>(&tool_call.function.arguments)
                            .unwrap_or_else(|_| json!({}))
                    }));
                }
                
                message["content"] = json!(content_array);
            } else if let Some(text) = content {
                // No tool calls, just text content
                message["content"] = json!(text);
            } else {
                // No content at all
                message["content"] = json!("");
            }
            
            Ok(message)
        },
        
        AgentMessage::Tool { tool_call_id, content, name, .. } => {
            // Tool messages should have an array of tool results
            let tool_result = json!({
                "type": "tool-result",
                "toolCallId": tool_call_id,
                "toolName": name.as_ref().unwrap_or(&"unknown".to_string()),
                "result": serde_json::from_str::<Value>(content)
                    .unwrap_or_else(|_| json!({ "output": content }))
            });
            
            Ok(json!({
                "role": "tool",
                "content": [tool_result]
            }))
        },
        
        AgentMessage::Done => Ok(json!({
            "role": "system",
            "content": "Done"
        })),
    }
}

/// Converts a vector of AgentMessages to CoreMessage format
pub fn convert_messages_to_core_format(messages: &[AgentMessage]) -> Result<Vec<Value>> {
    messages
        .iter()
        .map(agent_message_to_core_message)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_user_message_conversion() {
        let msg = AgentMessage::User {
            id: None,
            content: "Hello world".to_string(),
            name: None,
        };
        let core_msg = agent_message_to_core_message(&msg).unwrap();
        
        assert_eq!(core_msg["role"], "user");
        assert_eq!(core_msg["content"], "Hello world");
    }
    
    #[test]
    fn test_assistant_with_tool_call() {
        let tool_call = ToolCall {
            id: "call_123".to_string(),
            function: litellm::Function {
                name: "import_assets".to_string(),
                arguments: r#"{"files": []}"#.to_string(),
            },
        };
        
        let msg = AgentMessage::Assistant {
            id: Some("assistant_123".to_string()),
            content: None,
            name: None,
            tool_calls: Some(vec![tool_call]),
            progress: MessageProgress::Complete,
            initial: false,
        };
        
        let core_msg = agent_message_to_core_message(&msg).unwrap();
        
        assert_eq!(core_msg["role"], "assistant");
        assert!(core_msg["content"].is_array());
        let content = core_msg["content"].as_array().unwrap();
        assert_eq!(content.len(), 1);
        assert_eq!(content[0]["type"], "tool-call");
        assert_eq!(content[0]["toolName"], "import_assets");
    }
    
    #[test]
    fn test_tool_result_conversion() {
        let msg = AgentMessage::Tool {
            id: None,
            content: r#"{"success": true, "files": []}"#.to_string(),
            tool_call_id: "call_123".to_string(),
            name: Some("import_assets".to_string()),
            progress: MessageProgress::Complete,
        };
        
        let core_msg = agent_message_to_core_message(&msg).unwrap();
        
        assert_eq!(core_msg["role"], "tool");
        assert!(core_msg["content"].is_array());
        let content = core_msg["content"].as_array().unwrap();
        assert_eq!(content.len(), 1);
        assert_eq!(content[0]["type"], "tool-result");
        assert_eq!(content[0]["toolCallId"], "call_123");
        assert_eq!(content[0]["toolName"], "import_assets");
    }
}