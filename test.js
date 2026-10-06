// Run with: node test.js
const assert = require('node:assert');
const { adfToMarkdown } = require('./adf.js');

function doc(...content) {
  return { type: 'doc', version: 1, content };
}
const text = (t, ...marks) => ({ type: 'text', text: t, ...(marks.length ? { marks } : {}) });
const p = (...content) => ({ type: 'paragraph', content });

let passed = 0;
function eq(actual, expected, label) {
  assert.strictEqual(actual, expected, label);
  passed++;
}

// plain paragraph
eq(adfToMarkdown(doc(p(text('hello world')))), 'hello world', 'paragraph');

// headings
eq(
  adfToMarkdown(doc({ type: 'heading', attrs: { level: 2 }, content: [text('Expectation')] }, p(text('it works')))),
  '## Expectation\n\nit works',
  'heading'
);

// marks: strong, em, code, link, strike
eq(adfToMarkdown(doc(p(text('bold', { type: 'strong' })))), '**bold**', 'strong');
eq(adfToMarkdown(doc(p(text('it', { type: 'em' })))), '*it*', 'em');
eq(adfToMarkdown(doc(p(text('x = 1', { type: 'code' })))), '`x = 1`', 'code mark');
eq(
  adfToMarkdown(doc(p(text('docs', { type: 'link', attrs: { href: 'https://x.y' } })))),
  '[docs](https://x.y)',
  'link'
);
eq(adfToMarkdown(doc(p(text('old', { type: 'strike' })))), '~~old~~', 'strike');

// bullet list
eq(
  adfToMarkdown(doc({
    type: 'bulletList',
    content: [
      { type: 'listItem', content: [p(text('one'))] },
      { type: 'listItem', content: [p(text('two'))] },
    ],
  })),
  '- one\n- two',
  'bulletList'
);

// ordered list
eq(
  adfToMarkdown(doc({
    type: 'orderedList',
    content: [
      { type: 'listItem', content: [p(text('first'))] },
      { type: 'listItem', content: [p(text('second'))] },
    ],
  })),
  '1. first\n2. second',
  'orderedList'
);

// nested list
eq(
  adfToMarkdown(doc({
    type: 'bulletList',
    content: [
      {
        type: 'listItem',
        content: [
          p(text('parent')),
          { type: 'bulletList', content: [{ type: 'listItem', content: [p(text('child'))] }] },
        ],
      },
    ],
  })),
  '- parent\n  - child',
  'nested list'
);

// code block
eq(
  adfToMarkdown(doc({ type: 'codeBlock', attrs: { language: 'js' }, content: [text('const a = 1;')] })),
  '```js\nconst a = 1;\n```',
  'codeBlock'
);

// blockquote
eq(
  adfToMarkdown(doc({ type: 'blockquote', content: [p(text('quoted'))] })),
  '> quoted',
  'blockquote'
);

// rule and hardBreak
eq(adfToMarkdown(doc(p(text('a'), { type: 'hardBreak' }, text('b')), { type: 'rule' })), 'a\nb\n\n---', 'hardBreak + rule');

// table
eq(
  adfToMarkdown(doc({
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: [
          { type: 'tableHeader', content: [p(text('Case'))] },
          { type: 'tableHeader', content: [p(text('Result'))] },
        ],
      },
      {
        type: 'tableRow',
        content: [
          { type: 'tableCell', content: [p(text('login ok'))] },
          { type: 'tableCell', content: [p(text('redirect'))] },
        ],
      },
    ],
  })),
  '| Case | Result |\n| --- | --- |\n| login ok | redirect |',
  'table'
);

// mention, status, emoji, date, inlineCard
eq(adfToMarkdown(doc(p({ type: 'mention', attrs: { text: '@Tanabut' } }))), '@Tanabut', 'mention');
eq(adfToMarkdown(doc(p({ type: 'status', attrs: { text: 'DONE' } }))), '[DONE]', 'status');
eq(adfToMarkdown(doc(p({ type: 'emoji', attrs: { shortName: ':smile:' } }))), ':smile:', 'emoji');
eq(adfToMarkdown(doc(p({ type: 'inlineCard', attrs: { url: 'https://a.b/c' } }))), 'https://a.b/c', 'inlineCard');

// task list
eq(
  adfToMarkdown(doc({
    type: 'taskList',
    content: [
      { type: 'taskItem', attrs: { state: 'DONE' }, content: [text('shipped')] },
      { type: 'taskItem', attrs: { state: 'TODO' }, content: [text('pending')] },
    ],
  })),
  '- [x] shipped\n- [ ] pending',
  'taskList'
);

// panel
eq(
  adfToMarkdown(doc({ type: 'panel', attrs: { panelType: 'info' }, content: [p(text('note this'))] })),
  '> **info:** note this',
  'panel'
);

// media (image attachment placeholder)
eq(
  adfToMarkdown(doc({
    type: 'mediaSingle',
    content: [{ type: 'media', attrs: { alt: 'mock.png', type: 'file' } }],
  })),
  '![mock.png](attached)',
  'media'
);

// expand
eq(
  adfToMarkdown(doc({ type: 'expand', attrs: { title: 'More' }, content: [p(text('hidden detail'))] })),
  '**More**\n\nhidden detail',
  'expand'
);

// unknown node types don't crash and still render children text
eq(adfToMarkdown(doc({ type: 'futureWidget', content: [p(text('still here'))] })), 'still here', 'unknown node');

// empty / missing doc
eq(adfToMarkdown(null), '', 'null doc');
eq(adfToMarkdown({ type: 'doc', content: [] }), '', 'empty doc');

console.log(`All ${passed} assertions passed`);
