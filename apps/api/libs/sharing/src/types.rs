use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, User},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Wrapper struct to handle direct values in JSON
#[derive(Debug, Clone)]
pub enum JsonValue<T> {
    /// A direct value
    Value(T),
    /// Null value (serialized as JSON null)
    Null,
}

impl<'de, T> serde::Deserialize<'de> for JsonValue<T>
where
    T: serde::Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // This will handle null values directly
        struct JsonValueVisitor<T>(std::marker::PhantomData<T>);

        impl<'de, T> serde::de::Visitor<'de> for JsonValueVisitor<T>
        where
            T: serde::Deserialize<'de>,
        {
            type Value = JsonValue<T>;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("a value or null")
            }

            fn visit_none<E>(self) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                Ok(JsonValue::Null)
            }

            fn visit_unit<E>(self) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                Ok(JsonValue::Null)
            }

            fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            // Handle any other value type
            fn visit_map<A>(self, map: A) -> Result<Self::Value, A::Error>
            where
                A: serde::de::MapAccess<'de>,
            {
                let deserializer = serde::de::value::MapAccessDeserializer::new(map);
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            fn visit_seq<A>(self, seq: A) -> Result<Self::Value, A::Error>
            where
                A: serde::de::SeqAccess<'de>,
            {
                let deserializer = serde::de::value::SeqAccessDeserializer::new(seq);
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::StrDeserializer::new(value);
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            fn visit_string<E>(self, value: String) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::StringDeserializer::new(value);
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            fn visit_bool<E>(self, value: bool) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::BoolDeserializer::new(value);
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            fn visit_i64<E>(self, value: i64) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::I64Deserializer::new(value);
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            fn visit_u64<E>(self, value: u64) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::U64Deserializer::new(value);
                T::deserialize(deserializer).map(JsonValue::Value)
            }

            fn visit_f64<E>(self, value: f64) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::F64Deserializer::new(value);
                T::deserialize(deserializer).map(JsonValue::Value)
            }
        }

        // Use the visitor to handle all value types
        deserializer.deserialize_any(JsonValueVisitor(std::marker::PhantomData))
    }
}

impl<T> serde::Serialize for JsonValue<T>
where
    T: serde::Serialize,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            JsonValue::Value(v) => v.serialize(serializer),
            JsonValue::Null => serializer.serialize_none(),
        }
    }
}

/// Represents a field that can be either kept unchanged, set to null, or updated with a value
#[derive(Debug, Clone)]
pub enum UpdateField<T> {
    /// Update with a new value
    Update(T),
    /// Set the value to null/None - represented as explicit null from frontend
    SetNull,
    /// Don't change the current value - represented as undefined from frontend
    NoChange,
}

impl<T> Default for UpdateField<T> {
    fn default() -> Self {
        UpdateField::NoChange
    }
}

impl<T> serde::Serialize for UpdateField<T>
where
    T: serde::Serialize,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            UpdateField::Update(val) => val.serialize(serializer),
            UpdateField::SetNull => serializer.serialize_none(),
            UpdateField::NoChange => serializer.serialize_none(), // Should not be serialized
        }
    }
}

