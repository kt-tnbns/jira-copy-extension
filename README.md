<img src="icons/icon128.png" width="64" height="64" alt="Extension icon" align="left">

# Jira Card to Clipboard

<br clear="left">

Chrome/Chromium extension: open a Jira card, click the toolbar button, and the whole card
(key, link, title, description — including Expectation / Test Case (AC) sections — and
attachment links) is copied to your clipboard as Markdown, ready to paste into Claude.

No API token or credentials needed — it calls Jira's REST API from inside your
already-logged-in tab.

## Install

1. [Download the .zip](https://github.com/kt-tnbns/jira-copy-extension/archive/refs/heads/main.zip) and unzip it (or clone this repo).
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Pin the "Jira Card to Clipboard" button to the toolbar.

Full guide with visuals: open [install.html](install.html) in a browser.

## Use

Open any Jira card (a `/browse/PROJ-123` page or a board with a card selected), click the
extension button, wait for the green "✓ Copied" toast, then paste.

The clipboard output looks like:

```markdown
# PROJ-123: <card title>

**Link:** https://your-site.atlassian.net/browse/PROJ-123

## Description
<description as Markdown, headings / lists / tables / code preserved>

## Attachments
- design-mock.png (240 KB) — <direct URL>
```

## Development

- `manifest.json` — Manifest V3; only `activeTab`, `scripting`, and `clipboardWrite` permissions.
- `adf.js` — converts Jira's ADF (Atlassian Document Format) JSON to Markdown.
- `content.js` — finds the issue key, fetches the issue, formats, copies, shows a toast.
- `background.js` — injects the two scripts on toolbar click.
- `icons/` — toolbar/store icons (claymorphism clipboard with a Jira-style diamond mark);
  regenerate with `python3 icons/generate_icons.py` after tweaking colors or shapes.
- `install.html` — standalone installation guide page, deployable as-is.
- Tests: `node test.js`

## Privacy

Everything runs locally in your browser. The extension talks only to the Jira site in the
active tab, using your existing session; nothing is sent anywhere else.

## License

[MIT](LICENSE)
