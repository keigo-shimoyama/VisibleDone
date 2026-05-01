# Visible Done Specification

## 1. Product Concept

Visible Done is a Chrome extension that changes Google Tasks from a disappearing task list into a visible record of completed work.

Google Tasks normally hides completed tasks away from the main working list. Visible Done keeps completed tasks visible, styled, counted, and timestamped so the user can perceive daily work as accumulated progress rather than consumed effort.

The extension is designed for people who feel drained by endless task completion and want a lightweight visual system that turns finished work into a stack of evidence.

## 2. Product Goals

- Keep completed tasks visible in the user's main Google Tasks flow.
- Make completed tasks feel like accumulated assets, not crossed-out leftovers.
- Show a daily completion count directly inside the Google Tasks interface.
- Record completion time automatically where possible.
- Support later sync/build workflows as a local unpacked Chrome extension.
- Keep the first version DOM-based, small, reversible, and easy to debug.

## 3. Platform

- Browser: Google Chrome
- Extension model: Manifest V3
- Initial install mode: Unpacked extension
- Local source directory: `/Users/p0052/Documents/_scripts/GoogleChrome/VisibleDone`
- Target surfaces:
  - Google Tasks web UI where accessible
  - Google Workspace side panel if DOM access is available
  - Google Calendar / Gmail / Drive side panel contexts if Google Tasks is embedded there

## 4. Core Features

### 4.1 Permanent List Mode

Completed tasks should remain visible in or near the active task list instead of being treated as hidden, low-value history.

Expected behavior:

- Detect completed task rows in the Google Tasks DOM.
- Prevent completed task rows from becoming visually buried where CSS can control it.
- If Google moves completed rows into a collapsed completed section, the extension may mirror them into a Visible Done stack container.
- If direct relocation is unsafe, prefer creating a non-destructive visual mirror rather than mutating Google Tasks state.

Mirror container placement:

- The `vd-root` container is injected as a direct child of the detected Google Tasks root, immediately after Google's native task list node.
- The mirror container must never be inserted inside a Google-owned node that Google may remove or re-render.
- If the tasks root cannot be reliably located, fall back to appending `vd-root` to `document.body` with fixed positioning.
- All mirror rows are marked with `data-visible-done="mirror"` so teardown can remove them completely.

Display modes:

- `default`: Preserve Google's original ordering as much as possible.
- `newest_done_first`: Show the most recently completed tasks at the top of the visible done stack.
- `timeline`: Show tasks in chronological order based on detected or injected timestamps. This mode requires timestamping to be enabled; the Options page must disable or warn on `timeline` when timestamping is off.

Non-goals for v1:

- Do not modify Google Tasks backend data except optional task-title timestamping.
- Do not permanently delete, reorder, or rewrite user tasks without an explicit setting.

### 4.2 Visual Stack Styling

Completed tasks should look achieved, not discarded.

Settings:

- Remove strikethrough from completed task titles.
- Apply a completion badge or left accent.
- Apply an achievement color to completed tasks.
- Control completed-task opacity with a slider.

Default visual treatment:

- Strikethrough: disabled
- Completion accent: enabled
- Badge text: `Done`
- Default accent color: emerald
- Default opacity: `0.88`

Suggested color presets:

- Emerald: `#10B981`
- Gold: `#D97706`
- Sky: `#0284C7`
- Slate: `#64748B`

### 4.3 Daily Stack Counter

The extension adds a compact counter near the top of the Google Tasks panel.

Example labels:

- `5 Stacked Today`
- `5 / 10 Stacked Today` if a daily target is configured

Counter rules:

- Count tasks completed between local midnight and the next local midnight.
- Write a completion event to the Local Event Store (Section 6) every time a task is detected as completed, regardless of whether timestamping is enabled.
- Count today's events by reading the Local Event Store and filtering by `completedAt` date. Do not rely on in-memory session state for counting.
- Deduplication uses the event's `taskKey`; a task re-completed within the same day overwrites the existing event rather than adding a second count.

Settings:

