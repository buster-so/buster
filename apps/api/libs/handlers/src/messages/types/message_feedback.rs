use serde::{Deserialize, Serialize};

/// Represents the feedback type for a message
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MessageFeedback {
    /// Positive feedback
    Positive,
    /// Negative feedback
    Negative,
}

impl std::fmt::Display for MessageFeedback {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MessageFeedback::Positive => write!(f, "positive"),
            MessageFeedback::Negative => write!(f, "negative"),
        }
    }
}

impl std::str::FromStr for MessageFeedback {
    type Err = &'static str;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "positive" => Ok(MessageFeedback::Positive),
            "negative" => Ok(MessageFeedback::Negative),
            _ => Err("Invalid feedback value. Must be 'positive' or 'negative'"),
        }
    }
}
