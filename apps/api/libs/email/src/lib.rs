// //! Email library documentation
// //! 
// //! This library contains logic related to sending emails, including invites and notifications, using Resend.

pub use anyhow::{Result, Error};

pub mod resend;
// // pub mod models; // Consider moving structs like CollectionInvite etc. here if they grow complex
// // pub mod utils;
// // mod errors;

// Re-exports public API from the resend module
pub use resend::{send_email, EmailType, CollectionInvite, DashboardInvite, ThreadInvite, InviteToBuster};

// // Example placeholder for where the resend logic might go
// pub async fn resend_email(/* parameters */) -> Result<()> {
//     // Implementation to be moved here
//     tracing::info!("Resend email logic placeholder");
//     Ok(())
// } 