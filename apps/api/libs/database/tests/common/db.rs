use anyhow::{anyhow, Result};
use uuid::Uuid;
use database::pool::{init_pools, get_pg_pool, get_sqlx_pool, get_redis_pool};
use diesel_async::AsyncPgConnection;
use diesel_async::pooled_connection::bb8::PooledConnection;
use bb8_redis::bb8;
use crate::common::users::AuthenticatedUser;
use tracing;
use dotenv::dotenv;
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use database::models::{Organization, User, UserToOrganization};
use database::enums::{UserOrganizationRole, UserOrganizationStatus, SharingSetting};

/// Test database utilities for creating isolated test environments
pub struct TestDb {
    pub test_id: String,
    pub organization_id: Uuid,
    pub user_id: Uuid,
    initialized: bool,
}

impl TestDb {
    /// Creates a new test database environment with a unique test identifier
    pub async fn new() -> Result<Self> {
        // Load environment variables from .env file
        dotenv().ok();
        
        // Note: Pools are already initialized in tests/mod.rs
        // We don't need to initialize them again here
        
        let test_id = format!("test-{}", Uuid::new_v4());
        let organization_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        let db = Self {
            test_id,
            organization_id,
            user_id,
            initialized: true,
        };
        
        Ok(db)
    }
    
