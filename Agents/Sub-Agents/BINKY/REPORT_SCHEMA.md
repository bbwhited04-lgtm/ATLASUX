# REPORT_SCHEMA.md — BINKY

## Inputs
- Platform agent reports (LINK, KELLY, DWIGHT, TERRY, FRAN, etc.)
- Daily-Intel scrub report
- Web/news/trend sources

## Output: BINKY_DAILY_SUMMARY (Required)
Fields:
- date
- world_news (top items + sources)
- national_news (top items + sources)
- local_news (top items + sources)
- platform_trends:
  - tiktok
  - facebook
  - instagram
  - threads
  - x
  - reddit
  - linkedin
  - pinterest
- hashtags (ranked)
- viral_videos (links/notes)
- hot_takes (flagged as opinion)
- risk_flags (misinfo / sensitivity / policy risk)
- opportunities (content angles)
- truth_notes (what is unverified)

Status:
- DRAFT -> READY -> ARCHIVED
