# Complete Workflows for Claude Code + everything-claude-code


## Current Setup Status

**Plugin:** `everything-claude-code` is **enabled**
**Location:** `~/.claude/plugins/marketplaces/everything-claude-code/`
**Global Settings:** `~/.claude/settings.json`

---


## Available Slash Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/tdd` | Test-Driven Development | Starting new features - writes tests first |
| `/plan` | Implementation planning | Before complex features - creates step-by-step plan |
| `/e2e` | E2E test generation | After features - generates Playwright tests |
| `/code-review` | Quality review | After writing code - security + maintainability check |
| `/build-fix` | Fix build errors | When build fails - minimal fixes only |
| `/refactor-clean` | Dead code removal | Cleanup - runs knip/depcheck to find unused code |
| `/learn` | Extract patterns | Mid-session - saves learnings to skills |
| `/checkpoint` | Save verification state | During long tasks - creates restore point |
| `/verify` | Run verification loop | Before completion - runs full test suite |
| `/update-codemaps` | Update code maps | After major changes - regenerates docs/CODEMAPS |
| `/update-docs` | Update documentation | After API changes - syncs docs |
| `/setup-pm` | Configure package manager | First time setup - sets npm/pnpm/yarn/bun |
| `/eval` | Run evaluation harness | Testing skill/agent performance |
| `/orchestrate` | Multi-agent orchestration | Complex tasks requiring multiple agents |
| `/test-coverage` | Check test coverage | Verify 80%+ coverage requirement |
| `/security-review` | Security checklist | After touching auth/input/APIs |

---

## Available Skills

Skills are workflow definitions invoked via `/skill-name` or automatically by agents.

| Skill | Purpose | Activation |
|-------|---------|------------|
| `tdd-workflow` | Full TDD methodology with 80%+ coverage | `/tdd` or automatic |
| `plan` | Restate requirements, create implementation plan | `/plan` |
| `e2e` | Generate E2E tests with Playwright | `/e2e` |
| `coding-standards` | TypeScript/React/Node.js best practices | Automatic |
| `backend-patterns` | API design, database, caching patterns | Backend work |
| `frontend-patterns` | React, Next.js, state management | Frontend work |
| `postgres-patterns` | PostgreSQL optimization and Supabase practices | Database work |
| `clickhouse-io` | ClickHouse analytics patterns | Analytics work |
| `security-review` | OWASP checklist and security patterns | `/security-review` |
| `continuous-learning` | Auto-extract patterns from session | Session end |
| `continuous-learning-v2` | Instinct-based learning with confidence scoring | Advanced learning |
| `strategic-compact` | Manual context compaction suggestions | After ~50 tool calls |
| `iterative-retrieval` | Progressive context refinement for subagents | Subagent queries |
| `eval-harness` | Formal evaluation framework | `/eval` |
| `verification-loop` | Continuous verification patterns | `/verify` |



## Subagents

### From everything-claude-code Plugin

| Agent | Tools | Use Case |
|-------|-------|----------|
| `planner` | Read, Grep, Glob | Feature implementation planning |
| `architect` | Read, Grep, Glob | System design decisions |
| `tdd-guide` | Read, Write, Edit, Bash, Grep | Test-driven development |
| `code-reviewer` | Read, Grep, Glob, Bash | Quality and security review |
| `security-reviewer` | Read, Write, Edit, Bash, Grep, Glob | Vulnerability analysis |
| `database-reviewer` | Read, Write, Edit, Bash, Grep, Glob | PostgreSQL/Supabase review |
| `build-error-resolver` | Read, Write, Edit, Bash, Grep, Glob | Fix build/type errors with minimal diffs |
| `e2e-runner` | Read, Write, Edit, Bash, Grep, Glob | Playwright E2E testing |
| `refactor-cleaner` | Read, Write, Edit, Bash, Grep, Glob | Dead code cleanup |
| `doc-updater` | Read, Write, Edit, Bash, Grep, Glob | Documentation sync |

### Built-in Claude Code Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `Explore` | Fast codebase exploration | Finding files, searching code, understanding structure |
| `Plan` | Implementation planning | Designing strategies, identifying files |
| `Bash` | Command execution | Git operations, terminal tasks |

