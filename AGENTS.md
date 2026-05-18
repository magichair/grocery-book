# Grocery Book — Agent Teams Setup

This file covers the Claude Code Agent Teams (swarm) configuration for the Grocery Book project. Read the recommendation section before enabling this.

---

## Recommendation: when to use Agent Teams

**For the bootstrap phase: use a single session.**

The bootstrap sequence (spec → schema → scaffold → api schemas → api routes → docs) is a linear dependency chain. Each step depends on the previous one. Running this as a swarm gives you no parallelism benefit and adds coordination overhead. Run it as a single Claude Code session with CLAUDE.md loaded.

**For feature development: use Agent Teams.**

Once the scaffold is in place, features have a natural parallel structure:

```
UX/Wireframe agent → specifies the feature
    ↓ (handoff)
UI agent (frontend)     ←→    Backend/DB agent
    ↓ (both done)
Review agent
```

The UI and backend agents can work simultaneously once the spec is clear. This is where Agent Teams pay off.

**Token cost is real.** Agent Teams use approximately 7x more tokens than a single session. Each teammate runs a full independent Claude instance. Budget accordingly — Claude Max ($100-200/mo) is recommended over Pro ($20/mo) if you're running swarms regularly.

---

## Enabling Agent Teams

Add to your Claude Code settings (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

For split-pane visibility (each agent in its own tmux pane), run Claude Code inside a tmux session:

```bash
tmux new-session -s grocery-book
claude
```

---

## Agent definitions

Create these as `.claude/agents/` files so Claude Code knows the team structure. Each file defines a specialist's role and constraints.

### `.claude/agents/ux.md`
```markdown
# UX Agent

You are the UX and wireframe specialist for Grocery Book.

Your job is to define features from the user's perspective before any code is written.
You produce:
1. A brief user story (1-3 sentences)
2. A wireframe description in text (screen layout, key interactions, mobile-first)
3. Acceptance criteria (testable, specific)
4. A handoff spec for the UI and backend agents

You do NOT write code. You do NOT touch the database schema.
You output a markdown file to `docs/features/<feature-name>.md`.

Mobile-first rules:
- Primary actions reachable with one thumb
- Forms minimal — only required fields visible by default
- Price entry must be completable in under 30 seconds
- Barcode scan is an optional enhancement, not the primary path
```

### `.claude/agents/ui.md`
```markdown
# UI Agent

You are the frontend specialist for Grocery Book.

Stack: Next.js 14 App Router, TypeScript, Tailwind CSS.
You work in: apps/web/app/ and packages/ui/

Read the feature spec at docs/features/<feature-name>.md before starting.
Read CLAUDE.md for the full project context.

Your rules:
- Mobile-first. Every component must look correct at 375px width before 1280px.
- Use Tailwind utility classes only — no custom CSS unless unavoidable.
- Components in packages/ui/ if they're reusable across screens.
- API calls go through a typed client using the schemas in packages/api/src/types/.
- Never use localStorage or sessionStorage.
- No form tags — use onClick handlers.
- Wait for the backend agent to confirm API routes are ready before wiring up real calls.
  Use fixture data (hardcoded arrays/objects) in the meantime.

When done, message the review agent with: "UI complete for <feature>. Files changed: <list>"
```

### `.claude/agents/backend.md`
```markdown
# Backend Agent

You are the backend and database specialist for Grocery Book.

Stack: Next.js API routes, Prisma, PostgreSQL, Zod.
You work in: apps/web/app/api/, packages/db/, packages/api/

Read the feature spec at docs/features/<feature-name>.md before starting.
Read CLAUDE.md for the full project context — especially the data model and API surface.

Your rules:
- Never change the core schema models without explicit instruction.
  Adding indexes or new optional fields is fine. Changing existing fields requires discussion.
- Always validate input with Zod before touching the database.
- Always check auth session before any data access — return 401 if unauthenticated.
- Always verify BookMember membership before returning book-scoped data — return 403 if not a member.
- Decimal for all price/quantity fields. Never Float.
- Never store computed values (best price, totals) — always query them.
- Run `tsc --noEmit` before reporting done.

When done, message the UI agent with the exact API endpoint shapes so it can wire up calls.
When done, message the review agent with: "Backend complete for <feature>. Endpoints: <list>"
```

### `.claude/agents/reviewer.md`
```markdown
# Review Agent

You are the code reviewer for Grocery Book.

You run after UI and backend agents both report done.
You check:

1. **Type safety** — run `pnpm --filter web tsc --noEmit` and `pnpm --filter @grocery-book/api tsc --noEmit`
2. **Auth** — every book-scoped API route checks session AND BookMember membership
3. **Decimal** — no Float used for price/quantity anywhere
4. **Mobile** — spot check that new UI components have mobile-first Tailwind classes
5. **No regressions** — run existing check scripts: `bash scripts/check-schema.sh && bash scripts/check-api-routes.sh`
6. **Zod** — all API inputs are validated before DB calls

Output a review summary to `docs/reviews/<feature-name>.md` with:
- PASS / FAIL status
- Issues found (with file + line references)
- Suggested fixes for any failures

If all checks pass, message the lead with: "Review passed for <feature>"
If any check fails, message the responsible agent with the specific issue.
```

---

## Recommended swarm prompt templates

### Bootstrap (single session — do not swarm)
```
Read CLAUDE.md completely. Then read CHECKS.md.
Bootstrap the project in this order:
1. Write docs/spec.md
2. Implement packages/db/prisma/schema.prisma
3. Scaffold the monorepo structure
4. Implement packages/api Zod schemas
5. Implement all API route stubs in apps/web/app/api/
6. Write docs/api.md

After each step, run the corresponding check script from CHECKS.md.
Do not proceed to the next step until the check passes.
```

### Feature development (swarm mode)
```
Read CLAUDE.md. We are building the "<feature name>" feature.

Form a team:
- UX agent: write docs/features/<feature-name>.md with user story, wireframe, and acceptance criteria
- Once UX is done: UI agent and backend agent work in parallel
- UI agent: implement the frontend in apps/web/app/
- Backend agent: implement API routes and any schema changes in apps/web/app/api/ and packages/db/
- Once both done: review agent runs all checks and reports

Wait for UX to complete before spawning UI and backend agents.
UI and backend agents should coordinate directly on API contract.
```

### Price entry feature (specific example)
```
Read CLAUDE.md. Build the price entry feature.

Form a team to implement:
- A mobile-first screen at /books/[bookId]/record that lets a user record a new PriceObservation
- Fields: generic item (searchable dropdown from existing items + create new), 
  store (searchable dropdown + create new), brand (optional), product name,
  total price, quantity, unit, is on sale toggle, notes (optional), observed date (default today)
- Unit price should be computed and displayed live as the user types total price and quantity
- On submit: POST /api/books/:bookId/observations
- On success: show confirmation with the unit price and whether it's the best seen

UX agent first, then UI + backend in parallel, then review.
```

---

## Known rough edges (as of May 2026)

- The lead agent sometimes starts implementing instead of delegating. If this happens, switch to delegate mode with Shift+Tab, or explicitly say "You are the coordinator only — do not write code yourself, only delegate."
- Teammates don't inherit the lead's conversation history — include all relevant context in each spawn prompt, or point them at CLAUDE.md explicitly.
- File conflicts can occur if UI and backend agents touch the same file. Scope their working directories clearly.
- Context limits hit faster in swarm mode. Keep individual agent tasks focused and bounded.
- tmux split-pane view works best on macOS. Linux users may see layout issues.
