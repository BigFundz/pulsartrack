# Changelog

All notable changes to the PulsarTrack project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] - 2026-09-24

### Added
- **Error Tracking / APM Integration**:
  - Integrated `@sentry/nextjs` into `frontend/` and `@sentry/node` into `backend/`.
  - Added recursive data scrubbing (`scrubEvent`) to strip tokens, passwords, authorization headers, and PII from error reports.
  - Added Sentry DSN configuration instructions to `.env.example` and `DOCKER_SETUP.md`.
- **Governance Token Contract Events**:
  - Validated and tested event emissions (`transfer`, `approve`, `mint`, `burn`, `delegate`, `revoke`) for standard indexer and explorer tracking in `contracts/governance-token`.
- **Recurring Payment Contract Events**:
  - Added event publishing (`recurring` topic with `created`, `paused`, `resumed`, `cancelled` subtopics) to all lifecycle functions in `contracts/recurring-payment`.
  - Added unit test suite `test_recurring_lifecycle_events` asserting event publication for payment creation, pausing, resuming, and cancellation.
- **Monorepo Version Alignment & Documentation**:
  - Created `VERSIONING.md` defining synchronized SemVer across frontend, backend, and all 45 Soroban contracts.
  - Aligned backend versioning to `0.1.0`.
  - Updated `CONTRIBUTING.md` with guidelines for updating versioning policy and `CHANGELOG.md`.
