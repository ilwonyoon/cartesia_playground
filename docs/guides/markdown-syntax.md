---
title: Markdown syntax
---

# Markdown syntax

A rendering preview of every markdown element the viewer supports. Use this page to verify design changes.

## Heading hierarchy

### H3 — subheading example

Body text is rendered with Inter + Pretendard. Latin glyphs come from *Inter*; Korean glyphs come from **Pretendard Variable**. Long lines wrap at word boundaries thanks to `word-break: keep-all`.

#### H4 — minor section

Smaller headings still read as distinct from body copy.

## Emphasis and inline

This sentence demonstrates **bold**, *italic*, ***both***, ~~strikethrough~~, and `inline code`. Links look like [this](https://github.com/ilwonyoon/markdown-preview).

## Code blocks

```typescript
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

function greet(user: User): string {
  return `Hello, ${user.name}!`
}
```

```python
def fibonacci(n: int) -> list[int]:
    """Generate the Fibonacci sequence."""
    result = [0, 1]
    for _ in range(n - 2):
        result.append(result[-1] + result[-2])
    return result

print(fibonacci(10))
```

## Lists

Unordered:

- First item
- Second item
  - Nested A
  - Nested B
- Third item

Ordered:

1. Plan
2. Implement
3. Verify

Task list:

- [x] Set up folder
- [x] Initialize VitePress
- [x] Apply fonts
- [ ] Verify on mobile

## Tables

| Tool             | Setup steps | Mobile UX | Korean fonts |
| ---------------- | ----------- | --------- | ------------ |
| VitePress        | 2           | Strong    | Inter4CJK    |
| Astro Starlight  | 1           | Strong    | System       |
| Docsify          | 1           | OK        | Manual       |
| MkDocs Material  | 2           | Strong    | System       |

## Blockquotes and callouts

> "Good design is as little design as possible."
> — Dieter Rams

::: info Info
Use this style to surface supporting context.
:::

::: tip Tip
Short, actionable hints belong here.
:::

::: warning Warning
For caveats and likely pitfalls.
:::

::: danger Danger
For important risks that must be addressed.
:::

::: details Click to expand
Hidden content reveals on click.

```bash
echo "expanded"
```
:::

## Images

Use the standard markdown image syntax:

```markdown
![Description](./images/screenshot.png)
```

## Horizontal rule

Use one to separate sections clearly:

---

Content after the rule.