- Show or hide the counter.
- Optional daily target.
- Counter label style:
  - `stacked_today`
  - `done_today`
  - `completed_today`

### 4.4 Timestamping

When the user marks a task complete, Visible Done can append a completion timestamp to the task title.

Format:

```text
[Done: 14:30]
```

The format string `[Done: HH:mm]` uses 24-hour local time where `HH` is zero-padded hours and `mm` is zero-padded minutes. The stored setting value is the format template string; `HH` and `mm` are replaced at write time.

Rules:

- Use the user's local time.
- Do not append a duplicate timestamp if one already exists.
- If a task is uncompleted and completed again, preserve the existing timestamp by default.
- Optional future setting may allow timestamp replacement on re-completion.

Risks:

- Editing the task title changes the user's Google Tasks data.
- Some Google Tasks UI flows may not expose a safe way to edit the title immediately after completion.

Default:

- Timestamping is disabled in v1 until DOM feasibility is confirmed.
- Local Event Store tracking is always active regardless of timestamping setting.

## 5. Settings

Stored in `chrome.storage.local`.

Suggested schema:

```json
{
  "enabled": true,
  "permanentListMode": true,
  "displayMode": "default",
  "removeStrikethrough": true,
  "doneOpacity": 0.88,
  "achievementColor": "#10B981",
  "showCounter": true,
  "dailyTarget": null,
  "counterLabel": "stacked_today",
  "timestamping": false,
  "timestampFormat": "[Done: HH:mm]"
}
```

Note: `displayMode: "timeline"` is only valid when `timestamping: true`. The Options page must enforce this constraint in the UI.

## 6. Local Event Store

Stored in `chrome.storage.local`.

Suggested schema:

```json
{
  "completionEvents": [
    {
      "id": "local-generated-id",
      "taskKey": "title_YYYY-MM-DD",
      "title": "Submit invoice",
      "completedAt": "2026-05-01T14:30:00+09:00",
      "sourceUrl": "https://calendar.google.com/..."
    }
  ]
}
```

### taskKey strategy

`taskKey` must be stable enough to deduplicate same-day re-completions without relying on Google's internal task IDs.

Recommended format: `slugify(title) + "_" + YYYY-MM-DD` using the local date at completion time.

Example: `"submit-invoice_2026-05-01"`

Limitations:

- If the user renames a task after completion, the key changes and a duplicate event may appear. This is acceptable for v1.
- If two different tasks have identical titles on the same day, they share a key. This is acceptable for v1; resolution can be improved by incorporating DOM position if needed.

Retention:

- Keep 90 days by default.
- Future report features may extend retention.

Privacy:

- Store data locally only.
- No remote analytics.
- No external network calls in v1.

## 7. Extension Architecture

### 7.1 Directory Structure

```text
VisibleDone/
  manifest.json
  src/
    content/
      content.js
      observer.js
      taskDom.js
      stackRenderer.js
      counterRenderer.js
      styles.css
    background/
      serviceWorker.js
    options/
      options.html
      options.css
      options.js
    shared/
      settings.js
      storage.js
      time.js
      constants.js
  assets/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
  scripts/
    sync-build.sh
  SPEC.md
  README.md
```

### 7.2 Manifest Permissions

Initial permissions should be conservative.

Required:

- `storage`

Host permissions candidates:

- `https://tasks.google.com/*`
- `https://calendar.google.com/*`
- `https://mail.google.com/*`
- `https://drive.google.com/*`

Content scripts:

- Declare separate content script entries for `tasks.google.com` and each Google surface that embeds Google Tasks.
- The `tasks.google.com` entry uses `all_frames: false` (it is typically the top frame when accessed directly) or `all_frames: true` if the tasks UI appears in a sub-frame of that origin.
- For Gmail, Calendar, and Drive entries, Google Tasks may be embedded as a cross-origin iframe from `tasks.google.com`. The content script declared for `https://tasks.google.com/*` will run in that iframe automatically; no separate injection into the parent frame is needed for DOM access.
- Use `"type": "module"` in content script declarations to enable ES module imports across the `src/content/` files without a bundler.

