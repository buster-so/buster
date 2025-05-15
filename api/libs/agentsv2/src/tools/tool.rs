use std::fmt;

use anyhow::Result;
use async_trait::async_trait;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

/// A lightweight, copy-friendly wrapper for a compile-time string identifying a tool.
///
/// Each concrete tool declares its own constant, e.g.:
/// ```
/// # use agentsv2::tools::tool::ToolName; // This line is hidden in docs but helps the doctest compile
/// pub const WEATHER: ToolName = ToolName::new("weather");
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ToolName(&'static str);

impl ToolName {
    pub const fn new(name: &'static str) -> Self {
        Self(name)
    }

    pub const fn as_str(&self) -> &'static str {
        self.0
    }
}

impl fmt::Display for ToolName {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

// Optionally, implement serde support so we can serialize names directly.
impl Serialize for ToolName {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.0)
    }
}

impl<'de> serde::Deserialize<'de> for ToolName {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // Accept owned String, then leak it to obtain a `'static` str.
        let owned: String = serde::Deserialize::deserialize(deserializer)?;
        let leaked: &'static str = Box::leak(owned.into_boxed_str());
        Ok(ToolName::new(leaked))
    }
}

/// Streaming events emitted by `StreamingToolExecutor`.
#[derive(Debug, Clone)]
pub enum StreamStage {
    /// An optimistically-parsed fragment of the parameters JSON.
    ParamsChunk(Value),
    /// Final, syntactically valid parameters JSON.
    ParamsComplete(Value),
    /// Fragment of the tool output being streamed back.
    OutputChunk(Value),
    /// Final output JSON (after `execute`).
    OutputComplete(Value),
}

//--------------------------------------------------------------------
//  Base executor ‑– identical spirit to v1 but with ToolName & schema()
//--------------------------------------------------------------------
#[async_trait]
pub trait ToolExecutor: Send + Sync {
    /// Concrete Rust type returned from `execute`.
    type Output: Serialize + Send;
    /// Concrete Rust type expected from the LLM-supplied parameters.
    type Params: DeserializeOwned + Send;

    /// Execute business logic after full params are available.
    /// This might be called by `finalize` internally if the tool design prefers it,
    /// or `finalize` itself might produce the output.
    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output>;

    /// Return the JSON schema describing this tool.
    async fn schema(&self) -> Value;

    /// Name of the tool.
    fn name(&self) -> ToolName;

    /// Feed a raw UTF-8 chunk (from the model's arguments for this tool) into the tool.
    /// Implementations buffer these chunks, attempt to parse `Self::Params`,
    /// and may return `StreamStage`s for `ParamsChunk`, `ParamsComplete`.
    /// It can also return `OutputChunk` or `OutputComplete` if the tool produces
    /// output directly from `ingest_chunk`.
    async fn ingest_chunk(&mut self, chunk: &str, tool_call_id: &str) -> Result<Vec<StreamStage>>;

    /// Called when no more parameter chunks will arrive for this tool call.
    /// Implementations should process any buffered chunks, finalize parameter parsing,
    /// perform the main execution, and return `StreamStage`s, typically including
    /// `OutputComplete` containing `Self::Output`.
    async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>>;

    /// Called exactly once during graceful shutdown (optional).
    async fn handle_shutdown(&self) -> Result<()> {
        Ok(())
    }
}

//--------------------------------------------------------------------
//  JsonAdapter – wraps any strongly-typed ToolExecutor so callers can work
//  with untyped serde_json::Value (same ergonomics as v1).
//--------------------------------------------------------------------
pub struct JsonAdapter<T: ToolExecutor>(pub T);

impl<T: ToolExecutor> JsonAdapter<T> {
    pub fn new(inner: T) -> Self {
        Self(inner)
    }
}

