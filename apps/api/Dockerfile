FROM lukemathwalker/cargo-chef AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
ARG CARGO_HOME=/usr/local/cargo

# Copy the recipe and cook dependencies with cache mounts
COPY --from=planner /app/recipe.json recipe.json
RUN --mount=type=cache,target=${CARGO_HOME}/registry \
    --mount=type=cache,target=${CARGO_HOME}/git \
    --mount=type=cache,target=/app/target \
    cargo chef cook --release --recipe-path recipe.json

# Build the application with cache mounts
COPY . .
RUN --mount=type=cache,target=${CARGO_HOME}/registry \
    --mount=type=cache,target=${CARGO_HOME}/git \
    --mount=type=cache,target=/app/target \
    cargo build --release --bin buster_server && \
    cp /app/target/release/buster_server /app/buster_server

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssh-client \
    curl \
    unzip \
    libpq5 \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create PostgreSQL cert directory
RUN mkdir -p /root/.postgresql

# Handle certs
COPY cert.pem* /usr/local/share/ca-certificates/cert.crt
COPY cert.pem* /root/.postgresql/root.crt
RUN update-ca-certificates

# Set production environment variables
ENV RUST_LOG=warn
ENV RUST_BACKTRACE=0

COPY --from=builder /app/buster_server .
EXPOSE 3001
ENTRYPOINT ["./buster_server"]
