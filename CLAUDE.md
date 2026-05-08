<!-- hive:managed -->
# CLAUDE.md

> This file is read by **Claude Code** (CLI) on every session startup.
> It provides Claude Code-specific configuration on top of `AGENTS.md`.
> For the full agent protocol, read `AGENTS.md` first.

---

## Claude Code Setup

### Slash commands

All HIVE commands are available in `.claude/commands/` — type `/` to see them.

| Command | What it does | Interactive? |
|---|---|---|
| `/kickoff` | Full project init: strategy → PRD → architecture → tickets | Yes — 4 checkpoints |
| `/ship <ticket>` | Full pipeline: enrich → plan → tdd → implement → commit | Yes — 2 checkpoints |
| `/run <tickets...>` | Batch: process multiple tickets autonomously (server/overnight) | No |
| `/run --sprint <name>` | Batch by sprint: loads tickets from the tool, auto-closes if configured | No |
| `/sprint-close` | Close sprint, handle incomplete tickets, tag repo, optionally open next | Yes — confirms |
| `/sprint-setup` | Create sprint tickets + generate SPEC.md | Yes — 1 checkpoint |
| `/intake` | Client onboarding: gather requirements → `functional-context.md` → feeds `/kickoff` | Yes |
| `/strategy` | Standalone strategy analysis (optional — `/kickoff` includes strategy as Phase 1) | Yes |
| `/assess <path>` | Analyse a legacy codebase and produce migration plan | No |
| `/focus <module>` | Restrict agent scope to a module (legacy projects) | No |
| `/enrich <ticket>` | Enrich ticket with Given/When/Then — flags L/XL for splitting | Yes |
| `/split <ticket>` | Decompose L/XL ticket into 2–5 smaller S/M tickets | Yes — confirms plan |
| `/new-ticket <description>` | Create a new ticket from plain language description | No |
| `/plan-be <ticket>` | Backend DDD implementation plan | No |
| `/plan-fe <ticket>` | Frontend component plan | No |
| `/tdd <ticket>` | Write failing tests before implementation (red phase) | No |
| `/dev-be <ticket>` | Implement backend (TDD green phase) | No |
| `/dev-fe <ticket>` | Implement frontend | No |
| `/generate <entity>` | Scaffold DDD stubs — checks `.hive/.skills/` then stack `generate.yml` | No |
| `/resume <ticket>` | Resume interrupted `/ship` pipeline from last checkpoint | No |
| `/commit <ticket>` | Stage, commit, push, PR | Yes — confirms before push |
| `/review` | Review PR: DDD, SOLID, security, coverage | No |
| `/judgment-day <ticket\|pr>` | Adversarial parallel review: two independent judges | No |
| `/profile [switch\|list\|create]` | Manage model profiles — switch cost/quality tradeoff | No |
| `/memory <save\|search\|context\|session-summary>` | Persistent cross-session memory | No |
| `/update-docs` | Keep docs in sync after implementation changes | No |
| `/sync` | Regenerate SPEC.md from Jira | No |
| `/ci` | Generate or update CI/CD pipeline config | No |
| `/deploy` | Verify, tag release, deliver to client repo | Yes — confirms version |
| `/status` | Show current project config, autonomy, profile, interrupted pipelines | No |
| `/health` | Active project diagnostics: config gaps, stale specs, recent errors | No |
| `/explain <topic>` | Teach a concept, pattern, or piece of code | No |
| `/meta` | Improve or debug a HIVE prompt/command | No |

### MCP servers

`hive new` configures the global MCPs automatically (opt-out available). To add manually:

```json
{
  "mcpServers": {
    "context7":            { "url": "https://mcp.context7.com/mcp" },
    "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] },
    "figma":               { "url": "https://mcp.figma.com/mcp" },
    "playwright":          { "url": "https://mcp.playwright.dev/mcp" },
    "atlassian":           { "url": "https://mcp.atlassian.com/v1/mcp" },

    "hive-memory":  { "command": "hive-memory" },
    "hive-tickets": { "command": "hive-tickets" }
  }
}
```

**Scope:** `context7` and `sequential-thinking` are global — they benefit every session including HIVE's own development. `figma` and `playwright` are project-oriented. `hive-memory` and `hive-tickets` auto-detect the active project by walking up from the current directory (no `--project-dir` needed).

**HIVE native MCPs** (install from `mcp/` in the factory repo):
```bash
pip install -e /path/to/hive/mcp/hive-memory   # mem_save, mem_search, mem_context...
pip install -e /path/to/hive/mcp/hive-tickets   # ticket_get, ticket_update, ticket_list_sprint...
```

See `mcp/README.md` for full setup and backend configuration (Jira, Linear, GitHub Issues, Plane).

### Context loading strategy (token-efficient)

Claude Code reads files on demand. Follow this order strictly:

1. **Always first**: `AGENTS.md` (universal rules), then `.hive/AGENTS.local.md` (project config)
2. **Per command**: only the agent for the current task (`.hive/.agents/<role>.md`)
3. **Per area**: only the relevant standard (`backend.mdc` OR `frontend.mdc`, never both)
4. **Sprint context**: `.hive/specs/SPEC.md` (compact summary — preferred over querying Jira)
5. **Implementation plan**: `.hive/changes/{ticket}_backend.md` (read it, don't regenerate)
6. **Legacy context**: `.hive/specs/LEGACY_CONTEXT.md` and `.hive/specs/COEXISTENCE_RULES.md` — only when `legacy.is_legacy: true`
7. **Focus scope**: `.hive/sessions/focus.md` — check before any write operation if it exists

**Never** load all agents and all standards at session start.

### Memory and long sessions

- Core memory file: `.hive/AGENTS.local.md` — re-read at start of each session
- After 30-40 interactions: run `/compact` to summarize context before degradation
- For new sessions on the same ticket: re-read `.hive/changes/{ticket}_backend.md`

### Parallel agents (Claude Code Max)

For independent tickets, Claude Code Max supports parallel agents.
Recommended split: one agent per epic, not one agent per ticket.

### Legacy projects

When working on a legacy project (`legacy.is_legacy: true` in `AGENTS.local.md`):

1. All commands automatically check `legacy.protected_paths` before writing any file
2. Use `/focus <module>` to restrict the session scope to one module:
   ```
   /focus src/payments     # agents can only write inside src/payments/
   /focus --clear          # remove focus restriction
   ```
3. The focus scope is saved in `.hive/sessions/focus.md` and persists across commands in the session
<!-- /hive:managed -->

---

<!-- hive:project-notes -->
## Project Notes

Add project-specific Claude Code configuration below this line.
This section is preserved by sync-standards.sh and never overwritten.

### Developer tools (HIVE repo only)

Run `make` to see all available commands. Common ones:

| Command | What it does |
|---|---|
| `make setup` | First-time setup: deps, pre-commit hook, MCPs, principle check |
| `make check` | Run all framework integrity checks (same as CI) |
| `make lint` | Lint all shell scripts with shellcheck |
| `make budget` | List all commands with token cost |
| `make budget-full` | Token estimate for a full ticket pipeline |
<!-- /hive:project-notes -->
