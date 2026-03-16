@echo off
:: Atlas UX Slack Worker — Auto-start on Windows login
:: Place a shortcut to this file in shell:startup

cd /d H:\ATLASUX\backend
start "SlackWorker" cmd /k "npx tsx watch src/workers/slackWorker.ts"
