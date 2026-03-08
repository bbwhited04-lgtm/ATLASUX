#!/usr/bin/env bash
# lucy-dev.sh — Start Lucy Voice Engine locally with ngrok tunnel
#
# Prerequisites:
#   - ngrok installed and authenticated (ngrok config add-authtoken <token>)
#   - LUCY_VOICE_ENABLED=true in backend/.env
#   - TWILIO_* credentials in backend/.env
#   - GOOGLE_APPLICATION_CREDENTIALS pointing to service account JSON
#
# Usage:
#   cd backend && bash scripts/lucy-dev.sh
#
# This script:
#   1. Starts ngrok tunnel on port 8787
#   2. Extracts the public URL
#   3. Updates Twilio webhook URLs to point at ngrok
#   4. Starts the backend server with Lucy enabled

set -euo pipefail

PORT="${PORT:-8787}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Lucy Voice Engine — Local Development Runner${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check prerequisites
if ! command -v ngrok &>/dev/null; then
  echo "ERROR: ngrok not found. Install: snap install ngrok"
  exit 1
fi

# Source .env
if [ -f "$BACKEND_DIR/.env" ]; then
  set -a
  source "$BACKEND_DIR/.env"
  set +a
fi

# Verify critical env vars
missing=()
[ -z "${TWILIO_ACCOUNT_SID:-}" ] && missing+=("TWILIO_ACCOUNT_SID")
[ -z "${TWILIO_AUTH_TOKEN:-}" ] && missing+=("TWILIO_AUTH_TOKEN")
[ -z "${TWILIO_FROM_NUMBER:-}" ] && missing+=("TWILIO_FROM_NUMBER")
[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ] && missing+=("GOOGLE_APPLICATION_CREDENTIALS")

if [ ${#missing[@]} -gt 0 ]; then
  echo -e "${YELLOW}WARNING: Missing env vars: ${missing[*]}${NC}"
  echo "Lucy may not function correctly without these."
  echo ""
fi

# Force Lucy enabled for local dev
export LUCY_VOICE_ENABLED=true
export LUCY_VOICE_NAME="${LUCY_VOICE_NAME:-en-US-Neural2-F}"
export LUCY_VOICE_SPEAKING_RATE="${LUCY_VOICE_SPEAKING_RATE:-1.0}"
export LUCY_MAX_CONCURRENT_SESSIONS="${LUCY_MAX_CONCURRENT_SESSIONS:-3}"

# Start ngrok in background
echo -e "${GREEN}[1/3] Starting ngrok tunnel on port ${PORT}...${NC}"
ngrok http "$PORT" --log=stdout --log-level=warn > /tmp/ngrok-lucy.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to establish tunnel
sleep 3

# Extract public URL from ngrok API
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tunnels = data.get('tunnels', [])
    for t in tunnels:
        if t.get('proto') == 'https':
            print(t['public_url'])
            break
    else:
        if tunnels:
            print(tunnels[0]['public_url'])
except:
    pass
" 2>/dev/null || echo "")

if [ -z "$NGROK_URL" ]; then
  echo "ERROR: Could not get ngrok URL. Check ngrok auth: ngrok config add-authtoken <token>"
  kill $NGROK_PID 2>/dev/null || true
  exit 1
fi

echo -e "${GREEN}[2/3] ngrok tunnel active${NC}"
echo -e "  Public URL:  ${CYAN}${NGROK_URL}${NC}"
echo -e "  WebSocket:   ${CYAN}${NGROK_URL/https/wss}/v1/twilio/voice/stream${NC}"
echo ""

# Update Twilio webhook URL if credentials are available
if [ -n "${TWILIO_ACCOUNT_SID:-}" ] && [ -n "${TWILIO_AUTH_TOKEN:-}" ] && [ -n "${TWILIO_FROM_NUMBER:-}" ]; then
  echo -e "${GREEN}[2.5/3] Updating Twilio webhook URLs...${NC}"

  # Get the phone number SID
  PHONE_SID=$(curl -s -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
    "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PhoneNumber=%2B1${TWILIO_FROM_NUMBER}" \
    | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    numbers = data.get('incoming_phone_numbers', [])
    if numbers:
        print(numbers[0]['sid'])
except:
    pass
" 2>/dev/null || echo "")

  if [ -n "$PHONE_SID" ]; then
    # Update voice webhook URL
    curl -s -X POST \
      -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
      "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${PHONE_SID}.json" \
      -d "VoiceUrl=${NGROK_URL}/v1/twilio/voice/inbound" \
      -d "VoiceMethod=POST" \
      -d "StatusCallback=${NGROK_URL}/v1/twilio/voice/status" \
      -d "StatusCallbackMethod=POST" \
      -d "SmsUrl=${NGROK_URL}/v1/twilio/sms/inbound" \
      -d "SmsMethod=POST" \
      > /dev/null 2>&1

    echo -e "  Voice webhook: ${CYAN}${NGROK_URL}/v1/twilio/voice/inbound${NC}"
    echo -e "  SMS webhook:   ${CYAN}${NGROK_URL}/v1/twilio/sms/inbound${NC}"
    echo -e "  Status:        ${CYAN}${NGROK_URL}/v1/twilio/voice/status${NC}"
  else
    echo -e "${YELLOW}  Could not find phone number SID — update Twilio webhooks manually${NC}"
  fi
  echo ""
fi

# Set the webhook base URL for Twilio signature validation
export TWILIO_WEBHOOK_BASE_URL="${NGROK_URL}"

echo -e "${GREEN}[3/3] Starting backend with Lucy enabled...${NC}"
echo -e "  Lucy Voice:    ${CYAN}ENABLED${NC}"
echo -e "  Voice Name:    ${CYAN}${LUCY_VOICE_NAME}${NC}"
echo -e "  Speaking Rate: ${CYAN}${LUCY_VOICE_SPEAKING_RATE}${NC}"
echo -e "  Max Sessions:  ${CYAN}${LUCY_MAX_CONCURRENT_SESSIONS}${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Call Lucy: ${GREEN}+1 (573) 742-2028${NC}"
echo -e "  ngrok UI: ${CYAN}http://127.0.0.1:4040${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo "Shutting down Lucy..."
  kill $NGROK_PID 2>/dev/null || true

  # Restore Twilio webhooks to production URL if we updated them
  if [ -n "${PHONE_SID:-}" ] && [ -n "${TWILIO_ACCOUNT_SID:-}" ]; then
    echo "Restoring Twilio webhooks to production..."
    curl -s -X POST \
      -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
      "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${PHONE_SID}.json" \
      -d "VoiceUrl=https://api.atlasux.cloud/v1/twilio/voice/inbound" \
      -d "VoiceMethod=POST" \
      -d "StatusCallback=https://api.atlasux.cloud/v1/twilio/voice/status" \
      -d "StatusCallbackMethod=POST" \
      -d "SmsUrl=https://api.atlasux.cloud/v1/twilio/sms/inbound" \
      -d "SmsMethod=POST" \
      > /dev/null 2>&1
    echo "Twilio webhooks restored to production."
  fi
}
trap cleanup EXIT

# Start the backend
cd "$BACKEND_DIR"
npx tsx watch src/server.ts
