---
name: skill-first-workflow
description: Use before any implementation or review to discover relevant skills, apply them, and prevent duplicated or conflicting instructions across Codex and GitHub Copilot.
---

# Skill-first workflow

1. Inspect `AGENTS.md`, `.github/copilot-instructions.md`, existing `.agents/skills/`, and any tool-provided skills relevant to the task.
2. Read the full `SKILL.md` for each relevant skill before coding. For cross-cutting work, read all applicable skills (API, routes, access control, design/accessibility).
3. Prefer existing skills and patterns; do not create duplicate skills or parallel architecture without evidence.
4. Resolve conflicts in this order: explicit user constraints and safety approvals; security/privacy requirements; repository conventions; relevant skill guidance; general preference.
5. Build a short checklist from the skill requirements and validate it before completion.
6. If a platform does not load `.agents/skills` automatically, explicitly open the files and follow them. Never claim automatic skill loading across tools unless verified.
7. In the final report, name the skills actually consulted, changes made, tests run, and unverified items.
