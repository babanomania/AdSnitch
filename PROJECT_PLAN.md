# Project Plan for AdSnitch

This document tracks tasks derived from the README goals.

## Phase 1 - Core Bot

- [x] Initialize Node.js project
- [x] Create environment variable template
- [x] Build Discord bot skeleton
- [x] Implement log parsing for Pi-hole/AdGuard (via plugins)
- [x] Aggregate daily DNS request statistics
- [x] Provide mock log plugin and domain owner DB
- [x] Generate satirical summary using TinyLlama
- [x] Fetch domain info for context-aware summary (now via VirusTotal)
- [x] Schedule daily summary via cron
- [x] Send summary to Discord as an embed

## Phase 2 - Extended Features

- [ ] Web UI for configuring tone presets
- [ ] Support other DNS filters (NextDNS, Unbound)
- [ ] Add meme mode
- [ ] Add Munna Bhai mode

## Recently Completed

- [x] AdGuard and Pi-hole plugins use modern API endpoints
- [x] Unified plugin interface for DNS sources
- [x] VirusTotal integration for domain intelligence and risk summary
- [x] Single [VT] summary with witty LLM commentary
- [x] Robust .env and README documentation

Future improvements may include tests, packaging, and more robust summarization.
