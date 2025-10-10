FROM python:3.12-slim

# System tools you asked for
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash curl ca-certificates git gh ripgrep tree tar \
 && rm -rf /var/lib/apt/lists/*

# dbt core + requested adapters (Postgres, Redshift, BigQuery, Snowflake, Databricks, SQL Server, MySQL)
RUN pip install --no-cache-dir \
    dbt-core \
    dbt-postgres
    # dbt-redshift \
    # dbt-bigquery \
    # dbt-snowflake \
    # dbt-databricks \
    # dbt-sqlserver \
    # dbt-mysql

# Buster CLI (binary release)
RUN echo "Downloading buster CLI v0.3.1..." \
 && curl -fsSL "https://github.com/buster-so/buster/releases/download/v0.3.1/buster-cli-linux-x86_64.tar.gz" -o /tmp/buster-cli.tar.gz \
 && tar -xzf /tmp/buster-cli.tar.gz -C /tmp \
 && mv /tmp/buster /usr/bin/buster \
 && chmod +x /usr/bin/buster \
 && rm /tmp/buster-cli.tar.gz


 RUN echo "Verifying installation..." \
 && buster --version \
 && dbt --version \
 && echo "✅ buster & dbt installed successfully"