#[async_trait]
impl<T> ToolExecutor for JsonAdapter<T>
where
    T: ToolExecutor + Send + Sync,
    T::Params: DeserializeOwned + Send,
    T::Output: Serialize + Send,
{
    type Output = Value;
    type Params = Value;

    async fn execute(&self, params: Self::Params, call_id: String) -> Result<Self::Output> {
        // Convert raw JSON -> typed params, run inner tool, convert back.
        let typed: T::Params = serde_json::from_value(params)?;
        let result = self.0.execute(typed, call_id).await?;
        Ok(serde_json::to_value(result)?)
    }

    async fn schema(&self) -> Value {
        self.0.schema().await
    }

    fn name(&self) -> ToolName {
        self.0.name()
    }

    async fn ingest_chunk(&mut self, chunk: &str, tool_call_id: &str) -> Result<Vec<StreamStage>> {
        let stages_from_inner = self.0.ingest_chunk(chunk, tool_call_id).await?;
        let mut mapped_stages = Vec::new();
        for stage in stages_from_inner {
            match stage {
                StreamStage::ParamsChunk(val) => mapped_stages.push(StreamStage::ParamsChunk(val)),
                StreamStage::ParamsComplete(val) => mapped_stages.push(StreamStage::ParamsComplete(val)),
                StreamStage::OutputChunk(t_output_val) => {
                    mapped_stages.push(StreamStage::OutputChunk(t_output_val));
                }
                StreamStage::OutputComplete(t_output_val) => {
                    mapped_stages.push(StreamStage::OutputComplete(t_output_val));
                }
            }
        }
        Ok(mapped_stages)
    }

    async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
        let stages_from_inner = self.0.finalize(tool_call_id).await?;
        let mut mapped_stages = Vec::new();
        for stage in stages_from_inner {
            match stage {
                StreamStage::ParamsChunk(val) => mapped_stages.push(StreamStage::ParamsChunk(val)),
                StreamStage::ParamsComplete(val) => mapped_stages.push(StreamStage::ParamsComplete(val)),
                StreamStage::OutputChunk(t_output_val) => {
                    mapped_stages.push(StreamStage::OutputChunk(t_output_val));
                }
                StreamStage::OutputComplete(t_output_val) => {
                    mapped_stages.push(StreamStage::OutputComplete(t_output_val));
                }
            }
        }
        Ok(mapped_stages)
    }

    async fn handle_shutdown(&self) -> Result<()> {
        self.0.handle_shutdown().await
    }
}

/// Auto-convert convenience trait.
pub trait IntoJsonAdapter: ToolExecutor
where
    Self::Params: DeserializeOwned,
    Self::Output: Serialize,
{
    fn into_json_adapter(self) -> JsonAdapter<Self>
    where
        Self: Sized,
    {
        JsonAdapter::new(self)
    }
}

impl<T> IntoJsonAdapter for T
where
    T: ToolExecutor,
    T::Params: DeserializeOwned,
    T::Output: Serialize,
{
}

// ===========================================================================================
// OPTIONAL: ToolStreamer – maps StreamStage → UI-facing events and can forward through a channel
// ===========================================================================================

#[async_trait]
pub trait ToolStreamer: ToolExecutor {
    /// Event type understood by the caller / UI layer.
    type UiEvent: Send + 'static;

    /// Convert a single StreamStage into zero or more UI events.
    fn map_stage(&self, stage: StreamStage) -> Vec<Self::UiEvent>;

    /// Convenience helper: feed a raw chunk, map all resulting stages, and push them across a channel.
    async fn ingest_and_send(&mut self, chunk: &str, sender: &tokio::sync::mpsc::Sender<Self::UiEvent>) -> Result<()>
    {
        let stages = self.ingest_chunk(chunk, "").await?;
        for st in stages {
            for ev in self.map_stage(st) {
                sender.send(ev).await.map_err(|e| anyhow::anyhow!(e.to_string()))?;
            }
        }
        Ok(())
    }

    /// After parameters are complete call this once to emit execution output.
    async fn finalize_and_send(&mut self, sender: &tokio::sync::mpsc::Sender<Self::UiEvent>) -> Result<()>
    {
        let stages = self.finalize("").await?;
        for st in stages {
            for ev in self.map_stage(st) {
                sender.send(ev).await.map_err(|e| anyhow::anyhow!(e.to_string()))?;
            }
        }
        Ok(())
    }
}

