# HIVE Development Rules (Windsurf)

This project uses **HIVE** (AI-Native Software Factory).
Full protocol: `AGENTS.md` · Project config: `.hive/AGENTS.local.md`

## Session start

1. Read `AGENTS.md` — universal rules
2. Read `.hive/AGENTS.local.md` — project config (stack, ticket tool, autonomy)
3. Load `mem_context()` via hive-memory MCP — restore cross-session memory
4. Print: `[HIVE] {project.name} · {stack} · {autonomy.level}`

## Non-negotiable

- TDD first — failing test before any implementation
- DDD order: Domain → Application → Infrastructure → Presentation
- No cross-layer imports (pre-commit hook enforces this)
- Full type safety, English only

## Context loading

- Load only the agent file for the current task: `.hive/.agents/<role>.md`
- Load only the relevant standard: `backend.mdc` OR `frontend.mdc`, never both
- Use `.hive/specs/SPEC.md` for sprint context (not the ticket board directly)

## Commands

Use HIVE commands via your AI tool: `/ship`, `/plan-be`, `/dev-be`, `/generate`, `/review`
See `.hive/.commands/` for all command specs.
