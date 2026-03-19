#!/usr/bin/env bash
# deploy.sh — Push, build, and deploy Atlas UX to AWS Lightsail
# Usage: bash deploy.sh [frontend|backend|all]
# Default: all

set -euo pipefail

HOST="bitnami@3.94.224.34"
KEY="$HOME/.ssh/lightsail-default.pem"
SSH="ssh -i $KEY $HOST"
SCP="scp -i $KEY"
REMOTE_DIR="/home/bitnami"

TARGET="${1:-all}"

echo "=== Atlas UX Deploy: $TARGET ==="

# --- Git push ---
echo ">> Pushing to origin..."
git push origin main

# --- Frontend ---
if [[ "$TARGET" == "frontend" || "$TARGET" == "all" ]]; then
  echo ">> Building frontend..."
  npm run build

  echo ">> Deploying frontend to $HOST..."
  $SCP -r ./dist/* "$HOST:$REMOTE_DIR/dist/"
  echo ">> Frontend deployed."
fi

# --- Backend ---
if [[ "$TARGET" == "backend" || "$TARGET" == "all" ]]; then
  echo ">> Building backend..."
  cd backend && npm run build && cd ..

  echo ">> Syncing backend to $HOST..."
  # Send compiled JS + package files
  $SCP -r ./backend/dist/* "$HOST:$REMOTE_DIR/backend/dist/"
  $SCP ./backend/package.json "$HOST:$REMOTE_DIR/backend/package.json"
  $SCP ./backend/package-lock.json "$HOST:$REMOTE_DIR/backend/package-lock.json"

  # Send prisma schema for any migrations
  $SCP -r ./backend/prisma "$HOST:$REMOTE_DIR/backend/"

  echo ">> Installing deps + generating Prisma client on server..."
  $SSH "export PATH=/opt/bitnami/node/bin:\$PATH && cd $REMOTE_DIR/backend && npm ci --omit=dev && npx prisma generate"

  echo ">> Running pending migrations..."
  $SSH "export PATH=/opt/bitnami/node/bin:\$PATH && cd $REMOTE_DIR/backend && npx prisma migrate deploy"

  echo ">> Restarting PM2 processes..."
  $SSH "export PATH=/opt/bitnami/node/bin:\$PATH && cd $REMOTE_DIR/backend && pm2 restart all"

  # Add slack-worker if not already registered
  $SSH "export PATH=/opt/bitnami/node/bin:\$PATH && pm2 describe slack-worker > /dev/null 2>&1 || (cd $REMOTE_DIR/backend && pm2 start dist/workers/slackWorker.js --name slack-worker && pm2 save)"

  echo ">> Backend deployed."
fi

# --- Verify ---
echo ">> Verifying deployment..."
$SSH "export PATH=/opt/bitnami/node/bin:\$PATH && pm2 status"
echo ""
echo ">> Health check:"
curl -sf https://atlasux.cloud/v1/health || echo "(health endpoint not reachable — check DNS/nginx)"

echo ""
echo "=== Deploy complete ==="
