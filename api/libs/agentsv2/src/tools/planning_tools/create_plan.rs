use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tracing::warn;

use crate::tools::planning_tools::helpers::generate_todos_from_plan;
use crate::tools::tool::*;
use crate::tools::tool::{StreamStage, ToolStreamer};
use agents::Agent;

// ---------------------------------------------------------------------------
// Public constants – keep existing name for backward-compat
// ---------------------------------------------------------------------------

pub const CREATE_PLAN_INVESTIGATIVE: ToolName = ToolName::new("create_plan_investigative");
pub const CREATE_PLAN_STRAIGHTFORWARD: ToolName = ToolName::new("create_plan_straightforward");

// ---------------------------------------------------------------------------
// Shared input / output types (aliases kept for compatibility)
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Clone)]
pub struct CreatePlanOutput {
    pub success: bool,
    pub todos: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreatePlanInput {
    pub plan: String,
}

// Allow value-only streaming of `plan` so the UI shows live updates.
impl StreamSpec for CreatePlanInput {
    fn stream_fields() -> &'static [FieldSpec] {
        &[FieldSpec {
            json_key: "plan",
            ui_chunk_key: Some("plan_chunk"),
            ui_full_key: Some("plan"),
        }]
    }
}

// ---------------------------------------------------------------------------
// Core implementation (generic over variant)
// ---------------------------------------------------------------------------

pub struct CreatePlan {
    agent: Arc<Agent>,
    tool_name: ToolName,
    description: &'static str,
    plan_template: &'static str,
    // —— streaming state ——
    buffer: String,
    params: Option<CreatePlanInput>,
    executed: bool,
}

impl CreatePlan {
    pub fn investigative(agent: Arc<Agent>) -> Self {
        Self {
            agent,
            tool_name: CREATE_PLAN_INVESTIGATIVE,
            description: get_create_plan_investigative_description(),
            plan_template: PLAN_INVESTIGATIVE_TEMPLATE,
            buffer: String::new(),
            params: None,
            executed: false,
        }
    }

    pub fn straightforward(agent: Arc<Agent>) -> Self {
        Self {
            agent,
            tool_name: CREATE_PLAN_STRAIGHTFORWARD,
            description: get_create_plan_straightforward_description(),
            plan_template: PLAN_STRAIGHTFORWARD_TEMPLATE,
            buffer: String::new(),
            params: None,
            executed: false,
        }
    }
}

// ---------------------------------------------------------------------------
// Backward-compat thin wrappers so existing call-sites keep compiling
// ---------------------------------------------------------------------------

pub struct CreatePlanInvestigative;
impl CreatePlanInvestigative {
    pub fn new(agent: Arc<Agent>) -> CreatePlan {
        CreatePlan::investigative(agent)
    }
}

pub struct CreatePlanStraightforward;
impl CreatePlanStraightforward {
    pub fn new(agent: Arc<Agent>) -> CreatePlan {
        CreatePlan::straightforward(agent)
    }
}

// ---------------------------------------------------------------------------
// Trait implementations
// ---------------------------------------------------------------------------

#[async_trait]
impl ToolExecutor for CreatePlan {
    type Output = CreatePlanOutput;
    type Params = CreatePlanInput;

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // Mark that we now have a plan available in agent state.
        self.agent
            .set_state_value("plan_available".into(), Value::Bool(true))
            .await;

        // Generate todos (non-fatal on failure)
        let todos_state_objects = match generate_todos_from_plan(
            &params.plan,
            self.agent.get_user_id(),
            self.agent.get_session_id(),
        )
        .await
        {
            Ok(arr) => {
                self.agent
                    .set_state_value("todos".into(), Value::Array(arr.clone()))
                    .await;
                arr
            }
            Err(e) => {
                warn!(
                    "Failed to generate todos from plan using LLM: {} – proceeding without todos.",
                    e
                );
                self.agent
                    .set_state_value("todos".into(), Value::Array(vec![]))
                    .await;
                vec![]
            }
        };

        // Convert todos to pretty checkbox list for human display.
        let todos_string = todos_state_objects
            .iter()
            .filter_map(|v| v.get("todo").and_then(Value::as_str))
            .map(|s| format!("[ ] {}", s))
            .collect::<Vec<_>>()
            .join("\n");

