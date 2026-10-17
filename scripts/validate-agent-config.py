#!/usr/bin/env python3
"""Static validation for portable agent profiles and skill metadata."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_SKILLS = [
    ".agents/skills/skill-first-workflow/SKILL.md",
    ".agents/skills/api-contracts/SKILL.md",
    ".agents/skills/routing-and-navigation/SKILL.md",
    ".agents/skills/access-control-security/SKILL.md",
    ".agents/skills/design-accessibility/SKILL.md",
]
REQUIRED_AGENTS = [
    ".github/agents/api-architect.agent.md",
    ".github/agents/route-architect.agent.md",
    ".github/agents/security-access.agent.md",
    ".github/agents/design-systems.agent.md",
]
REQUIRED_GUIDANCE = ["AGENTS.md", ".github/copilot-instructions.md"]
errors = []

def check_metadata(path: str, required: tuple[str, ...]) -> str:
    file_path = ROOT / path
    if not file_path.is_file():
        errors.append(f"Missing required file: {path}")
        return ""
    content = file_path.read_text(encoding="utf-8")
    if not content.startswith("---\n"):
        errors.append(f"{path}: missing YAML frontmatter")
        return content
    closing = content.find("\n---", 4)
    if closing < 0:
        errors.append(f"{path}: unterminated YAML frontmatter")
        return content
    frontmatter = content[4:closing]
    for key in required:
        if not re.search(rf"(?m)^{re.escape(key)}:\\s*\\S", frontmatter):
            errors.append(f"{path}: missing non-empty frontmatter field '{key}'")
    if len(content[closing + 4:].strip()) == 0:
        errors.append(f"{path}: body is empty")
    return content

for path in REQUIRED_GUIDANCE:
    if not (ROOT / path).is_file():
        errors.append(f"Missing required guidance: {path}")

skill_contents = {}
for path in REQUIRED_SKILLS:
    skill_contents[path] = check_metadata(path, ("name", "description"))

for path in REQUIRED_AGENTS:
    content = check_metadata(path, ("name", "description"))
    for skill_path in re.findall(r"`([^\`]*\.agents/skills/[^\`]*)`", content):
        if not (ROOT / skill_path).is_file():
            errors.append(f"{path}: references missing skill '{skill_path}'")

# Verify each specialist explicitly names the intended skill.
expected = {
    "api-architect.agent.md": "api-contracts",
    "route-architect.agent.md": "routing-and-navigation",
    "security-access.agent.md": "access-control-security",
    "design-systems.agent.md": "design-accessibility",
}
for path in REQUIRED_AGENTS:
    name = Path(path).name
    content = (ROOT / path).read_text(encoding="utf-8") if (ROOT / path).is_file() else ""
    if expected.get(name) and expected[name] not in content:
        errors.append(f"{path}: does not reference expected skill '{expected[name]}'")

if errors:
    print("Agent configuration validation FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print(f"Agent configuration validation passed: {len(REQUIRED_SKILLS)} skills, "
      f"{len(REQUIRED_AGENTS)} specialist profiles, and {len(REQUIRED_GUIDANCE)} guidance files.")