### 7.3 Content Script Responsibilities

The content script owns DOM behavior:

- Locate Google Tasks containers.
- Start and manage `MutationObserver`.
- Detect task rows and completed state.
- Apply visual stack classes.
- Render the daily stack counter.
- Write completion events to the Local Event Store on every detected completion.
- Request settings from storage.
- Re-render when settings change.
- Run `teardown()` when `enabled` is set to `false`.

#### Teardown sequence

`teardown()` must fully reverse all DOM side effects:

1. Disconnect the `MutationObserver`.
2. Remove all elements with `data-visible-done` attribute from the document.
3. Remove all `vd-*` classes from Google-owned nodes.
4. Remove the injected `<style>` or `<link>` tag if any.

After teardown, the Google Tasks UI must be indistinguishable from a page without the extension loaded.

### 7.4 Background Service Worker Responsibilities

Keep the service worker minimal in v1:

- Initialize default settings on install.
- Handle extension lifecycle events.
- Optionally broker messages if content scripts need centralized storage writes.

### 7.5 Options Page Responsibilities

The options page manages user preferences.

Form type: `options_ui` with `open_in_tab: true`. This opens the options page as a full tab, simplifying layout without popup constraints.

Controls:

- Enable or disable Visible Done.
- Toggle permanent list mode.
- Choose display mode. Disable `timeline` and show an explanatory note when timestamping is off.
- Choose achievement color.
- Adjust completed-task opacity.
- Toggle counter.
- Set optional daily target.
- Toggle timestamping after a clear warning. When this is turned on, automatically enable `timeline` mode as a suggested option rather than forcing it.

### 7.6 No Extension Popup

Visible Done v1 does not include a browser action popup. All controls are accessible via the Options page. The browser toolbar icon is decorative only. A popup may be added in a future version for quick toggle access.

## 8. DOM Strategy

Visible Done should treat Google Tasks DOM as unstable.

Principles:

- Prefer semantic signals where available, such as ARIA attributes and checkbox state.
- Avoid relying on deeply nested generated class names.
- Use multiple detection strategies with graceful fallback.
- Keep DOM writes scoped to extension-owned wrappers/classes.
- Do not remove Google-owned nodes unless absolutely necessary.

Detection candidates:

- Task row containers with checkbox descendants.
- Checkbox `aria-checked` state.
- Text nodes near completed checkboxes.
- Completed section labels.
- Visual indicators such as strikethrough only as fallback.

MutationObserver scope:

- Start broad enough to detect Google Tasks mounting.
- Narrow observer scope once the tasks root is found.
- Debounce re-renders with a 150 ms delay. This balances responsiveness against Google's burst DOM mutations.
- Avoid infinite loops by marking extension-owned nodes with `data-visible-done`.

Fallback behavior when Google Tasks is not detected:

- The content script silently does nothing.
- No UI is injected.
- A `console.debug` message is emitted once to assist debugging.
- No error is thrown that would surface to the user.

## 9. CSS Strategy

Inject one CSS file from the extension.

Class namespace:

```text
vd-
```

Examples:

- `vd-root`
- `vd-counter`
- `vd-done-task`
- `vd-stack-badge`
- `vd-hidden-original`
- `vd-mirror-row`

Use `!important` only where Google styles cannot otherwise be overridden.

CSS goals:

- Remove completed-task strikethrough.
- Keep completed tasks readable.
- Add completion accent and badge.
- Avoid layout shifts.
- Avoid breaking Google's native controls.

Accessibility requirements:

- The `vd-counter` element must have `role="status"` and `aria-label` reflecting its current value, e.g. `aria-label="5 tasks stacked today"`.
- The `vd-stack-badge` element must have `aria-label="Done"` or equivalent so screen readers announce it.
- Mirror rows must have `aria-hidden="true"` to prevent screen readers from announcing duplicated content.

## 10. Sync/Build Assumption

Visible Done should be built as a source directory that can be synced into Chrome's unpacked extension loader.

