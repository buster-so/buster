use anyhow::Result;
use inquire::{MultiSelect, Select};
use std::process::Stdio;
use tokio::process::Command;

pub async fn check_dbt_installation() -> Result<()> {
    let output = Command::new("dbt")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .output()
        .await?;

    let version = String::from_utf8_lossy(&output.stdout);
    let version = match version
        .lines()
        .find(|line| line.contains("installed:"))
        .and_then(|line| line.split_whitespace().nth(2))
    {
        Some(version) => version,
        None => {
            match Select::new(
                "dbt is not installed. Would you like to install it?",
                vec!["Yes", "No"],
            )
            .with_vim_mode(true)
            .prompt()?
            {
                "Yes" => {
                    install_dbt().await?;
                    return Ok(());
                }
                "No" => anyhow::bail!("dbt is not installed. Please install it first."),
                _ => anyhow::bail!("Invalid input"),
            }
        }
    };

    println!("Found dbt version: {}", version);

    if !output.status.success() {
        anyhow::bail!("dbt is not installed or not working properly");
    }
    Ok(())
}

pub async fn install_dbt() -> Result<()> {
    // Check for pip/pip3
    let pip_cmd = if Command::new("pip3")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .is_ok()
    {
        "pip3"
    } else if Command::new("pip")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .is_ok()
    {
        "pip"
    } else {
        anyhow::bail!("Neither pip nor pip3 is installed. Please install Python and pip first.");
    };

    // Available adapters
    let adapters = vec![
        "postgres",
        "bigquery",
        "snowflake",
        "redshift",
        "duckdb",
        "spark",
    ];

    let selected_adapters =
        MultiSelect::new("Select the dbt adapters you want to install:", adapters)
            .with_vim_mode(true)
            .prompt()?;

    if selected_adapters.is_empty() {
        anyhow::bail!("No adapters selected. Installation cancelled.");
    }

    // Install dbt-core
    let status = Command::new(pip_cmd)
        .arg("install")
        .arg("dbt-core")
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .await?;

    if !status.success() {
        anyhow::bail!("Failed to install dbt-core");
    }

    // Install selected adapters
    for adapter in selected_adapters {
        let status = Command::new(pip_cmd)
            .arg("install")
            .arg(format!("dbt-{}", adapter))
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status()
            .await?;

        if !status.success() {
            anyhow::bail!("Failed to install dbt-{}", adapter);
        }
    }

    Ok(())
}

pub async fn dbt_command(command: &str) -> Result<()> {
    let status = Command::new("dbt")
        .arg(command)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .await?;

    if !status.success() {
        anyhow::bail!("dbt {} failed", command);
    }
    Ok(())
}
