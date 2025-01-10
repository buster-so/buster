FROM lukemathwalker/cargo-chef AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder 
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --bin bi_api

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

COPY --from=builder /app/target/release/bi_api .
EXPOSE 3001
ENTRYPOINT ["./bi_api"]