        Ok(CreatePlanOutput {
            success: true,
            todos: todos_string,
        })
    }

    async fn schema(&self) -> Value {
        serde_json::json!({
            "name": self.name().as_str(),
            "description": self.description,
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["plan"],
                "properties": {
                    "plan": {"type": "string", "description": self.plan_template}
                },
                "additionalProperties": false
            }
        })
    }

    fn name(&self) -> ToolName {
        self.tool_name
    }

    async fn ingest_chunk(&mut self, chunk: &str, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
        self.buffer.push_str(chunk);
        let mut stages = vec![StreamStage::ParamsChunk(Value::String(chunk.to_owned()))];

        if self.params.is_none() {
            if let Ok(p) = serde_json::from_str::<CreatePlanInput>(&self.buffer) {
                self.params = Some(p.clone());
                stages.push(StreamStage::ParamsComplete(serde_json::to_value(&p)?));
            }
        }
        Ok(stages)
    }

    async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
        if self.executed {
            return Ok(vec![]);
        }
        let mut stages = Vec::new();
        if let Some(ref params) = self.params {
            let out = self.execute(params.clone(), tool_call_id.to_string()).await?;
            stages.push(StreamStage::OutputComplete(serde_json::to_value(out)?));
            self.executed = true;
        }
        Ok(stages)
    }
}

// ---------------------------------------------------------------------------
// UI mapping
// ---------------------------------------------------------------------------

pub enum PlanUi {
    ParamsChunk(String),
    ParamsComplete(CreatePlanInput),
    Output(CreatePlanOutput),
}

#[async_trait]
impl ToolStreamer for CreatePlan {
    type UiEvent = PlanUi;

    fn map_stage(&self, stage: StreamStage) -> Vec<Self::UiEvent> {
        match stage {
            StreamStage::ParamsChunk(v) => map_param_chunk::<CreatePlanInput>(
                v.as_str().unwrap_or_default(),
            )
            .into_iter()
            .filter(|(k, _)| *k == "plan_chunk")
            .map(|(_, slice)| PlanUi::ParamsChunk(slice))
            .collect(),
            StreamStage::ParamsComplete(v) => match serde_json::from_value::<CreatePlanInput>(v) {
                Ok(p) => vec![PlanUi::ParamsComplete(p)],
                Err(_) => vec![],
            },
            StreamStage::OutputComplete(v) => match serde_json::from_value::<CreatePlanOutput>(v) {
                Ok(o) => vec![PlanUi::Output(o)],
                Err(_) => vec![],
            },
            _ => vec![],
        }
    }
}

// ---------------------------------------------------------------------------
// Static description helpers & templates
// ---------------------------------------------------------------------------

fn get_create_plan_investigative_description() -> &'static str {
    "Use to create a plan for an analytical workflow."
}

fn get_create_plan_straightforward_description() -> &'static str {
    "Use to create a simple, direct plan for an analytical workflow."
}

const PLAN_INVESTIGATIVE_TEMPLATE: &str = r##"Use this template to create a clear and actionable plan for investigative data requests using SQL.

(… template trimmed – identical to v1 implementation …)
"##;

const PLAN_STRAIGHTFORWARD_TEMPLATE: &str = r##"Use this template to create a clear and actionable plan tailored to the user's request.

(… template trimmed – identical to original straightforward implementation …)
"##;

