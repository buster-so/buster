use agentsv2::agents::agent::{GenericAgent, ModeConfig, ModeProvider, State, AgentError, AgentStatus};
use agentsv2::tools::tool::{ToolExecutor, ToolName, StreamStage};
use anyhow::Result;
use async_trait::async_trait;
use dotenv::dotenv;
use litellm::{LiteLlmMessage, MessageProgress, ToolCall, FunctionCall};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

// 1. Define a simple state
#[derive(Debug, Clone, Default)]
struct IntegrationTestState {
    // Add any state properties if needed for more complex tests
}

// 2. Define a ModeProvider
struct EchoToolModeProvider {
    tool_name: String,
}

#[async_trait]
impl ModeProvider<IntegrationTestState> for EchoToolModeProvider {
    async fn configuration(&self, _state: &IntegrationTestState) -> Result<ModeConfig<IntegrationTestState>> {
        let captured_tool_name = self.tool_name.clone(); // Clone tool_name before the closure
        Ok(ModeConfig {
            prompt: format!(
                "You are a helpful assistant. You have a tool named '{}'. \\
                 When the user asks you to echo something, please use this tool. \\
                 The tool takes one string parameter: 'text_to_echo'.",
                self.tool_name // self.tool_name is still fine here for the prompt
            ),
            model: "gpt-4o-mini".to_string(), // Or any model configured in your LiteLLM setup
            tool_loader: Arc::new(move |agent: &GenericAgent<IntegrationTestState>| {
                let tool_name_for_async = captured_tool_name.clone(); 
                let agent_clone = agent.clone(); // Clone the agent
                Box::pin(async move {
                    agent_clone.add_tool( // Use the cloned agent
                        tool_name_for_async, 
                        SimpleEchoTool::default(),
                        None::<fn(&IntegrationTestState) -> bool>
                    ).await;
                    Ok(())
                })
            }),
            terminating_tools: vec![],
            should_terminate: Arc::new(|_s: &IntegrationTestState| false), // Terminate after one interaction for this test
        })
    }
}

// 3. Define a simple tool
#[derive(Default, Debug)]
struct SimpleEchoTool {
    buffer: String,
    params: Option<EchoParams>,
}

const SIMPLE_ECHO_TOOL_NAME: ToolName = ToolName::new("simple_echo_tool");

#[derive(Serialize, Deserialize, Debug, Clone)]
struct EchoParams {
    text_to_echo: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct EchoOutput {
    echoed_text: String,
}

#[async_trait]
impl ToolExecutor for SimpleEchoTool {
    type Output = EchoOutput;
    type Params = EchoParams;

    fn name(&self) -> ToolName {
        SIMPLE_ECHO_TOOL_NAME
    }

    async fn schema(&self) -> serde_json::Value {
        json!({
            "name": self.name().as_str(),
            "description": "Echoes back the provided text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text_to_echo": {
                        "type": "string",
                        "description": "The text to echo back."
                    }
                },
                "required": ["text_to_echo"]
            }
        })
    }
    
    async fn ingest_chunk(&mut self, chunk: &str, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
        self.buffer.push_str(chunk);
        if self.params.is_none() {
            if let Ok(params) = serde_json::from_str::<EchoParams>(&self.buffer) {
                self.params = Some(params.clone());
                return Ok(vec![StreamStage::ParamsComplete(serde_json::to_value(params)?)]);
            }
        }
        Ok(vec![])
    }

    async fn execute(&self, params: Self::Params, _id: String) -> Result<Self::Output> {
        Ok(EchoOutput {
            echoed_text: params.text_to_echo,
        })
    }

    async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
        if let Some(params) = self.params.clone() {
            let output = self.execute(params, tool_call_id.to_string()).await?;
            Ok(vec![StreamStage::OutputComplete(serde_json::to_value(output)?)])
        } else {
            Err(anyhow::anyhow!("Parameters not fully ingested for SimpleEchoTool"))
        }
    }
}


