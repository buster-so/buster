// NOTE: This module is for tests only and is not included in release builds
// The cargo test framework ensures this code only runs during tests

use database::pool::init_pools;
use lazy_static::lazy_static;

// Import test modules
pub mod helpers;
pub mod common;
pub mod test_infrastructure;

// Re-export test modules
#[allow(unused_imports)]
use helpers::metric_files_test;

lazy_static! {
    // Initialize test environment once across all tests
    static ref TEST_ENV: () = {
        // Create a runtime for initialization
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        // Initialize pools
        if let Err(e) = rt.block_on(init_pools()) {
            panic!("Failed to initialize test pools: {}", e);
        }
        
        println!("✅ Test environment initialized");
    };
}

// This constructor runs when the test binary loads
// It is excluded from non-test builds because the entire 'tests' directory
// is only compiled during 'cargo test'
#[ctor::ctor]
fn init_test_env() {
    // Force lazy_static initialization
    lazy_static::initialize(&TEST_ENV);
}