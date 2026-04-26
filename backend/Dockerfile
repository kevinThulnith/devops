# Stage 1: Builder
FROM python:3.14-alpine AS builder

COPY --from=ghcr.io/astral-sh/uv:0.7.15 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

# Install ALL build + runtime deps here
RUN apk add --no-cache \
    build-base \
    libffi-dev \
    postgresql-dev \
    jpeg-dev \
    zlib-dev \
    musl-dev \
    brotli-dev

# Install dependencies first (cached layer)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-editable

COPY . /app

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-editable

# Strip test suites from installed packages — never needed at runtime
# Excludes django/test because simplejwt imports django.test.signals at runtime
RUN find /app/.venv/lib -type d \( -name "tests" -o -name "test" \) \
    ! -path "*/django/test" \
    | xargs rm -rf

# Stage 2: Production
FROM python:3.14-alpine

# Install only runtime dependencies (not build tools)
RUN apk add --no-cache \
    libffi \
    libpq \
    jpeg \
    zlib \
    brotli-libs

# Create non-root user
RUN adduser -D -s /bin/sh appuser && \
    mkdir -p /app/media /app/staticfiles /app/logs && \
    chown -R appuser:appuser /app && \
    chmod -R 777 /app/logs

WORKDIR /app

# Copy venv from builder
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# Copy application code
COPY --chown=appuser:appuser . .

RUN sed -i 's/\r$//' /app/entrypoint.prod.sh && \
    chmod +x /app/entrypoint.prod.sh

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

USER appuser

EXPOSE 8000

VOLUME ["/app/media", "/app/logs"]

CMD ["/app/entrypoint.prod.sh"]