impl<'de, T> serde::Deserialize<'de> for UpdateField<T>
where
    T: serde::Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // We need a visitor implementation to handle direct JSON null values
        struct UpdateFieldVisitor<T>(std::marker::PhantomData<T>);

        impl<'de, T> serde::de::Visitor<'de> for UpdateFieldVisitor<T>
        where
            T: serde::Deserialize<'de>,
        {
            type Value = UpdateField<T>;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("null, a value, or field not present")
            }

            // Handle direct null values
            fn visit_none<E>(self) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                Ok(UpdateField::SetNull)
            }

            // Handle unit (null) values
            fn visit_unit<E>(self) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                Ok(UpdateField::SetNull)
            }

            // Handle any other value by delegating to T's deserializer
            fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            // Direct values (not wrapped in option)
            fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::StrDeserializer::new(v);
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::StringDeserializer::new(v);
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            fn visit_bool<E>(self, v: bool) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::BoolDeserializer::new(v);
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::I64Deserializer::new(v);
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::U64Deserializer::new(v);
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            fn visit_f64<E>(self, v: f64) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let deserializer = serde::de::value::F64Deserializer::new(v);
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            // Complex types
            fn visit_map<A>(self, map: A) -> Result<Self::Value, A::Error>
            where
                A: serde::de::MapAccess<'de>,
            {
                let deserializer = serde::de::value::MapAccessDeserializer::new(map);
                T::deserialize(deserializer).map(UpdateField::Update)
            }

            fn visit_seq<A>(self, seq: A) -> Result<Self::Value, A::Error>
            where
                A: serde::de::SeqAccess<'de>,
            {
                let deserializer = serde::de::value::SeqAccessDeserializer::new(seq);
                T::deserialize(deserializer).map(UpdateField::Update)
            }
        }

        // We use deserialize_option to leverage serde's Option handling
        match serde::Deserializer::deserialize_option(deserializer, UpdateFieldVisitor(std::marker::PhantomData)) {
            Ok(value) => Ok(value),
            // If deserialization fails, treat as NoChange (field not present)
            // This shouldn't happen as our visitor handles all cases
            Err(_) => Ok(UpdateField::NoChange),
        }
    }
}

impl<T> UpdateField<T> {
    /// Converts the UpdateField into an Option<Option<T>> for diesel
    /// 
    /// This is used when updating database fields:
    /// - NoChange -> None (SQL UPDATE statement doesn't include this field)
    /// - SetNull -> Some(None) (SQL UPDATE sets this field to NULL)
    /// - Update(value) -> Some(Some(value)) (SQL UPDATE sets this field to value)
    pub fn into_option(self) -> Option<Option<T>> {
        match self {
            UpdateField::NoChange => None,
            UpdateField::SetNull => Some(None),
            UpdateField::Update(value) => Some(Some(value)),
        }
    }

    /// Creates an UpdateField from an Option<Option<T>> (for backward compatibility)
    /// 
    /// This matches the TypeScript semantics:
    /// - None -> NoChange (undefined in TypeScript)
    /// - Some(None) -> SetNull (null in TypeScript)
    /// - Some(Some(value)) -> Update(value) (defined value in TypeScript)
    pub fn from_option(option: Option<Option<T>>) -> Self {
        match option {
            None => UpdateField::NoChange,
            Some(None) => UpdateField::SetNull,
            Some(Some(value)) => UpdateField::Update(value),
        }
    }
}

/// Represents the permission level required for an operation
/// This is used to check if a user has sufficient permission level
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssetPermissionLevel {
    /// Full ownership, can delete
    Owner,
    /// Full access, can edit and share
    FullAccess,
    /// Can edit but not share
    CanEdit,
    /// Can filter and view
    CanFilter,
    /// Can view only
    CanView,
}

impl From<AssetPermissionRole> for AssetPermissionLevel {
    fn from(role: AssetPermissionRole) -> Self {
        match role {
            AssetPermissionRole::Owner => AssetPermissionLevel::Owner,
            AssetPermissionRole::FullAccess => AssetPermissionLevel::FullAccess,
            AssetPermissionRole::CanEdit => AssetPermissionLevel::CanEdit,
            AssetPermissionRole::CanFilter => AssetPermissionLevel::CanFilter,
            AssetPermissionRole::CanView => AssetPermissionLevel::CanView,
        }
    }
}

impl AssetPermissionLevel {
    /// Check if this permission level is sufficient for the required level
    pub fn is_sufficient_for(&self, required: &AssetPermissionLevel) -> bool {
        match (self, required) {
            // Owner can do anything
            (AssetPermissionLevel::Owner, _) => true,
            // FullAccess can do anything except Owner actions
            (AssetPermissionLevel::FullAccess, AssetPermissionLevel::Owner) => false,
            (AssetPermissionLevel::FullAccess, _) => true,
            // CanEdit can edit, filter, and view
            (AssetPermissionLevel::CanEdit, AssetPermissionLevel::Owner) => false,
            (AssetPermissionLevel::CanEdit, AssetPermissionLevel::FullAccess) => false,
            (AssetPermissionLevel::CanEdit, _) => true,
            // CanFilter can filter and view
            (AssetPermissionLevel::CanFilter, AssetPermissionLevel::Owner) => false,
            (AssetPermissionLevel::CanFilter, AssetPermissionLevel::FullAccess) => false,
            (AssetPermissionLevel::CanFilter, AssetPermissionLevel::CanEdit) => false,
            (AssetPermissionLevel::CanFilter, _) => true,
            // CanView can only view
            (AssetPermissionLevel::CanView, AssetPermissionLevel::CanView) => true,
            (AssetPermissionLevel::CanView, _) => false,
        }
    }
}

