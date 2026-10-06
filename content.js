// Runs in the Jira tab when the toolbar button is clicked:
// finds the open issue, fetches it from Jira's REST API using the
// browser's own session, formats it as Markdown, copies to clipboard.
(async function () {
  'use strict';

  function findIssueKey() {
    const browseMatch = location.pathname.match(/\/browse\/([A-Z][A-Z0-9_]*-\d+)/i);
    if (browseMatch) return browseMatch[1].toUpperCase();
    const selected = new URLSearchParams(location.search).get('selectedIssue');
    if (selected) return selected.toUpperCase();
    return null;
  }

  function toast(message, isError) {
    const el = document.createElement('div');
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '2147483647',
      padding: '10px 16px',
      borderRadius: '8px',
      font: '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#fff',
      background: isError ? '#c9372c' : '#1f845a',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback for pages where the async clipboard API is blocked.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  }

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function buildMarkdown(key, issue) {
    const fields = issue.fields || {};
    const link = `${location.origin}/browse/${key}`;
    const lines = [];
    lines.push(`# ${key}: ${fields.summary || '(no title)'}`);
    lines.push('');
    lines.push(`**Link:** ${link}`);
    lines.push('');
    lines.push('## Description');
    lines.push('');
    const description = self.adfToMarkdown(fields.description);
    lines.push(description || '_(no description)_');

    const attachments = fields.attachment || [];
    if (attachments.length) {
      lines.push('');
      lines.push('## Attachments');
      lines.push('');
      for (const att of attachments) {
        const size = formatSize(att.size);
        lines.push(`- ${att.filename}${size ? ` (${size})` : ''} — ${att.content}`);
      }
    }
    return lines.join('\n');
  }

  const key = findIssueKey();
  if (!key) {
    toast('No Jira card found in this URL', true);
    return;
  }

  try {
    const res = await fetch(
      `${location.origin}/rest/api/3/issue/${key}?fields=summary,description,attachment`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) {
      toast(`Jira API error ${res.status} for ${key}`, true);
      return;
    }
    const issue = await res.json();
    const markdown = buildMarkdown(key, issue);
    const copied = await copyText(markdown);
    toast(copied ? `✓ Copied ${key}` : `Could not write to clipboard`, !copied);
  } catch (err) {
    toast(`Failed to copy ${key}: ${err.message}`, true);
  }
})();
