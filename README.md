# Jira Card to Clipboard

Chrome/Chromium extension: open a Jira card, click the toolbar button, and the whole card
(key, link, title, description — including Expectation / Test Case (AC) sections — and
attachment links) is copied to your clipboard as Markdown, ready to paste into Claude.

No API token or credentials needed — it calls Jira's REST API from inside your
already-logged-in tab.

## Install (Chrome or Dia)

1. Open `chrome://extensions` (in Dia: the extensions page in settings).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder (`~/Documents/jira-copy-extension`).
4. Pin the "Jira Card to Clipboard" button to the toolbar.

## Use

1. Open any Jira card — either a `/browse/OLS-843` page or a board with a card selected
   (`?selectedIssue=OLS-843`).
2. Click the extension button.
3. A green toast confirms "✓ Copied OLS-843" — paste into Claude.

## Output format

```markdown
# OLS-843: <title>

**Link:** https://skilllane.atlassian.net/browse/OLS-843

## Description
<description as Markdown, headings/lists/tables/code preserved>

## Attachments
- design-mock.png (240 KB) — <direct URL>
```

## Development

- `adf.js` — converts Jira's ADF (Atlassian Document Format) JSON to Markdown.
- `content.js` — finds the issue key, fetches the issue, formats, copies, shows a toast.
- `background.js` — injects the two scripts on toolbar click (uses `activeTab`, no broad host permissions).
- Tests: `node test.js`

## Planned (not in v1)

Purpose presets (feature / fix-bug / improve / recheck) that prepend a pre-prompt to the
copied text, via a popup menu.