/// Represents identity information for permission checks
#[derive(Debug)]
pub struct IdentityInfo {
    pub id: Uuid,
    pub identity_type: IdentityType,
}

/// A simplified version of the User model containing only the necessary information for sharing
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

impl From<User> for UserInfo {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
        }
    }
}

/// A serializable version of AssetPermission
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SerializableAssetPermission {
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub role: AssetPermissionRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub updated_by: Uuid,
}

impl From<AssetPermission> for SerializableAssetPermission {
    fn from(permission: AssetPermission) -> Self {
        Self {
            identity_id: permission.identity_id,
            identity_type: permission.identity_type,
            asset_id: permission.asset_id,
            asset_type: permission.asset_type,
            role: permission.role,
            created_at: permission.created_at,
            updated_at: permission.updated_at,
            deleted_at: permission.deleted_at,
            created_by: permission.created_by,
            updated_by: permission.updated_by,
        }
    }
}

/// Represents an asset permission with the associated user information
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssetPermissionWithUser {
    pub permission: SerializableAssetPermission,
    pub user: Option<UserInfo>,
}

/// Request to list permissions for an asset
#[derive(Debug, Deserialize)]
pub struct ListPermissionsRequest {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
}

/// Response for the list permissions endpoint
#[derive(Debug, Serialize)]
pub struct ListPermissionsResponse {
    pub permissions: Vec<AssetPermissionWithUser>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_update_field_into_option() {
        let update = UpdateField::Update("hello world".to_string());
        assert_eq!(update.into_option(), Some(Some("hello world".to_string())));
        
        let set_null: UpdateField<String> = UpdateField::SetNull;
        assert_eq!(set_null.into_option(), Some(None));
        
        let no_change: UpdateField<String> = UpdateField::NoChange;
        assert_eq!(no_change.into_option(), None);
    }
    
    #[test]
    fn test_update_field_from_option() {
        let some_some = Some(Some("hello world".to_string()));
        match UpdateField::from_option(some_some) {
            UpdateField::Update(val) if val == "hello world" => {}
            _ => panic!("Expected UpdateField::Update"),
        }
        
        let some_none: Option<Option<String>> = Some(None);
        match UpdateField::from_option(some_none) {
            UpdateField::SetNull => {}
            _ => panic!("Expected UpdateField::SetNull"),
        }
        
        let none: Option<Option<String>> = None;
        match UpdateField::from_option(none) {
            UpdateField::NoChange => {}
            _ => panic!("Expected UpdateField::NoChange"),
        }
    }
    
    #[test]
    fn test_json_deserialization() {
        #[derive(Debug, serde::Deserialize)]
        struct TestStruct {
            #[serde(default)]
            field: UpdateField<String>,
        }
        
        // Test with JSON "null" value - should convert to SetNull
        let json_null = r#"{"field": null}"#;
        let test_struct: TestStruct = serde_json::from_str(json_null).unwrap();
        match test_struct.field {
            UpdateField::SetNull => {}
            _ => panic!("Expected UpdateField::SetNull, got {:?}", test_struct.field),
        }
        
        // Test with JSON string value - should convert to Update
        let json_value = r#"{"field": "hello world"}"#;
        let test_struct: TestStruct = serde_json::from_str(json_value).unwrap();
        match test_struct.field {
            UpdateField::Update(val) if val == "hello world" => {}
            _ => panic!("Expected UpdateField::Update, got {:?}", test_struct.field),
        }
        
        // Test with field not present - should convert to NoChange
        let json_empty = r#"{}"#;
        let test_struct: TestStruct = serde_json::from_str(json_empty).unwrap();
        match test_struct.field {
            UpdateField::NoChange => {}
            _ => panic!("Expected UpdateField::NoChange, got {:?}", test_struct.field),
        }
    }
}