### Project-Specific Agents (`.claude/agents/`)

| Agent | Model | Focus |
|-------|-------|-------|
| `frontend-developer` | Sonnet | React components, Tailwind, accessibility |
| `code-reviewer` | Sonnet | Quality, security, maintainability |
| `fullstack-developer` | Opus | End-to-end application development |
| `backend-architect` | Sonnet | RESTful APIs, service boundaries |
| `database-architect` | Opus | Schema design, migrations, optimization |
| `performance-engineer` | Opus | Profiling, load testing, caching |
| `vercel-deployment-specialist` | Sonnet | Vercel platform, edge functions |
| `architect-reviewer` | Opus | Pattern adherence, SOLID compliance |


### Iterative Retrieval Pattern

**Flow:**
1. ORCHESTRATOR (has context) dispatches query + objective
2. SUB-AGENT (lacks context) returns summary
3. EVALUATE: Is it sufficient?
   - YES: Accept result
   - NO: Ask follow-up questions (max 3 cycles)

---

## Core Development Workflows

### Workflow A: Feature Development (TDD)

1. `/plan` - Create implementation plan
   - Restate requirements
   - Identify affected files
   - Create step-by-step approach

2. `/tdd` - Start TDD workflow
   - Define interfaces first
   - Write failing tests (RED)
   - Implement minimal code (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

3. `/code-review` - Review quality
   - Code simplicity
   - Naming conventions
   - Error handling
   - No exposed secrets

4. `/security-review` - Check for vulnerabilities
   - OWASP Top 10
   - Input validation
   - Authentication/authorization

5. `/verify` - Run full verification
   - All tests pass
   - Build succeeds
   - No lint errors

### Workflow B: Bug Fix

1. Describe the bug clearly
2. Claude investigates (uses Explore agent)
3. `/tdd` - Write test that reproduces bug
4. Fix the code (test goes green)
5. `/code-review` - Verify fix quality
6. `/verify` - Ensure no regressions

### Workflow C: Code Cleanup / Refactoring

1. `/refactor-clean` - Find dead code
   - Runs knip, depcheck, ts-prune
   - Identifies unused exports
   - Finds duplicate code

2. Review suggestions
3. Approve removals
4. `/verify` - Ensure nothing broke

### Workflow D: Documentation Update

1. `/update-codemaps` - Regenerate code maps
   - Creates docs/CODEMAPS/*
   - Updates architecture diagrams

2. `/update-docs` - Sync documentation
   - Updates README sections
   - Syncs API documentation

### Workflow E: Database Work

1. Describe schema changes needed
2. `/postgres-patterns` - Load PostgreSQL best practices
3. Design schema changes
4. Create migration with Prisma
5. database-reviewer agent reviews
6. Apply and verify with tests

### Workflow F: E2E Testing

1. `/e2e` - Generate E2E tests
   - Creates test journeys
   - Uses Playwright
   - Captures screenshots/videos

2. Run tests
3. Review failures
4. Fix and re-run

### Workflow G: Build Error Resolution

1. Build fails with errors
2. `/build-fix` - Minimal fixes only
   - Focuses on type errors
   - No architectural changes
   - Gets build green quickly

### Orchestrator Pattern

- **Phase 1: RESEARCH** (Explore agent) -> research-summary.md
- **Phase 2: PLAN** (planner agent) -> plan.md
- **Phase 3: IMPLEMENT** (tdd-guide agent) -> code changes
- **Phase 4: REVIEW** (code-reviewer agent) -> review-comments.md
- **Phase 5: VERIFY** (build-error-resolver if needed) -> done or loop back

**Key Rules:**
- Each agent: ONE input -> ONE output
- Never skip phases
- Use `/clear` between agents
- Store intermediate outputs in files

---

## Memory & Session Management

### Automatic Session Persistence (via Hooks)

The plugin automatically manages session memory:

| Hook | Trigger | Action |
|------|---------|--------|
| `SessionStart` | New session begins | Loads previous context, detects package manager |
| `PreCompact` | Before context compaction | Saves current state to file |
| `SessionEnd` | Session ends | Persists state, evaluates session for patterns |
| `Stop` | After each Claude response | Checks for console.log in modified files |


### Manual Session Management

```bash
# Create checkpoint mid-session
/checkpoint

# Extract learnings immediately
/learn

# Clear context strategically (after exploration, before execution)
/clear
```


### Memory Flow

**SESSION 1:**
1. Start -> SessionStart hook runs
2. Working...
3. PreCompact -> saves state before summary
4. Compacted
5. Stop Hook -> persists to ~/.claude/sessions/

**SESSION 2:**
1. Start -> SessionStart loads previous context
2. Working (informed by previous session)
3. Continue...

---

## Token Optimization Strategies


### Strategy 2: Strategic Compaction

The `strategic-compact` skill tracks tool calls and suggests manual compaction:

After ~50 tool calls -> [Hook] Consider /compact if transitioning phases

**When to compact:**
- After exploration, before execution
- After completing a milestone, before starting next
- When context feels "polluted" with old exploration

**Disable auto-compact** for more control:
```json
// In settings
"autoCompact": false
```

### Strategy 3: Modular Codebase

Keep files small for cheaper token costs:
- Files in hundreds of lines, not thousands
- Reusable utilities and functions
- Clear separation of concerns

**Structure:**
- root/src/apps/ - Entry points
- root/src/modules/ - Self-contained modules (api/, domain/, infrastructure/, use-cases/, tests/)
- root/src/shared/ - Cross-module code
- root/tests/ - E2E tests

### Strategy 4: Background Processes

Run long commands outside Claude when you don't need live output:

```bash
# Use tmux for dev servers
tmux new-session -d -s dev "npm run dev"
tmux attach -t dev

# Only feed relevant output to Claude
```

### Strategy 5: Replace MCPs with CLI + Skills

Instead of loading heavy MCPs:
```bash
# Create skill that wraps CLI
/gh-pr instead of GitHub MCP
/supabase instead of Supabase MCP
```

---

## Parallelization Workflows

### When to Parallelize

**Good candidates:**
- Research in one terminal, coding in another
- Multiple independent features
- Questions about codebase while working

**Avoid parallelizing:**
- Tasks with overlapping file changes
- Dependent sequential operations

### Git Worktrees Setup

```bash
# Create separate worktrees for parallel work
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b
git worktree add ../project-refactor refactor-branch

# Each worktree gets its own Claude instance
cd ../project-feature-a && claude
```

**Benefits:**
- No git conflicts between instances
- Each has clean working directory
- Easy to compare outputs
- Can benchmark same task across approaches

### The Cascade Method

When running multiple Claude instances:

1. Open new tasks in new tabs **to the right**
2. Sweep left to right (oldest to newest)
3. Maintain consistent direction flow
4. Focus on **max 3-4 tasks** at a time

### Session Naming

```bash
/rename feature-auth      # Name your sessions
/fork                     # Fork for parallel exploration
```

### Recommended Setup

- Terminal 1: Main coding (left)
- Terminal 2: Research/questions (right)
- Terminal 3: Long-running tasks (optional)

### Two-Instance Kickoff Pattern

**Instance 1: Scaffolding Agent**
- Creates project structure
- Sets up configs
- Establishes conventions

**Instance 2: Deep Research Agent**
- Creates detailed PRD
- Architecture diagrams
- Compiles documentation references

---

## Verification & Eval Workflows

### Checkpoint-Based Evals (For Linear Tasks)

[Task 1] -> /checkpoint -> [Task 2] -> /checkpoint -> [Task 3]
           |                          |
           v                          v
     verify criteria            verify criteria
           |                          |
     pass? -> continue          pass? -> continue
     fail? -> fix first         fail? -> fix first

**Best for:** Linear workflows with clear milestones

### Continuous Evals (For Long Sessions)

[Work] -> Timer/Change -> [Run Tests + Lint] -> pass? -> continue
                                             -> fail? -> stop & fix

**Best for:** Long-running sessions, exploratory refactoring

### Key Metrics

**pass@k:** At least ONE of k attempts succeeds
- k=1: 70%  k=3: 91%  k=5: 97%
- Use when: Just need it to work

**pass^k:** ALL k attempts must succeed
- k=1: 70%  k=3: 34%  k=5: 17%
- Use when: Consistency is essential

### Grader Types

| Type | Method | Tradeoff |
|------|--------|----------|
| Code-Based | String match, tests, static analysis | Fast, cheap, but brittle |
| Model-Based | Rubric scoring, natural language | Flexible, but non-deterministic |
| Human | SME review, spot-check | Gold standard, but expensive |

### Running Evals

```bash
/eval                       # Run evaluation harness
/verify                     # Run verification loop
/test-coverage              # Check coverage metrics
```

---

## Auto-Triggered Hooks

These hooks are active automatically:

### PreToolUse Hooks

| Trigger | Action |
|---------|--------|
| `npm run dev` outside tmux | **BLOCKED** - forces tmux for log access |
| Long-running commands (npm install, pytest, etc.) | Reminder to use tmux |
| `git push` | Review reminder before push |
| Creating `.md` files (except README, CLAUDE, etc.) | **BLOCKED** - keeps docs consolidated |
| Edit/Write operations | Strategic compact suggestion after ~50 ops |

### PostToolUse Hooks

| Trigger | Action |
|---------|--------|
| `gh pr create` completes | Logs PR URL and provides review command |
| Build completes | Async analysis in background |
| Editing `.ts/.tsx` files | Auto-format with Prettier + TypeScript check |
| Editing JS/TS files | Warns about console.log statements |

### Stop Hook

| Trigger | Action |
|---------|--------|
| After each Claude response | Checks for console.log in modified files |

### Session Lifecycle Hooks

| Trigger | Action |
|---------|--------|
| SessionStart | Load previous context, detect package manager |
| PreCompact | Save state before compaction |
| SessionEnd | Persist state, evaluate for extractable patterns |

### Example Hook Configurations

**tmux reminder for long commands:**
```json
{
  "PreToolUse": [{
    "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn|cargo|pytest)\"",
    "hooks": [{
      "type": "command",
      "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] Consider tmux for session persistence' >&2; fi"
    }]
  }]
}
```

**Auto-format after edits:**
```json
{
  "PostToolUse": [{
    "matcher": "Edit && .ts/.tsx/.js/.jsx",
    "hooks": [{ "type": "command", "command": "prettier --write" }]
  }]
}
```

**Memory persistence hooks:**
```json
{
  "hooks": {
    "PreCompact": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "~/.claude/hooks/memory-persistence/pre-compact.sh" }]
    }],
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "~/.claude/hooks/memory-persistence/session-start.sh" }]
    }],
    "Stop": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "~/.claude/hooks/memory-persistence/session-end.sh" }]
    }]
  }
}
```

### Hook Installation

Use the `hookify` plugin to create hooks conversationally:
```
/hookify
```

---

## Context Injection (Advanced)

### Dynamic System Prompt Injection

Create CLI aliases for scenario-specific contexts:

```bash
# Add to ~/.bashrc or ~/.zshrc

# Daily development
alias claude-dev='claude --system-prompt "$(cat ~/.claude/plugins/marketplaces/everything-claude-code/contexts/dev.md)"'

# PR review mode
alias claude-review='claude --system-prompt "$(cat ~/.claude/plugins/marketplaces/everything-claude-code/contexts/review.md)"'

# Research/exploration mode
alias claude-research='claude --system-prompt "$(cat ~/.claude/plugins/marketplaces/everything-claude-code/contexts/research.md)"'
```

### Why System Prompt vs @ References

| Method | Authority | Speed |
|--------|-----------|-------|
| `--system-prompt` | Highest (system level) | Fastest (no tool call) |
| `.claude/rules/` | High (rules level) | Fast |
| `@file.md` reference | Medium (tool output) | Slower (Read tool call) |

Use system prompt injection for strict behavioral rules and project constraints.

---

## MCPs (Model Context Protocol)

Connect Claude to external services.

### Common MCPs

```json
{
  "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] },
  "supabase": { "command": "npx", "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=REF"] },
  "memory": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] },
  "vercel": { "type": "http", "url": "https://mcp.vercel.com" },
  "railway": { "command": "npx", "args": ["-y", "@railway/mcp-server"] },
  "firecrawl": { "command": "npx", "args": ["-y", "firecrawl-mcp"] },
  "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] }
}
```

### Context Window Management

**Critical:** Your 200k context can drop to ~70k with too many tools enabled.

Rule of thumb:
- Have 20-30 MCPs in config
- Keep under 10 enabled
- Under 80 tools active

**Check MCPs:**
```
/plugins
/mcp
```

### MCP Alternatives

Replace MCPs with CLI + skills for token savings:
- GitHub MCP -> `/gh-pr` command wrapping `gh pr create`
- Supabase MCP -> Skills using Supabase CLI

---

## Plugins

Packaged tools for easy installation.

### Useful Plugins

| Plugin | Purpose |
|--------|---------|
| `typescript-lsp` | TypeScript intelligence |
| `pyright-lsp` | Python type checking |
| `hookify` | Create hooks conversationally |
| `mgrep` | Better search than ripgrep |
| `context7` | Live documentation |
| `code-review` | Quality review |
| `commit-commands` | Git workflow |
| `security-guidance` | Security checks |

### Installation

```bash
# Add marketplace
claude plugin marketplace add https://github.com/mixedbread-ai/mgrep

# Then use /plugins to install
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+U` | Delete entire line |
| `!` | Quick bash command prefix |
| `@` | Search for files |
| `/` | Initiate slash commands |
| `Shift+Enter` | Multi-line input |
| `Tab` | Toggle thinking display |
| `Esc Esc` | Interrupt Claude / restore code |
| `Ctrl+G` | Open file in editor (Zed) |

---

## Quick Reference Card

**QUICK COMMANDS**
- PLANNING: /plan
- CODING: /tdd, /build-fix
- TESTING: /e2e, /verify, /test-coverage
- REVIEW: /code-review, /security-review
- CLEANUP: /refactor-clean
- DOCS: /update-codemaps, /update-docs
- LEARNING: /learn, /checkpoint
- SETUP: /setup-pm
- ADVANCED: /eval, /orchestrate

**MODEL SELECTION**
- Haiku: Simple tasks, file search, formatting
- Sonnet: 90% of coding (default)
- Opus: Complex architecture, security-critical

**SESSION MANAGEMENT**
- /clear - Clear context (use between phases)
- /checkpoint - Save restore point
- /learn - Extract pattern immediately
- /rename - Name your session
- /fork - Create parallel exploration

**QUICK SUMMARY**
- SKILLS: /tdd /e2e /plan /security-review
- AGENTS: Explore, Plan, code-reviewer, tdd-guide
- HOOKS: PreToolUse, PostToolUse, Stop, SessionStart
- CONTEXT: /compact /clear /fork /rename
- TOOLS: /plugins /mcp /checkpoints /rewind
- SHORTCUTS: Ctrl+U (delete), Tab (thinking), Esc Esc

---

## Recommended Daily Workflow

### Morning Start

1. Open Claude Code
   - SessionStart hook auto-loads previous context

2. Review what's pending
   - Check session file if resuming work

### Feature Development

3. /plan for new features
   - Creates step-by-step implementation plan
   - Wait for approval before coding

4. /tdd for implementation
   - Interfaces -> Tests -> Code -> Refactor
   - Maintains 80%+ coverage

### Before Commits

5. /code-review
   - Quality, naming, duplication check

6. /security-review (if touching auth/input/APIs)
   - OWASP checklist
   - Input validation

### Before Push

7. /verify
   - Full test suite
   - Build check
   - Lint check

### Discovery

8. /learn (when you discover something useful)
   - Saves to ~/.claude/skills/learned/
   - Available in future sessions

### Session End

9. End session naturally
   - SessionEnd hook auto-saves state
   - Evaluates session for extractable patterns

---

## Continuous Learning Flow

**Flow:**
1. SESSION START - loads ~/.claude/skills/learned/*
2. WORKING - /learn available for manual extraction
3. SESSION END - evaluate-session.js runs
4. PATTERN EXTRACTED - saves to ~/.claude/skills/learned/

### Continuous Learning Installation

```bash
git clone https://github.com/affaan-m/everything-claude-code.git ~/.claude/skills/everything-claude-code
```

**Hook:**
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "~/.claude/skills/continuous-learning/evaluate-session.sh" }]
    }]
  }
}
```

**Manual extraction:** `/learn`

---

## File Locations Reference

**~/.claude/**
- settings.json - Global settings + plugin config
- skills/learned/ - Auto-extracted patterns
- sessions/ - Session persistence files
- plans/ - Saved plans
- plugins/marketplaces/everything-claude-code/ - Plugin installation
  - agents/ - Subagent definitions
  - skills/ - Skill definitions
  - commands/ - Slash commands
  - rules/ - Always-follow guidelines
  - hooks/ - Hook configurations
  - contexts/ - System prompt contexts
  - scripts/ - Cross-platform Node.js scripts

**.claude/** (Project-specific)
- settings.local.json - Project settings
- agents/ - Project-specific agents

---

## Troubleshooting

### Hook Not Firing

Check that hooks are in `~/.claude/settings.json` under the `hooks` key.

### Command Not Found

Verify plugin is enabled:
```json
{
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  }
}
```

### Context Window Too Small

Disable unused MCPs in project settings:
```json
{
  "disabledMcpServers": ["unused-mcp-1", "unused-mcp-2"]
}
```

### Session Not Persisting

Check that `~/.claude/sessions/` directory exists and is writable.

---

## Best Practices

### Agent Abstraction Tiers

**Tier 1: Direct Buffs (Easy)**
- Subagents - Prevent context rot
- Metaprompting - Improve stability
- Asking more upfront - Better planning

**Tier 2: High Skill Floor (Hard)**
- Long-running agents
- Parallel multi-agent
- Role-based multi-agent
- Computer use agents

### Rules & Memory

~/.claude/rules/
- security.md - No hardcoded secrets, validate inputs
- coding-style.md - Immutability, file organization
- testing.md - TDD workflow, 80% coverage
- git-workflow.md - Commit format, PR process
- agents.md - When to delegate to subagents
- performance.md - Model selection, context management

### Example Rules

- No emojis in codebase
- Refrain from purple hues in frontend
- Always test code before deployment
- Prioritize modular code over mega-files
- Never commit console.logs

### Memory Locations

| Location | Scope | Loading |
|----------|-------|---------|
| `CLAUDE.md` | User or Project | Every session |
| `~/.claude/rules/` | Project | Every session |
| `--system-prompt` | Session | CLI injection |

### Useful Commands

| Command | Purpose |
|---------|---------|
| `/rewind` | Go back to previous state |
| `/statusline` | Customize status display |
| `/checkpoints` | File-level undo points |
| `/compact` | Manual context compaction |
| `/plugins` | Manage plugins/MCPs |

### llms.txt Pattern

Find LLM-optimized documentation:
```
https://www.example.dev/docs/llms.txt
```

### tmux for Long-Running Commands

```bash
tmux new -s dev
# Claude runs commands here
tmux attach -t dev
```

---

## References

- [everything-claude-code GitHub](https://github.com/affaan-m/everything-claude-code)
- [Claude Code Docs](https://code.claude.com/docs)
- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [32 Claude Code Tips](https://agenticcoding.substack.com/p/32-claude-code-tips-from-basics-to)
- [Session Reflection Pattern](https://rlancemartin.github.io/2025/12/01/claude_diary/)
- Anthropic: "Claude Code Best Practices" (Apr 2025)
- Fireworks AI: "Eval Driven Development with Claude Code" (Aug 2025)
- @PerceptualPeak: Sub-Agent Context Negotiation
- @menhguin: Agent Abstractions Tierlist
- @omarsar0: Compound Effects Philosophy
- @alexhillman: Self-Improving Memory System
