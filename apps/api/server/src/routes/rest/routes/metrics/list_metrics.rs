use crate::routes::rest::ApiResponse;
use axum::extract::Query;
use axum::http::StatusCode;
use axum::Extension;
use handlers::metrics::{list_metrics_handler, MetricsListRequest, BusterMetricListItem};
use middleware::AuthenticatedUser;
use serde::Deserialize;
use database::enums::Verification;
use serde::de::{self, Deserializer, SeqAccess, Visitor};
use std::fmt;

// Helper function to deserialize Option<String> or Option<Vec<String>> into Option<Vec<String>>
fn deserialize_optional_vec_or_single<'de, D>(deserializer: D) -> Result<Option<Vec<Verification>>, D::Error>
where
    D: Deserializer<'de>,
{
    struct OptionVecOrSingleVisitor;

    impl<'de> Visitor<'de> for OptionVecOrSingleVisitor {
        type Value = Option<Vec<Verification>>;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a verification status string, a sequence of status strings, or null")
        }

        // Handle a single string value
        fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            // Deserialize the single string into Verification
            let verification = Verification::deserialize(de::value::StringDeserializer::new(value.to_string()))?;
            Ok(Some(vec![verification]))
        }

        // Handle a sequence of values
        fn visit_seq<A>(self, seq: A) -> Result<Self::Value, A::Error>
        where
            A: SeqAccess<'de>,
        {
            // Deserialize the sequence into Vec<Verification>
            let vec = Vec::<Verification>::deserialize(de::value::SeqAccessDeserializer::new(seq))?;
            if vec.is_empty() {
                Ok(None)
            } else {
                Ok(Some(vec))
            }
        }
        
        // Handle null or missing value
        fn visit_none<E>(self) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(None)
        }

        // Handle optional value
        fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
        where
            D: Deserializer<'de>,
        {
            deserializer.deserialize_any(self)
        }
    }

    deserializer.deserialize_any(OptionVecOrSingleVisitor)
}

#[derive(Deserialize)]
pub struct ListMetricsQuery {
    page_token: Option<i64>,
    page_size: Option<i64>,
    shared_with_me: Option<bool>,
    only_my_metrics: Option<bool>,
    #[serde(rename = "status[]", deserialize_with = "deserialize_optional_vec_or_single", default)]
    verification: Option<Vec<Verification>>,
}

pub async fn list_metrics_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListMetricsQuery>,
) -> Result<ApiResponse<Vec<BusterMetricListItem>>, (StatusCode, &'static str)> {
    let request = MetricsListRequest {
        page_token: query.page_token.unwrap_or(0),
        page_size: query.page_size.unwrap_or(25),
        shared_with_me: query.shared_with_me,
        only_my_metrics: query.only_my_metrics,
        verification: query.verification,
    };

    let metrics = match list_metrics_handler(&user, request).await {
        Ok(metrics) => metrics,
        Err(e) => {
            tracing::error!("Error listing metrics: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to list metrics"));
        }
    };

    Ok(ApiResponse::JsonData(metrics))
}