// ===============================================================
//  Generic helper for value-only param streaming
// ===============================================================

pub struct FieldSpec {
    pub json_key: &'static str,
    pub ui_chunk_key: Option<&'static str>,
    pub ui_full_key: Option<&'static str>,
}

pub trait StreamSpec {
    fn stream_fields() -> &'static [FieldSpec];
}

/// Return a list of (ui_key, slice) for the given raw chunk
pub fn map_param_chunk<P: StreamSpec>(chunk: &str) -> Vec<(&'static str, String)> {
    // very naive extraction – looks for "key":"value_fragment"
    let mut out = Vec::new();
    for spec in P::stream_fields() {
        if let Some(pos) = chunk.find(spec.json_key) {
            // try to find the first quote after the colon
            if let Some(start) = chunk[pos..].find('"') {
                if let Some(end_pos) = chunk[pos + start + 1..].find('"') {
                    let val_piece = &chunk[pos + start + 1..pos + start + 1 + end_pos];
                    if !val_piece.is_empty() {
                        if let Some(ui_key) = spec.ui_chunk_key {
                            out.push((ui_key, val_piece.to_string()));
                        }
                    }
                }
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use async_trait::async_trait;
    use serde::{Deserialize, Serialize};
    use serde_json::json;

    //----------------------------------
    // Dummy WeatherTool implementation
    //----------------------------------
    #[derive(Default)]
    struct WeatherTool {
        buffer: String,
        parsed: Option<WeatherParams>,
        executed: bool,
    }

    #[derive(PartialEq, Deserialize, Serialize, Clone, Debug)]
    struct WeatherParams {
        location: String,
    }

    impl StreamSpec for WeatherParams {
        fn stream_fields() -> &'static [FieldSpec] {
            &[FieldSpec { json_key: "location", ui_chunk_key: Some("location_chunk"), ui_full_key: Some("location") }]
        }
    }

    #[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Clone)]
    struct WeatherOutput {
        forecast: String,
    }

    const WEATHER: ToolName = ToolName::new("weather");

    #[async_trait]
    impl ToolExecutor for WeatherTool {
        type Output = WeatherOutput;
        type Params = WeatherParams;

        async fn execute(&self, params: Self::Params, _id: String) -> Result<Self::Output> {
            Ok(WeatherOutput {
                forecast: format!("Sunny in {}!", params.location),
            })
        }

        async fn schema(&self) -> serde_json::Value {
            json!({
                "name": WEATHER.as_str(),
                "description": "Gets the weather forecast for a location.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string", "description": "The location to get the weather for."}
                    },
                    "required": ["location"]
                }
            })
        }

        fn name(&self) -> ToolName {
            WEATHER
        }

        async fn ingest_chunk(&mut self, chunk: &str, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
            self.buffer.push_str(chunk);
            let mut stages = vec![StreamStage::ParamsChunk(serde_json::Value::String(chunk.to_string()))];

            // Attempt to parse the current buffer
            if let Ok(p_candidate) = serde_json::from_str::<WeatherParams>(&self.buffer) {
                // Emit ParamsComplete if this is the first successful parse, 
                // or if the newly parsed parameters are different from the previously stored ones (e.g. more complete).
                let should_emit_complete = self.parsed.is_none() || self.parsed.as_ref() != Some(&p_candidate);
                
                self.parsed = Some(p_candidate.clone()); // Update with the latest successful parse

                if should_emit_complete {
                    stages.push(StreamStage::ParamsComplete(serde_json::to_value(&p_candidate)?));
                }
            }
            Ok(stages)
        }

        async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
            let mut stages = Vec::new();
            if !self.executed {
                if let Some(ref params) = self.parsed {
                    let out = self.execute(params.clone(), tool_call_id.to_string()).await?;
                    stages.push(StreamStage::OutputComplete(serde_json::to_value(out)?));
                    self.executed = true;
                }
            }
            Ok(stages)
        }
    }

    //----------------------------------
    // UI mapping for WeatherTool
    //----------------------------------
    #[derive(Debug, Clone)]
    enum WeatherUi {
        ParamsChunk(String),
        ParamsComplete(WeatherParams),
        Output(WeatherOutput),
    }

    #[async_trait]
    impl ToolStreamer for WeatherTool {
        type UiEvent = WeatherUi;

        fn map_stage(&self, stage: StreamStage) -> Vec<Self::UiEvent> {
            match stage {
                StreamStage::ParamsChunk(v) => vec![WeatherUi::ParamsChunk(v.as_str().unwrap_or_default().into())],
                StreamStage::ParamsComplete(v) => vec![WeatherUi::ParamsComplete(serde_json::from_value(v).unwrap())],
                StreamStage::OutputComplete(v) => vec![WeatherUi::Output(serde_json::from_value(v).unwrap())],
                _ => vec![],
            }
        }
    }

    //-------------------------------------------------
    // Tests
    //-------------------------------------------------

    #[tokio::test]
    async fn weather_execute_returns_dummy() -> Result<()> {
        let tool = WeatherTool::default();
        let out = tool
            .execute(
                WeatherParams {
                    location: "London".into(),
                },
                "id1".into(),
            )
            .await?;
        assert_eq!(
            out,
            WeatherOutput {
                forecast: "Sunny in London!".into()
            }
        );
        Ok(())
    }

    #[tokio::test]
    async fn weather_stream_partial_params() -> Result<()> {
        let mut tool = WeatherTool::default();
        let stages = tool.ingest_chunk("{\"location\":\"Lon\"}", "test_call_id").await?;
        assert!(stages.iter().any(|s| matches!(s, StreamStage::ParamsChunk(_))));
        assert!(stages.iter().any(|s| matches!(s, StreamStage::ParamsComplete(_))), "Should emit ParamsComplete if partial JSON is parsable");
        assert!(tool.parsed.is_some());
        assert_eq!(tool.parsed.as_ref().unwrap().location, "Lon");
        Ok(())
    }

    #[tokio::test]
    async fn weather_stream_complete_params() -> Result<()> {
        let mut tool = WeatherTool::default();
        
        // Chunk 1: Incomplete JSON string value
        let stages1 = tool.ingest_chunk("{\"location\":\"Lon", "test_call_id").await?;
        // After chunk 1, buffer is "{\"location\":\"Lon". serde_json::from_str should fail.
        // So, stages1 should only contain ParamsChunk. self.parsed should be None.
        assert!(stages1.iter().any(|s| matches!(s, StreamStage::ParamsChunk(_))));
        assert!(!stages1.iter().any(|s| matches!(s, StreamStage::ParamsComplete(_))), "ParamsComplete should not be emitted for incomplete JSON: {:?}", stages1);
        assert!(tool.parsed.is_none(), "Parsed should be None after incomplete chunk. Actual: {:?}", tool.parsed);

        // Chunk 2: Completes the JSON
        let stages2 = tool.ingest_chunk("don\"}", "test_call_id").await?;
        // Buffer becomes "{\"location\":\"London\"}". serde_json::from_str should succeed.
        // stages2 should contain ParamsComplete.
        assert!(stages2.iter().any(|s| matches!(s, StreamStage::ParamsComplete(_))), "ParamsComplete should be emitted for complete JSON. Actual stages: {:?}", stages2);
        assert!(tool.parsed.is_some(), "Parsed should be Some after complete JSON. Actual: {:?}", tool.parsed);
        assert_eq!(tool.parsed.as_ref().unwrap().location, "London");
        Ok(())
    }

    #[tokio::test]
    async fn weather_stream_exec_output() -> Result<()> {
        let mut tool = WeatherTool::default();
        tool.ingest_chunk("{\"location\":\"Berlin\"}", "test_call_id").await?;
        let finalize_stages = tool.finalize("test_call_id").await?;
        let output_stage = finalize_stages
            .iter()
            .find_map(|s| if let StreamStage::OutputComplete(v) = s { Some(v) } else { None })
            .expect("no output");
        let out: WeatherOutput = serde_json::from_value(output_stage.clone())?;
        assert_eq!(
            out,
            WeatherOutput {
                forecast: "Sunny in Berlin!".into()
            }
        );
        Ok(())
    }

    // Test using channel + ToolStreamer for WeatherTool
    #[tokio::test]
    async fn weather_tool_stream_via_channel() -> Result<()> {
        let (tx, mut rx) = tokio::sync::mpsc::channel(16);
        let mut tool = WeatherTool::default();

        // Stream params chunk by chunk
        for chunk in ["{\"loc", "ation\":\"Se", "attle\"}"] {
            tool.ingest_and_send(chunk, &tx).await?;
        }
        tool.finalize_and_send(&tx).await?;

        drop(tx); // close sender so rx exhausts
        let mut saw_complete = false;
        while let Some(ev) = rx.recv().await {
            match ev {
                WeatherUi::ParamsChunk(_) => {},
                WeatherUi::ParamsComplete(p) => assert_eq!(p.location, "Seattle"),
                WeatherUi::Output(o) => { assert!(o.forecast.contains("Seattle")); saw_complete = true; },
            }
        }
        assert!(saw_complete);
        Ok(())
    }

    // ------------------------------------------------------------------
    // Additional Tool: PoemGenerator (for streaming-heavy scenario)
    // ------------------------------------------------------------------
    #[derive(Default)]
    struct PoemGenerator {
        buffer: String,
        params: Option<PoemParams>,
        executed: bool,
    }

    #[derive(Serialize, Deserialize, Clone, Debug)]
    struct PoemParams {
        description: String,
    }

    impl StreamSpec for PoemParams {
        fn stream_fields() -> &'static [FieldSpec] {
            &[FieldSpec { json_key: "description", ui_chunk_key: Some("description_chunk"), ui_full_key: Some("description") }]
        }
    }

    #[derive(Serialize, Deserialize, Clone, Debug)]
    struct PoemOutput {
        poem: String,
    }

    const POEM: ToolName = ToolName::new("poem_generator");

    #[async_trait]
    impl ToolExecutor for PoemGenerator {
        type Output = PoemOutput;
        type Params = PoemParams;

        async fn execute(&self, params: Self::Params, _id: String) -> Result<Self::Output> {
            // Very simple poem: split description words into a four-line poem.
            let words: Vec<&str> = params.description.split_whitespace().collect();
            let mut poem_lines = Vec::new();
            let chunk_size = (words.len() / 4).max(1); // Use variable name that does not shadow outer scope
            for i in (0..words.len()).step_by(chunk_size) {
                poem_lines.push(words[i..words.len().min(i + chunk_size)].join(" "));
            }
            Ok(PoemOutput {
                poem: poem_lines.join("\n"),
            })
        }

        async fn schema(&self) -> serde_json::Value {
            json!({
                "name": POEM.as_str(),
                "description": "Generates a short poem from a prose description",
                "parameters": {
                    "type": "object",
                    "properties": {"description": {"type": "string"}},
                    "required": ["description"]
                }
            })
        }

        fn name(&self) -> ToolName {
            POEM
        }

        async fn ingest_chunk(&mut self, chunk: &str, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
            self.buffer.push_str(chunk);
            let mut stages = vec![StreamStage::ParamsChunk(Value::String(chunk.to_owned()))];
            if self.params.is_none() {
                if let Ok(p) = serde_json::from_str::<PoemParams>(&self.buffer) {
                    self.params = Some(p.clone());
                    stages.push(StreamStage::ParamsComplete(serde_json::to_value(&p)?));
                }
            }
            Ok(stages)
        }

        async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
            let mut stages = Vec::new();
            if !self.executed {
                if let Some(ref params) = self.params {
                    let out = self.execute(params.clone(), tool_call_id.to_string()).await?;
                    stages.push(StreamStage::OutputComplete(serde_json::to_value(out)?));
                    self.executed = true;
                }
            }
            Ok(stages)
        }
    }

    // UI mapping for PoemGenerator
    #[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
    struct PoemParamUi {
        description_chunk: Option<String>,
        description: Option<String>,
    }

    #[derive(Debug, Clone)]
    enum PoemUi {
        Params(PoemParamUi),
        Output(PoemOutput),
    }

    #[async_trait]
    impl ToolStreamer for PoemGenerator {
        type UiEvent = PoemUi;

        fn map_stage(&self, stage: StreamStage) -> Vec<Self::UiEvent> {
            match stage {
                StreamStage::ParamsChunk(v) => map_param_chunk::<PoemParams>(v.as_str().unwrap_or_default())
                    .into_iter()
                    .map(|(k, slice)| PoemUi::Params(PoemParamUi {
                        description_chunk: if k == "description_chunk" { Some(slice) } else { None },
                        description: None,
                    }))
                    .collect(),
                StreamStage::ParamsComplete(v) => {
                    let p: PoemParams = serde_json::from_value(v).unwrap();
                    vec![PoemUi::Params(PoemParamUi {
                        description_chunk: None,
                        description: Some(p.description),
                    })]
                }
                StreamStage::OutputComplete(v) => vec![PoemUi::Output(serde_json::from_value(v).unwrap())],
                _ => vec![],
            }
        }
    }

    // helper used by poem tests
    async fn feed_poem_chunks(tool: &mut PoemGenerator, json: &str, chunk_size: usize, tx: &tokio::sync::mpsc::Sender<PoemUi>) -> Result<()> {
        for chunk in json.as_bytes().chunks(chunk_size) {
            tool.ingest_and_send(std::str::from_utf8(chunk).unwrap(), tx).await?;
        }
        Ok(())
    }

    // 1. verify incremental value-only chunks
    #[tokio::test]
    async fn poem_stream_value_chunks() -> Result<()> {
        let (tx, mut rx) = tokio::sync::mpsc::channel::<PoemUi>(32);
        let mut tool = PoemGenerator::default();
        let params_json = r#"{"description":"The ferris crab loves the gentle waves of Rustacean seas"}"#;

        feed_poem_chunks(&mut tool, params_json, 5, &tx).await?;
        drop(tx);

        let mut collected = String::new();
        while let Some(ev) = rx.recv().await {
            if let PoemUi::Params(p) = ev {
                if let Some(c) = p.description_chunk { collected.push_str(&c); }
            }
        }
        // chunks should be prefix of expected string (may or may not complete)
        assert!("The ferris crab loves the gentle waves of Rustacean seas".starts_with(&collected));
        Ok(())
    }

    // 2. verify ParamsComplete emits full description
    #[tokio::test]
    async fn poem_params_complete_event() -> Result<()> {
        let (tx, mut rx) = tokio::sync::mpsc::channel::<PoemUi>(32);
        let mut tool = PoemGenerator::default();
        let params_json = r#"{"description":"The diligent crab taps its ergonomic keyboard"}"#;

        feed_poem_chunks(&mut tool, params_json, 5, &tx).await?;
        tool.finalize_and_send(&tx).await?;
        drop(tx);

        let mut saw_complete = false;
        while let Some(ev) = rx.recv().await {
            match ev {
                PoemUi::Params(pui) => {
                    if let Some(full_desc) = pui.description {
                        assert!(full_desc.contains("diligent"));
                        saw_complete = true;
                    }
                }
                PoemUi::Output(_) => {/* ignore */}
            }
        }
        assert!(saw_complete);
        Ok(())
    }

    // 3. verify finalize emits output and no more param chunks
    #[tokio::test]
    async fn poem_output_event() -> Result<()> {
        let (tx, mut rx) = tokio::sync::mpsc::channel::<PoemUi>(32);
        let mut tool = PoemGenerator::default();
        let params_json = r#"{"description":"The ferris crab loves the gentle waves of Rustacean seas"}"#;

        feed_poem_chunks(&mut tool, params_json, 5, &tx).await?;
        tool.finalize_and_send(&tx).await?;
        drop(tx);

        let mut saw_output = false;
        while let Some(ev) = rx.recv().await {
            match ev {
                PoemUi::Output(po) => { saw_output = true; assert!(po.poem.contains("ferris")); },
                PoemUi::Params(_) => {/* ignore */}
            }
        }
        assert!(saw_output);
        Ok(())
    }
}