    /// Gets a Diesel database connection from the pool
    pub async fn diesel_conn(&self) -> Result<PooledConnection<'_, AsyncPgConnection>> {
        get_pg_pool()
            .get()
            .await
            .map_err(|e| anyhow!("Failed to get diesel connection: {}", e))
    }
    
    /// Gets a SQLx database connection from the pool
    pub async fn sqlx_conn(&self) -> Result<sqlx::pool::PoolConnection<sqlx::Postgres>> {
        get_sqlx_pool()
            .acquire()
            .await
            .map_err(|e| anyhow!("Failed to get sqlx connection: {}", e))
    }
    
    /// Gets a Redis connection from the pool
    pub async fn redis_conn(&self) -> Result<bb8::PooledConnection<'_, bb8_redis::RedisConnectionManager>> {
        get_redis_pool()
            .get()
            .await
            .map_err(|e| anyhow!("Failed to get redis connection: {}", e))
    }
    
    /// Creates a mock authenticated user for testing
    pub fn user(&self) -> AuthenticatedUser {
        AuthenticatedUser {
            id: self.user_id,
            organization_id: self.organization_id,
            email: format!("test-{}@example.com", self.test_id),
            name: Some(format!("Test User {}", self.test_id)),
            role: UserOrganizationRole::WorkspaceAdmin,
            sharing_setting: SharingSetting::None,
            edit_sql: true,
            upload_csv: true,
            export_assets: true,
            email_slack_enabled: true,
        }
    }
    
    /// Creates a test organization
    pub async fn create_organization(&self) -> Result<Organization> {
        let org = Organization {
            id: self.organization_id,
            name: format!("Test Organization {}", self.test_id),
            domain: Some(format!("test-{}.org", self.test_id)),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            payment_required: false,
        };
        
        let mut conn = self.diesel_conn().await?;
        
        diesel::insert_into(database::schema::organizations::table)
            .values(&org)
            .execute(&mut conn)
            .await?;
            
        Ok(org)
    }
    
    /// Creates a test user
    pub async fn create_user(&self) -> Result<User> {
        let user = User {
            id: self.user_id,
            email: format!("test-{}@example.com", self.test_id),
            name: Some(format!("Test User {}", self.test_id)),
            config: serde_json::json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: serde_json::json!({}),
            avatar_url: None,
        };
        
        let mut conn = self.diesel_conn().await?;
        
        diesel::insert_into(database::schema::users::table)
            .values(&user)
            .execute(&mut conn)
            .await?;
            
        Ok(user)
    }
    
    /// Creates a user-organization relationship with specified role
    pub async fn create_user_to_org(
        &self,
        user_id: Uuid,
        org_id: Uuid,
        role: UserOrganizationRole,
    ) -> Result<UserToOrganization> {
        let user_org = UserToOrganization {
            user_id,
            organization_id: org_id,
            role,
            sharing_setting: SharingSetting::None,
            edit_sql: true,
            upload_csv: true,
            export_assets: true,
            email_slack_enabled: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: user_id, // Self-created for test
            updated_by: user_id,
            deleted_by: None,
            status: UserOrganizationStatus::Active,
        };
        
        let mut conn = self.diesel_conn().await?;
        
        diesel::insert_into(database::schema::users_to_organizations::table)
            .values(&user_org)
            .execute(&mut conn)
            .await?;
            
        Ok(user_org)
    }
    
    /// Creates an authenticated user with organization for testing
    pub async fn create_authenticated_user(
        &self,
        role: Option<UserOrganizationRole>,
    ) -> Result<(AuthenticatedUser, Organization)> {
        // Create org and user
        let org = self.create_organization().await?;
        let user = self.create_user().await?;
        
        // Create relationship with specified role (default to Admin)
        let role = role.unwrap_or(UserOrganizationRole::WorkspaceAdmin);
        self.create_user_to_org(user.id, org.id, role).await?;
        
        // Create authenticated user
        let auth_user = AuthenticatedUser {
            id: user.id,
            organization_id: org.id,
            email: user.email,
            name: user.name,
            role,
            sharing_setting: SharingSetting::None,
            edit_sql: true,
            upload_csv: true,
            export_assets: true,
            email_slack_enabled: true,
        };
        
        Ok((auth_user, org))
    }
    
    /// Cleans up all test data created with this test instance's ID
    pub async fn cleanup(&self) -> Result<()> {
        let mut conn = self.diesel_conn().await?;
        
        // We need to delete test data in the correct order to avoid foreign key violations
        // Asset types should be deleted before users and organizations
        
        // Delete test asset permissions
        use database::schema::asset_permissions;
        diesel::delete(asset_permissions::table)
            .filter(asset_permissions::created_by.eq(self.user_id))
            .execute(&mut conn)
            .await?;
            
        // Delete test collections to assets
        use database::schema::collections_to_assets;
        diesel::delete(collections_to_assets::table)
            .filter(collections_to_assets::created_by.eq(self.user_id))
            .execute(&mut conn)
            .await?;
            
        // Delete test collections
        use database::schema::collections;
        diesel::delete(collections::table)
            .filter(collections::created_by.eq(self.user_id)
                   .or(collections::name.like(format!("{}%", self.test_id))))
            .execute(&mut conn)
            .await?;
            
        // Delete test metric files
        use database::schema::metric_files;
        diesel::delete(metric_files::table)
            .filter(metric_files::created_by.eq(self.user_id)
                   .or(metric_files::name.like(format!("{}%", self.test_id))))
            .execute(&mut conn)
            .await?;
            
        // Delete test dashboard files
        use database::schema::dashboard_files;
        diesel::delete(dashboard_files::table)
            .filter(dashboard_files::created_by.eq(self.user_id)
                   .or(dashboard_files::name.like(format!("{}%", self.test_id))))
            .execute(&mut conn)
            .await?;
            
        // Delete test messages
        use database::schema::messages;
        diesel::delete(messages::table)
            .filter(messages::created_by.eq(self.user_id))
            .execute(&mut conn)
            .await?;
            
        // Delete test chats
        use database::schema::chats;
        diesel::delete(chats::table)
            .filter(chats::created_by.eq(self.user_id)
                   .or(chats::title.like(format!("{}%", self.test_id))))
            .execute(&mut conn)
            .await?;
            
        // Delete test user-organization relationships
        use database::schema::users_to_organizations;
        diesel::delete(users_to_organizations::table)
            .filter(users_to_organizations::user_id.eq(self.user_id))
            .execute(&mut conn)
            .await?;
            
        // Delete test users
        use database::schema::users;
        diesel::delete(users::table)
            .filter(users::id.eq(self.user_id))
            .execute(&mut conn)
            .await?;
            
        // Delete test organizations
        use database::schema::organizations;
        diesel::delete(organizations::table)
            .filter(organizations::id.eq(self.organization_id))
            .execute(&mut conn)
            .await?;
            
        Ok(())
    }
}

impl Drop for TestDb {
    fn drop(&mut self) {
        if self.initialized {
            // In a test environment, we can't create a new runtime
            // So we'll just log that cleanup is skipped
            // In real usage, explicit cleanup should be called at the end of tests
            tracing::info!("TestDb dropped - explicit cleanup() call is recommended at the end of tests");
        }
    }
}

/// Helper struct for test setup
pub struct TestSetup {
    pub user: AuthenticatedUser,
    pub organization: Organization,
    pub db: TestDb,
}

impl TestSetup {
    /// Creates a new test setup with authenticated user
    pub async fn new(role: Option<UserOrganizationRole>) -> Result<Self> {
        let test_db = TestDb::new().await?;
        let (user, org) = test_db.create_authenticated_user(role).await?;
        
        Ok(Self {
            user,
            organization: org,
            db: test_db,
        })
    }
}