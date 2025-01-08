FROM lukemathwalker/cargo-chef AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder 
# Add build arguments
ARG DATABASE_URL
ARG REDIS_URL
ARG OPENAI_API_KEY
ARG ANTHROPIC_API_KEY
ARG JWT_SECRET
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG ENVIRONMENT
ARG POOLER_URL
ARG LANGFUSE_API_URL
ARG LANGFUSE_PUBLIC_API_KEY
ARG LANGFUSE_PRIVATE_API_KEY
ARG EMBED_VEC_LENGTH
ARG POSTHOG_API_KEY
ARG RESEND_API_KEY
ARG BUSTER_URL
ARG BUSTER_WH_TOKEN
ARG EMBEDDING_PROVIDER
ARG EMBEDDING_MODEL
ARG COHERE_API_KEY

# Set build arguments as environment variables
ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENV JWT_SECRET=$JWT_SECRET
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV POOLER_URL=$POOLER_URL
ENV LANGFUSE_API_URL=$LANGFUSE_API_URL
ENV LANGFUSE_PUBLIC_API_KEY=$LANGFUSE_PUBLIC_API_KEY
ENV LANGFUSE_PRIVATE_API_KEY=$LANGFUSE_PRIVATE_API_KEY
ENV EMBED_VEC_LENGTH=$EMBED_VEC_LENGTH
ENV POSTHOG_API_KEY=$POSTHOG_API_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV BUSTER_URL=$BUSTER_URL
ENV BUSTER_WH_TOKEN=$BUSTER_WH_TOKEN
ENV EMBEDDING_PROVIDER=$EMBEDDING_PROVIDER
ENV EMBEDDING_MODEL=$EMBEDDING_MODEL
ENV COHERE_API_KEY=$COHERE_API_KEY

# Set environment variables to reduce memory usage during compilation
ENV RUSTFLAGS="-C target-cpu=native -C opt-level=3"
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true
# Limit parallel jobs to reduce memory usage
ENV CARGO_BUILD_JOBS=2

COPY --from=planner /app/recipe.json recipe.json
# Cook dependencies first
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
# Build with reduced parallel jobs
RUN cargo build --release --bin bi_api

FROM debian:bookworm-slim AS runtime
WORKDIR /app

# Add environment variables to runtime stage
ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENV JWT_SECRET=$JWT_SECRET
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssh-client \
    curl \
    unzip \
    libpq5 \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ARG ENVIRONMENT=local
RUN if [ "$ENVIRONMENT" != "local" ]; then \
    COPY cert.pem /usr/local/share/ca-certificates/cert.crt && \
    update-ca-certificates; \
    fi

COPY --from=builder /app/target/release/bi_api .
EXPOSE 3001
ENTRYPOINT ["./bi_api"]
