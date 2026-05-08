# AGENTS.local.md — Moshi Print
# hive_version: 1.3.0
_Created: 2026-05-07 | Stack: node-react-prisma_

---

## Project Identity

```yaml
name: "Moshi Print"
tech_lead: "Rafael"
stack: "node-react-prisma"
```

---

## Language

```yaml
language:
  code: "en"                  # Code is ALWAYS English — no exceptions
  communication: "en"  # Agent responses, commits, PRs
```

---

## Ticket Provider

```yaml
ticket_provider:
  tool: "github-issues"
  mcp_name: "GitHub"
  board_url: "https://github.com/Kreitech/moshi-print/issues"
  id_format: "MP-{number}"

  statuses:
    backlog:     "backlog"
    to_refine:   "to-refine"
    refined:     "ready"
    in_progress: "in-progress"
    in_review:   "in-review"
    done:        "done"
    blocked:     "blocked"

  auto_transition_after_enrich: true
```

---

## Build & Verification Commands

```yaml
verify_commands:
  test:      "npm test"
  typecheck: "npm run typecheck"
  lint:      "npm run lint"
  coverage:  "npm run test:coverage"
  build:     "npm run build"
```

---

## Package Manager

```yaml
package_manager:
  tool:        "npm"
  install_cmd: "npm install"
  add_dep_cmd: "npm install <pkg>"
```

---

## Version Control

```yaml
vcs:
  platform:             "github"
  mcp_name:             "GitHub"
  default_base_branch:  "develop"
  branch_pattern:       "feature/\{ticket-id\}-\{description\}"
  pr_tool:              "gh"
  ai_trailer:           true
```

---

## Design Tool

```yaml
design_tool:
  tool:     "none"     # figma | zeplin | none
  mcp_name: "none"     # Figma | none
```

---

## Autonomy

```yaml
autonomy:
  level: "autonomous"   # supervised | balanced | autonomous

  # Semantic pre-commit review — calls the AI before every commit
  # Disabled by default: enable only when team is comfortable with the overhead.
  # When disabled: only mechanical checks run (lint, typecheck) — 0 LLM tokens.
  # When enabled: staged diff sent to ai_cli for standards validation.
  review_on_commit: false

  # AI CLI to use for pre-commit review (ignored when review_on_commit: false)
  # Options: claude | gemini | codex | ollama:<model>
  # Leave "none" if review_on_commit is false.
  ai_cli: "none"

  circuit_breaker:
    max_test_retries:      3
    max_new_files:         10
    max_tokens_per_ticket: 50000
```

---

## Fallbacks

```yaml
fallbacks:
  ticket_unavailable: "ask"
  design_unavailable: "ask"
  ticket_paste_format: |
    Please paste the ticket content:
    ---
    ID: <ticket-id>
    Title: <title>
    Description: <full description>
    Acceptance Criteria:
    - <criterion 1>
    - <criterion 2>
    Current Status: <status>
    ---
```

---

## Model Routing

```yaml
# Active profile — switch with: /profile switch <name>
active_profile: "default"

# Profile definitions. Each profile assigns models to the three pipeline phases.
# Switch profiles without editing this file: /profile switch quality
model_profiles:
  default:
    # Balanced daily driver — Sonnet handles everything competently at moderate cost.
    planning:       "claude-sonnet-4-6"
    implementation: "claude-sonnet-4-6"
    review:         "claude-sonnet-4-6"

  quality:
    # Critical tickets, architecture decisions, thorough reviews.
    # Opus for judgment-heavy phases; Sonnet for the implementation loop.
    planning:       "claude-opus-4-6"
    implementation: "claude-sonnet-4-6"
    review:         "claude-opus-4-6"

  fast:
    # Hotfixes, S-size tickets, overnight batch runs.
    # Sonnet still handles planning (needs reasoning); Haiku for the coding loop.
    planning:       "claude-sonnet-4-6"
    implementation: "claude-haiku-4-5"
    review:         "claude-sonnet-4-6"

# model_routing is the resolved values for the active profile above.
# Agents read this — change active_profile instead of editing manually.
model_routing:
  planning:       null
  implementation: null
  review:         null
```

---

## Ticket Transitions

```yaml
ticket_provider:
  ticket_transitions:
    mode:          "standard"   # minimal | standard | verbose
    auto_merge_pr: false
```

---

## Sprint Lifecycle

```yaml
sprint_lifecycle:
  # Close the sprint automatically when /run --sprint finishes all tickets
  auto_close_on_batch_complete: false

  # After closing, automatically open the next sprint
  auto_open_next: false

  # What to do with incomplete tickets on close
  # Options: move_to_next | move_to_backlog | keep
  incomplete_tickets: "move_to_next"

  # Create a git tag when a sprint is closed  (tag name: sprint-N)
  tag_on_close: true

  # Send webhook notifications on sprint close/open
  notify_on_close: true
  notify_on_open:  true
```

---

## Project-Specific Rules

<!-- Add project overrides here as the project evolves -->
