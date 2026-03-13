FROM node:20-bookworm-slim AS node-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev && npm cache clean --force

FROM python:3.11-slim AS python-builder
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"
WORKDIR /tmp
COPY server/requirements.txt /tmp/requirements.txt
RUN python -m venv "${VIRTUAL_ENV}" \
    && pip install --upgrade pip setuptools wheel \
    && grep -viE '^(torch|torchaudio)([<>=!~].*)?$' requirements.txt > requirements.no-torch.txt \
    && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch torchaudio \
    && pip install --no-cache-dir -r requirements.no-torch.txt

FROM node:20-bookworm-slim AS node-runtime

FROM python:3.11-slim AS runtime
ENV NODE_ENV=production
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=python-builder /opt/venv /opt/venv
COPY --from=node-builder /app/dist ./dist
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/package.json ./package.json
COPY --from=node-builder /app/server/scripts ./server/scripts
COPY --from=node-builder /app/public ./public
RUN mkdir -p /app/public/uploads
EXPOSE 5000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.cjs"]
