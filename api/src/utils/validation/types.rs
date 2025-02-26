use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ValidationResult {
    pub success: bool,
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ValidationError {
    pub error_type: ValidationErrorType,
    pub column_name: Option<String>,
    pub message: String,
    pub suggestion: Option<String>,
    pub context: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ValidationErrorType {
    TableNotFound,
    ColumnNotFound,
    TypeMismatch,
    DataSourceError,
    ModelNotFound,
    InvalidRelationship,
    ExpressionError,
    ProjectNotFound,
    InvalidBusterYml,
    DataSourceMismatch,
    RequiredFieldMissing,
    DataSourceNotFound,
    SchemaError,
    CredentialsError,
    DatabaseError,
    ValidationError,
    InternalError,
}

impl ValidationResult {
    pub fn new(model_name: String, data_source_name: String, schema: String) -> Self {
        Self {
            success: true,
            model_name,
            data_source_name,
            schema,
            errors: Vec::new(),
        }
    }

    pub fn add_error(&mut self, error: ValidationError) {
        self.success = false;
        self.errors.push(error);
    }
}

impl ValidationError {
    pub fn new(
        error_type: ValidationErrorType,
        column_name: Option<String>,
        message: String,
        suggestion: Option<String>,
    ) -> Self {
        Self {
            error_type,
            column_name,
            message,
            suggestion,
            context: None,
        }
    }

    pub fn with_context(mut self, context: String) -> Self {
        self.context = Some(context);
        self
    }

    pub fn table_not_found(table_name: &str) -> Self {
        Self::new(
            ValidationErrorType::TableNotFound,
            None,
            format!("Table '{}' not found in data source", table_name),
            None,
        )
    }

    pub fn column_not_found(column_name: &str) -> Self {
        Self::new(
            ValidationErrorType::ColumnNotFound,
            Some(column_name.to_string()),
            format!("Column '{}' not found in data source", column_name),
            None,
        )
    }

    pub fn type_mismatch(column_name: &str, expected: &str, found: &str) -> Self {
        Self::new(
            ValidationErrorType::TypeMismatch,
            Some(column_name.to_string()),
            format!(
                "Column '{}' type mismatch. Expected: {}, Found: {}",
                column_name, expected, found
            ),
            None,
        )
    }

    pub fn data_source_error(message: String) -> Self {
        Self::new(
            ValidationErrorType::DataSourceError,
            None,
            message,
            None,
        )
    }

    pub fn model_not_found(model_name: &str) -> Self {
        Self::new(
            ValidationErrorType::ModelNotFound,
            None,
            format!("Model '{}' not found in data source", model_name),
            None,
        )
    }

    pub fn invalid_relationship(from: &str, to: &str, reason: &str) -> Self {
        Self::new(
            ValidationErrorType::InvalidRelationship,
            None,
            format!("Invalid relationship from '{}' to '{}': {}", from, to, reason),
            None,
        )
    }

    pub fn expression_error(column_name: &str, expr: &str, reason: &str) -> Self {
        Self::new(
            ValidationErrorType::ExpressionError,
            Some(column_name.to_string()),
            format!("Invalid expression '{}' for column '{}': {}", expr, column_name, reason),
            None,
        )
    }

    // New factory methods for enhanced error types
    pub fn schema_error(schema_name: &str, reason: &str) -> Self {
        Self::new(
            ValidationErrorType::SchemaError,
            None,
            format!("Schema '{}' error: {}", schema_name, reason),
            None,
        )
    }

    pub fn credentials_error(data_source: &str, reason: &str) -> Self {
        Self::new(
            ValidationErrorType::CredentialsError,
            None,
            format!("Credentials error for data source '{}': {}", data_source, reason),
            None,
        )
    }

    pub fn database_error(message: String) -> Self {
        Self::new(
            ValidationErrorType::DatabaseError,
            None,
            message,
            None,
        )
    }

    pub fn internal_error(message: String) -> Self {
        Self::new(
            ValidationErrorType::InternalError,
            None,
            message,
            None,
        )
    }
} 