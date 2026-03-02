# HIERARCHY.md -- Atlas UX Executive Layer

This folder contains the two executive-tier agents who report directly to
the Chairman (human authority) and together run all day-to-day operations.

## Organizational Chart

```
Chairman (Billy E. Whited) .................. Board
  |
  +-- Atlas  (President / CEO) .............. Executive
  |     |
  |     +-- Executive-Staff/
  |     |     +-- TREASURER_TINA (CFO) ..... Governor
  |     |     +-- SECRETARY_LARRY (Audit) .. Governor
  |     |     +-- LEGAL_COUNSEL_JENNY ...... Specialist
  |     |     +-- IP_COUNSEL_BENNY ......... Specialist
  |     |
  |     +-- Sub-Agents/ (Atlas direct reports outside Binky's tree)
  |           +-- LUCY (Receptionist)
  |           +-- MERCER (Customer Acquisition)
  |           +-- PETRA (Project Manager)
  |           +-- PORTER (SharePoint, reports to Larry)
  |
  +-- Binky  (Chief Research Officer / CRO) . Executive
        |
        +-- Direct-Reports/
              +-- CHERYL (Customer Support)
              +-- DAILY-INTEL (Intel Aggregator)
              +-- ARCHY (Research Subagent)
              +-- FRANK (Forms & Data Collection)
              +-- SUNDAY (Comms & Docs Writer)
                    |
                    +-- Social-Media-Team/
                          +-- VENNY (Image/Video Production)
                          |     +-- VICTOR (Video Specialist)
                          +-- PENNY (Facebook Ads)
                          +-- DONNA (Reddit)
                          +-- CORNWALL (Pinterest)
                          +-- LINK (LinkedIn)
                          +-- DWIGHT (Threads)
                          +-- REYNOLDS (Blog)
                          +-- EMMA (Alignable)
                          |     +-- CLAIRE (Calendar)
                          |     +-- SANDY (Bookings)
                          +-- FRAN (Facebook Page)
                          +-- KELLY (X / Twitter)
                          +-- TERRY (Tumblr)
                          +-- TIMMY (TikTok)
```

## Reporting Chain Rules

1. Every agent has exactly one `reportsTo` parent defined in
   `backend/src/agents/registry.ts`.
2. Escalation always flows upward: agent -> parent -> Atlas -> Chairman.
3. No agent may bypass its reporting chain.
4. Folder nesting in this directory mirrors the reporting chain exactly.

## Source of Truth

The canonical agent definitions (IDs, tiers, reporting lines, tool
permissions) live in `backend/src/agents/registry.ts`. This folder
structure is the **organizational mirror** of that registry for
configuration files, soul documents, and policy files.

Last Updated: 2026-03-02