#[tokio::test]
async fn litellm_tool_execution_test() -> Result<()> {
    // Load .env file if present (for API keys)
    dotenv().ok();

    // Removed explicit API key checks as per user request
    
    let user_id = Uuid::new_v4();
    let session_id = Uuid::new_v4();
    let agent_name = "integration_test_agent".to_string();
    let initial_state = IntegrationTestState::default();
    
    let mode_provider = Arc::new(EchoToolModeProvider { tool_name: SIMPLE_ECHO_TOOL_NAME.as_str().to_string() });

    // Create agent - this will use the real LiteLLMClient via LiteLLMClient::default()
    let agent = GenericAgent::new(
        agent_name.clone(),
        initial_state,
        mode_provider,
        user_id,
        session_id,
    );

    // The tool_loader in EchoToolModeProvider will register the tool.
    
    let text_to_echo = "Hello from LiteLLM integration test!";
    let mut conversation = vec![LiteLlmMessage::user(
        format!("Please use the echo tool to say '{}'", text_to_echo)
    )];

    let mut stream_rx = agent.get_stream_receiver().await.expect("Stream should be available");
    
    // Run the conversation
    let agent_status = agent.run_conversation(&mut conversation).await;

    // Assertions
    match agent_status {
        Ok(AgentStatus::Terminated) => { /* Expected for this test if mode terminates */ },
        Ok(status) => {
            // If the mode provider doesn't terminate immediately, we might get Continue.
            // For this test, we expect one interaction and then we'd typically check state.
            // Here, we're primarily checking the conversation history.
            println!("Agent status: {:?}", status);
        }
        Err(e) => return Err(anyhow::anyhow!("Agent run_conversation failed: {:?}", e)),
    }
    
    // ---- Verify stream ----
    let mut assistant_tool_call_streamed = false;
    let mut tool_result_streamed = false;
    let mut done_streamed = false;

    loop {
        match tokio::time::timeout(std::time::Duration::from_secs(10), stream_rx.recv()).await {
            Ok(Ok(msg_result)) => {
                match msg_result {
                    Ok(msg) => {
                        match msg {
                            LiteLlmMessage::Assistant { tool_calls: Some(tc), progress, .. } => {
                                if let Some(first_call) = tc.first() {
                                    if first_call.function.name == SIMPLE_ECHO_TOOL_NAME.as_str() {
                                        assistant_tool_call_streamed = true;
                                        if progress == MessageProgress::Complete {
                                            let params: EchoParams = serde_json::from_str(&first_call.function.arguments)?;
                                            assert_eq!(params.text_to_echo, text_to_echo, "Streamed tool call params mismatch");
                                        }
                                    }
                                }
                            }
                            LiteLlmMessage::Tool { name: Some(tool_name), content, tool_call_id, progress, .. } => {
                                if tool_name == SIMPLE_ECHO_TOOL_NAME.as_str() && progress == MessageProgress::Complete {
                                    tool_result_streamed = true;
                                    let output: EchoOutput = serde_json::from_str(&content)?;
                                    assert_eq!(output.echoed_text, text_to_echo, "Streamed tool output mismatch");
                                }
                            }
                            LiteLlmMessage::Done => {
                                done_streamed = true;
                                break;
                            }
                            _ => {}
                        }
                    }
                    Err(e) => {
                        eprintln!("Stream error: {:?}", e);
                    }
                }
            }
            Ok(Err(broadcast::error::RecvError::Lagged(_))) => {
                 eprintln!("Stream lagged"); continue;
            }
            Ok(Err(broadcast::error::RecvError::Closed)) => {
                eprintln!("Stream closed prematurely"); break;
            }
            Err(_) => {
                eprintln!("Stream receive timeout"); break; // Timeout
            }
        }
    }

    assert!(assistant_tool_call_streamed, "Assistant tool call was not streamed.");
    assert!(tool_result_streamed, "Tool result was not streamed.");
    assert!(done_streamed, "Done message was not streamed.");


    // ---- Verify conversation history ----
    // Conversation should be: User -> Assistant (ToolCall) -> Tool (Result)
    // Depending on ModeProvider's should_terminate, there might be a final Assistant message.
    // For this test, we expect at least 3 messages.
    assert!(conversation.len() >= 3, "Conversation should have at least 3 messages. Got: {} {:?}", conversation.len(), conversation);

    // 1. User message (already there)
    // 2. Assistant message with ToolCall
    let assistant_message = conversation.get(1).ok_or_else(|| anyhow::anyhow!("Missing assistant message in conversation"))?;
    let mut found_assistant_tool_call_in_history = false;
    if let LiteLlmMessage::Assistant { tool_calls: Some(tool_calls), .. } = assistant_message {
        if let Some(tc) = tool_calls.first() {
            assert_eq!(tc.function.name, SIMPLE_ECHO_TOOL_NAME.as_str(), "Assistant message tool name mismatch");
            let params: EchoParams = serde_json::from_str(&tc.function.arguments)?;
            assert_eq!(params.text_to_echo, text_to_echo, "Assistant message tool arguments mismatch");
            found_assistant_tool_call_in_history = true;
        }
    }
    assert!(found_assistant_tool_call_in_history, "Assistant message with correct tool call not found in history.");


    // 3. Tool message with result
    let tool_message = conversation.get(2).ok_or_else(|| anyhow::anyhow!("Missing tool message in conversation"))?;
    let mut found_tool_result_in_history = false;
    if let LiteLlmMessage::Tool { name: Some(tool_name), content, .. } = tool_message {
        assert_eq!(tool_name, SIMPLE_ECHO_TOOL_NAME.as_str(), "Tool message name mismatch");
        let output: EchoOutput = serde_json::from_str(content)?;
        assert_eq!(output.echoed_text, text_to_echo, "Tool message output mismatch");
        found_tool_result_in_history = true;
    }
    assert!(found_tool_result_in_history, "Tool message with correct result not found in history.");
    
    println!("Integration test completed successfully. Conversation: {:#?}", conversation);

    Ok(())
}