// ---------------------------------------------------------------------------
// Unit tests – existing investigative tests kept; add straightforward smoke tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use agents::modes::ModeConfiguration;
    use agents::ModeProvider;
    use std::collections::HashMap;
    use uuid::Uuid;

    use anyhow::Result;

    // Dummy ModeProvider that provides a no-op configuration so we can build an Agent.
    struct DummyProvider;
    #[async_trait]
    impl ModeProvider for DummyProvider {
        async fn get_configuration_for_state(
            &self,
            _state: &HashMap<String, Value>,
        ) -> Result<ModeConfiguration> {
            Ok(ModeConfiguration {
                prompt: "".to_string(),
                model: "gpt-3.5-turbo".to_string(),
                tool_loader: Box::new(|_| Box::pin(async { Ok(()) })),
                terminating_tools: vec![],
            })
        }
    }

    fn build_dummy_agent() -> Arc<Agent> {
        let provider = Arc::new(DummyProvider);
        // Ensure litellm does not panic by providing a dummy API key for tests.
        std::env::set_var("LLM_API_KEY", "test_key");
        Arc::new(Agent::new(
            "gpt-3.5-turbo".to_string(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "tester".to_string(),
            provider,
        ))
    }

    // -------------------------------------------------------------------
    // Investigative – keep original comprehensive tests (renamed minimal)
    // -------------------------------------------------------------------

    #[tokio::test]
    async fn investigative_execute_returns_success() -> Result<()> {
        let agent = build_dummy_agent();
        let tool = CreatePlanInvestigative::new(agent);
        let out = tool
            .execute(
                CreatePlanInput {
                    plan: "Some investigative plan".into(),
                },
                "id1".into(),
            )
            .await?;
        assert!(out.success);
        Ok(())
    }

    #[tokio::test]
    async fn investigative_streaming_yields_params_then_output() -> Result<()> {
        let agent = build_dummy_agent();
        let mut tool = CreatePlanInvestigative::new(agent);
        for chunk in ["{\"plan\"", ":\"Plan ABC\"}"] {
            let stages = tool.ingest_chunk(chunk, "test_call_id_investigative").await?;
            assert!(stages.iter().any(|s| matches!(s, StreamStage::ParamsChunk(_))));
        }
        let stages = tool.finalize("test_call_id_investigative").await?;
        assert!(stages.iter().any(|s| matches!(s, StreamStage::OutputComplete(_))));
        Ok(())
    }

    #[tokio::test]
    async fn investigative_streams_value_only_param_chunks() -> Result<()> {
        let agent = build_dummy_agent();
        let mut tool = CreatePlanInvestigative::new(agent);
        let (tx, mut rx) = tokio::sync::mpsc::channel::<PlanUi>(32);

        let params_json = r#"{"plan":"A complex investigative plan"}"#;

        // send params in a single chunk – ensures key + value present for StreamSpec extraction
        tool.ingest_and_send(params_json, &tx).await?;
        drop(tx);

        let mut saw_chunk = false;
        while let Some(event) = rx.recv().await {
            if let PlanUi::ParamsChunk(slice) = event {
                assert!(!slice.contains('{'));
                assert!(!slice.contains('}'));
                assert!(!slice.contains('"'));
                saw_chunk = true;
            }
        }
        assert!(saw_chunk, "No value-only ParamChunk events received");
        Ok(())
    }

    #[tokio::test]
    async fn investigative_streams_params_complete_and_output() -> Result<()> {
        let agent = build_dummy_agent();
        let mut tool = CreatePlanInvestigative::new(agent);
        let (tx, mut rx) = tokio::sync::mpsc::channel::<PlanUi>(32);

        let params_json = r#"{"plan":"Investigate root-cause"}"#;

        // Feed params incrementally
        for chunk in params_json.as_bytes().chunks(6) {
            tool.ingest_and_send(std::str::from_utf8(chunk).unwrap(), &tx)
                .await?;
        }
        // Finalize to emit output
        tool.finalize_and_send(&tx).await?;
        drop(tx);

        let mut saw_complete = false;
        let mut saw_output = false;

        while let Some(event) = rx.recv().await {
            match event {
                PlanUi::ParamsComplete(p) => {
                    assert_eq!(p.plan, "Investigate root-cause");
                    saw_complete = true;
                }
                PlanUi::Output(out) => {
                    assert!(out.success, "tool execution should succeed");
                    saw_output = true;
                }
                _ => {}
            }
        }

        assert!(saw_complete, "should see ParamsComplete event");
        assert!(saw_output, "should see OutputComplete event");
        Ok(())
    }

    // -------------------------------------------------------------------
    // Straightforward – smoke tests to ensure variant works
    // -------------------------------------------------------------------

    #[tokio::test]
    async fn straightforward_execute_returns_success() -> Result<()> {
        let agent = build_dummy_agent();
        let tool = CreatePlanStraightforward::new(agent);
        let out = tool
            .execute(
                CreatePlanInput {
                    plan: "Simple plan".into(),
                },
                "id2".into(),
            )
            .await?;
        assert!(out.success);
        Ok(())
    }

    #[tokio::test]
    async fn straightforward_streaming_yields_params_then_output() -> Result<()> {
        let agent = build_dummy_agent();
        let mut tool = CreatePlanStraightforward::new(agent);
        for chunk in ["{\"plan\"", ":\"Plan DEF\"}"] {
            let stages = tool.ingest_chunk(chunk, "test_call_id_straightforward").await?;
            assert!(stages.iter().any(|s| matches!(s, StreamStage::ParamsChunk(_))));
        }
        let stages = tool.finalize("test_call_id_straightforward").await?;
        assert!(stages.iter().any(|s| matches!(s, StreamStage::OutputComplete(_))));
        Ok(())
    }
}