Development flow:

1. Edit source in `/Users/p0052/Documents/_scripts/GoogleChrome/VisibleDone`.
2. Run a local sync/build script if generated files are needed.
3. Load or reload the unpacked extension from Chrome's extensions page.
4. Test on Google Tasks surfaces.

Build philosophy:

- v1 should not require bundling.
- Plain JavaScript ES modules are used across `src/`. Chrome MV3 supports `"type": "module"` in content script declarations natively.
- Add a bundler only if the codebase needs TypeScript, npm package dependencies, or asset processing.

Suggested script:

```text
scripts/sync-build.sh
```

Initial behavior:

- Validate required files.
- Optionally copy from a development source folder to the unpacked extension folder.
- Print the Chrome extension load path.

## 11. Feasibility Risks

### 11.1 Google Tasks iframe access

Google Tasks may be embedded in an iframe inside Gmail, Calendar, or Drive.

Mitigation:

- The content script declared for `https://tasks.google.com/*` will run inside the cross-origin iframe automatically when Chrome loads that origin, regardless of the parent page.
- Test direct `tasks.google.com` URL first.
- Then test Gmail, Calendar, and Drive side panels to confirm the `tasks.google.com` content script fires in the embedded iframe context.
- If the iframe URL differs from `tasks.google.com` (e.g. a vanity path), extend host permissions accordingly.

### 11.2 DOM instability

Google may change internal markup without notice.

Mitigation:

- Prefer ARIA and role-based selectors.
- Keep selector definitions centralized in `taskDom.js`.
- Add a debug mode that reports which selectors are active.

### 11.3 Timestamping mutates user data

Appending `[Done: HH:mm]` changes task titles.

Mitigation:

- Keep timestamping off by default.
- Show a warning in settings.
- Ensure duplicate prevention.
- Prefer local event storage for v1.

### 11.4 Completed task relocation may fight Google UI

Google may move completed tasks into collapsed sections after completion.

Mitigation:

- Prefer mirrored display for v1.
- Keep original nodes untouched where possible.
- Clearly mark mirrored rows as extension-rendered with `data-visible-done="mirror"`.

## 12. Version Plan

### v0.1 DOM Probe

- Manifest V3 minimal extension.
- Content script runs on Google Tasks target pages.
- Detect task rows.
- Detect completed state.
- Apply visible completed styling.
- Show debug overlay or console logs.

### v0.2 Visible Stack

- Add daily counter backed by Local Event Store.
- Add local completion event tracking on every detected completion.
- Add mirrored done stack if needed.
- Add default CSS polish.

### v0.3 Options

- Add options page (`options_ui`, `open_in_tab: true`).
- Store settings in `chrome.storage.local`.
- Support opacity and color settings.
- Support counter toggle.
- Enforce `timeline` mode constraint when timestamping is off.

### v0.4 Timestamping Experiment

- Add opt-in timestamping.
- Validate title editing behavior.
- Add duplicate timestamp protection.

### v1.0 Local Stable Release

- Stable unpacked extension workflow.
- Basic README.
- Known-supported Google surfaces documented.
- No external network calls.
- Local-only storage.

## 13. Future v2 Ideas

- Weekly and monthly completion reports.
- Calendar-style heatmap.
- CSV export.
- Notion-ready export format. Note: exporting to Notion would require external network calls and constitutes a breaking change to the v1 local-only privacy model. This must be opt-in and clearly disclosed.
- Completion streaks.
- Per-list stack counters.
- Lightweight reflection view.

## 14. Definition of Done for v1

Visible Done v1 is complete when:

- The unpacked extension loads cleanly in Chrome.
- Completed tasks remain visually prominent on at least one Google Tasks surface.
- Daily stacked count works across page refreshes and tab restores for the current day, using the Local Event Store as the single source of truth.
- User settings persist.
- The extension can be disabled without leaving visual artifacts (teardown sequence verified manually).
- No remote services are called.
- The README documents install, reload, supported surfaces, and known limitations.
