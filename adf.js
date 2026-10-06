// Converts Atlassian Document Format (ADF) — the JSON structure Jira Cloud
// returns for description/comment fields — into Markdown.
// Used by the content script; also loadable in Node for tests.

(function (global) {
  'use strict';

  function escapeCell(s) {
    return s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
  }

  function applyMarks(text, marks) {
    if (!marks) return text;
    let out = text;
    for (const mark of marks) {
      switch (mark.type) {
        case 'strong': out = `**${out}**`; break;
        case 'em': out = `*${out}*`; break;
        case 'code': out = `\`${out}\``; break;
        case 'strike': out = `~~${out}~~`; break;
        case 'link': out = `[${out}](${(mark.attrs && mark.attrs.href) || ''})`; break;
        // underline, textColor, subsup etc. have no markdown equivalent — keep text as-is
      }
    }
    return out;
  }

  // Renders inline content of a node to a single-line string.
  function inline(nodes) {
    if (!nodes) return '';
    return nodes.map((node) => {
      switch (node.type) {
        case 'text': return applyMarks(node.text || '', node.marks);
        case 'hardBreak': return '\n';
        case 'mention': return (node.attrs && node.attrs.text) || '@unknown';
        case 'emoji': return (node.attrs && (node.attrs.shortName || node.attrs.text)) || '';
        case 'status': return `[${(node.attrs && node.attrs.text) || ''}]`;
        case 'date': {
          const ts = node.attrs && node.attrs.timestamp;
          return ts ? new Date(Number(ts)).toISOString().slice(0, 10) : '';
        }
        case 'inlineCard': return (node.attrs && (node.attrs.url || '')) || '';
        case 'media': return mediaToMd(node);
        default: return node.content ? inline(node.content) : '';
      }
    }).join('');
  }

  function mediaToMd(node) {
    const attrs = node.attrs || {};
    const name = attrs.alt || attrs.id || 'attachment';
    return `![${name}](attached)`;
  }

  function listItems(items, marker, indent) {
    const pad = '  '.repeat(indent);
    return items.map((item, i) => {
      const bullet = marker === 'ordered' ? `${i + 1}. ` : '- ';
      const parts = [];
      for (const child of item.content || []) {
        if (child.type === 'bulletList' || child.type === 'orderedList') {
          parts.push(block(child, indent + 1));
        } else if (child.type === 'paragraph') {
          parts.push(pad + bullet.padEnd(parts.length ? bullet.length : 0) + inline(child.content));
        } else {
          parts.push(pad + '  ' + block(child, indent));
        }
      }
      // Only the first line gets the bullet; we built it above for the first paragraph.
      if (parts.length && !parts[0].startsWith(pad + bullet)) {
        parts[0] = pad + bullet + parts[0].trimStart();
      }
      return parts.join('\n');
    }).join('\n');
  }

  function tableToMd(node) {
    const rows = (node.content || []).filter((r) => r.type === 'tableRow');
    if (!rows.length) return '';
    const toCells = (row) =>
      (row.content || []).map((cell) =>
        escapeCell((cell.content || []).map((c) => inline(c.content)).join(' ').trim())
      );
    const lines = [];
    const header = toCells(rows[0]);
    lines.push(`| ${header.join(' | ')} |`);
    lines.push(`| ${header.map(() => '---').join(' | ')} |`);
    for (const row of rows.slice(1)) {
      lines.push(`| ${toCells(row).join(' | ')} |`);
    }
    return lines.join('\n');
  }

  // Renders one block-level node to markdown (may be multi-line).
  function block(node, indent = 0) {
    switch (node.type) {
      case 'paragraph': return inline(node.content);
      case 'heading': return `${'#'.repeat((node.attrs && node.attrs.level) || 1)} ${inline(node.content)}`;
      case 'bulletList': return listItems(node.content || [], 'bullet', indent);
      case 'orderedList': return listItems(node.content || [], 'ordered', indent);
      case 'codeBlock': {
        const lang = (node.attrs && node.attrs.language) || '';
        return `\`\`\`${lang}\n${inline(node.content)}\n\`\`\``;
      }
      case 'blockquote':
        return blocks(node.content).split('\n').map((l) => `> ${l}`.trimEnd()).join('\n');
      case 'panel': {
        const kind = (node.attrs && node.attrs.panelType) || 'note';
        return blocks(node.content).split('\n').map((l, i) => (i === 0 ? `> **${kind}:** ${l}` : `> ${l}`)).join('\n');
      }
      case 'rule': return '---';
      case 'table': return tableToMd(node);
      case 'mediaSingle':
      case 'mediaGroup':
        return (node.content || []).map(mediaToMd).join('\n');
      case 'taskList':
        return (node.content || []).map((item) => {
          const done = item.attrs && item.attrs.state === 'DONE';
          return `- [${done ? 'x' : ' '}] ${inline(item.content)}`;
        }).join('\n');
      case 'expand':
      case 'nestedExpand': {
        const title = (node.attrs && node.attrs.title) || '';
        const body = blocks(node.content);
        return title ? `**${title}**\n\n${body}` : body;
      }
      default:
        // Unknown block: render whatever children it has rather than dropping content.
        return node.content ? blocks(node.content) : '';
    }
  }

  function blocks(nodes) {
    return (nodes || [])
      .map((n) => block(n))
      .filter((s) => s !== '')
      .join('\n\n');
  }

  function adfToMarkdown(adf) {
    if (!adf || !Array.isArray(adf.content)) return '';
    return blocks(adf.content).trim();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { adfToMarkdown };
  } else {
    global.adfToMarkdown = adfToMarkdown;
  }
})(typeof self !== 'undefined' ? self : this);
