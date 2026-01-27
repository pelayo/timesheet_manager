---
name: frontend-accessibility
description: Captures the agreed accessibility workflow and styling conventions
used in the change-power feature.
---

# Accessibility AA Workflow (Project Standard)

This document captures the agreed accessibility workflow and styling conventions
used in the change-power feature. Use it as the standard for future work so all
engineers and agents apply accessibility in the same way.

## Scope
- Apply these rules when making components accessible to AA.
- Keep the existing visual design; only improve semantics, focus visibility, and
  keyboard support.

## 1 Labeling and Accessible Names
- Connect every visible label to its control using `htmlFor` + `id`.
- If a component renders an internal `InputLabel` (MUI), avoid ID collisions by
  giving the external label a distinct suffix (example: `-field-label`).
- For dynamic inputs, provide `aria-labelledby` pointing to the visible label.
- For required fields, use both `required` and `aria-required` (not only `*`).

## 2 Interactive Semantics
- Replace clickable non-semantic elements (`div`, `span`, `i`) with
  `<button type="button">`.
- Provide `aria-label`/`title` when no visible text exists.
- For toggles, add `aria-expanded` and `aria-controls`.

## 3 Keyboard Focus (Visibility and Behavior)
- Only show the custom focus outline when the user navigates with the keyboard.
- Do not change the mouse behavior or default focus appearance for pointer users.

### Keyboard detection (React)
- When the user presses `Tab`, enable keyboard mode.
- When the user clicks/touches, disable keyboard mode.
- Apply a `keyboard-nav` class to the main container in that mode.

### CSS pattern (SCSS)
- Apply the focus outline only inside `.keyboard-nav`.
- Keep the rest of the UI unchanged for mouse users.

Example (change-power):
```
.change-power.keyboard-nav :focus {
  outline: 2px solid $primary;
  outline-offset: 2px;
}

.change-power.keyboard-nav .dropzone-container:focus {
  outline: 2px solid $primary;
  outline-offset: 4px;
}

.change-power.keyboard-nav .MuiCheckbox-root.Mui-focusVisible {
  outline: 2px solid $primary;
  outline-offset: 2px;
  border-radius: 4px;
}

.change-power.keyboard-nav .MuiRadio-root.Mui-focusVisible {
  outline: 2px solid $primary;
  outline-offset: 2px;
  border-radius: 50%;
}
```

## 4 Focus Order and Single Focus Target
- Ensure every focusable control has visible focus under keyboard navigation.
- Avoid duplicate focus targets:
  - If a container handles keyboard focus (e.g., Dropzone), the inner button
    should be `tabIndex={-1}` and `aria-hidden`.
- If a custom checkbox/radio does not toggle with Enter, add explicit handling
  for Enter (Space should remain standard).

## Notes
- The goal is consistent AA behavior without changing the look and feel.
- Always check for focus visibility and keyboard activation in the final UI.
