---
name: design-accessibility
description: Use for UI/UX, visual design, responsive layouts, component systems, forms, navigation, accessibility, and design reviews.
---

# Design and accessibility skill

## Inspect first
- Find the existing design system, component library, tokens, typography, spacing, icons, layout breakpoints, and visual conventions.
- Review the actual target screens/components and their loading, empty, error, success, and disabled states before redesigning.
- Do not introduce a new component library or visual language without a clear need.

## Design rules
- Reuse shared components and tokens; avoid one-off styling that creates visual inconsistency.
- Prioritize clear hierarchy, readable text, predictable navigation, meaningful labels, useful feedback, and low-friction workflows.
- Design mobile-first where the product supports mobile; test narrow widths, long text, and touch targets.
- Use semantic HTML/native controls where possible; every interactive element must be keyboard-operable and have an accessible name.
- Maintain visible focus, logical focus order, sufficient contrast, reduced-motion support, and appropriate status announcements.
- Do not rely on color alone to communicate state. Provide labels or icons with accessible text.
- Forms need associated labels, clear validation, preserved input where safe, and actionable error messages.
- Provide responsive states for menus, tables, dialogs, and navigation; avoid clipped content and inaccessible hover-only behavior.
- Respect existing brand and product constraints. If design assets are needed, locate and reuse approved assets rather than inventing replacements.

## Validation
- Check keyboard-only operation, focus visibility/order, labels, contrast, responsive behavior, and empty/loading/error/success states.
- Run existing UI tests, lint, type-check, and accessibility checks when available.
- Report what was manually inspected versus automatically tested.
