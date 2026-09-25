# DocForge AI — Markdown Conversion Test Suite

> Master test file for validating Markdown → Microsoft Word conversion.

---

# Introduction

DocForge AI converts Markdown documents into professional Microsoft Word documents.

This document intentionally contains many Markdown scenarios so every stage of the conversion engine can be tested.

## Project Goals

1. Convert Markdown into a professional Word document.
2. Preserve document structure.
3. Preserve external links.
4. Preserve internal links where supported.
5. Render Mermaid diagrams.
6. Preserve code blocks.
7. Preserve images.
8. Preserve tables.
9. Preserve text formatting.
10. Preserve lists and task lists.
11. Preserve blockquotes.
12. Maintain readable Word formatting.

---

# Text Formatting

## Paragraphs

This is a normal paragraph.

This is another paragraph containing multiple sentences. Paragraph boundaries and readable spacing should be preserved.

## Bold

This is **bold text**.

This is **important information** that should appear bold in Word.

## Italic

This is *italic text*.

This is *another example of italic text*.

## Bold and Italic

This is ***bold and italic text***.

This is ***another bold and italic example***.

## Strikethrough

This is ~~deleted text~~.

This text should remain normal while ~~this portion should be struck through~~.

## Mixed Formatting

This paragraph contains **bold**, *italic*, ***bold italic***, ~~strikethrough~~, and `inline code`.

## Nested Formatting

This is **bold with *italic inside it***.

This is *italic with **bold inside it***.

This is ***bold italic with `inline code` inside it***.

---

# Links

## External Links

Visit [Microsoft](https://www.microsoft.com/).

Visit [GitHub](https://github.com/).

Visit [React](https://react.dev/).

Visit [Electron](https://www.electronjs.org/).

## Link with Title

[OpenAI](https://openai.com/ "OpenAI website")

## Automatic URL

https://www.example.com

## Email

Contact: example@example.com

## Internal Links

Go to the [Introduction](#introduction).

Go to the [Code section](#code).

Go to the [Final Test](#final-test).

---

# Lists

## Unordered List

* Apple
* Orange
* Banana
* Mango

## Ordered List

1. First item
2. Second item
3. Third item
4. Fourth item

## Nested Unordered List

* Frontend
  * React
  * TypeScript
  * Vite
  * CSS
* Backend
  * Node.js
  * Express
  * TypeScript
* Desktop
  * Electron
  * Electron Vite

## Nested Ordered List

1. Development
   1. Install dependencies
   2. Write code
   3. Run tests
   4. Build application
2. Testing
   1. Functional testing
   2. Accessibility testing
   3. Performance testing
3. Release
   1. Package application
   2. Create installer
   3. Publish release

## Mixed Nested Lists

* Development
  1. Frontend
  2. Backend
  3. Desktop
* Testing
  * Unit testing
  * Integration testing
  * End-to-end testing
* Release
  1. Build
  2. Package
  3. Deploy

---

# Task Lists

## Development Tasks

* [x] Create Electron application
* [x] Add Markdown file picker
* [x] Read Markdown files
* [x] Render Markdown preview
* [x] Add DOCX generation
* [x] Add automatic Downloads saving
* [x] Add duplicate filename handling
* [x] Add table support
* [x] Add image support
* [x] Add Mermaid rendering
* [x] Add blockquote support
* [ ] Improve advanced DOCX formatting

## Release Checklist

* [ ] Run lint
* [ ] Run tests
* [ ] Build application
* [ ] Create installer
* [ ] Test installer
* [ ] Create GitHub release

---

# Blockquotes

## Simple Blockquote

> This is a simple blockquote.

## Multi-Line Blockquote

> This is a longer blockquote containing multiple lines.
>
> Markdown blockquotes should be converted into an appropriate Word paragraph style.

## Blockquote with Bold

> **Important:** This information should appear bold inside the blockquote.

## Blockquote with Italic

> *This sentence should appear italic inside the blockquote.*

## Blockquote with Mixed Formatting

> This blockquote contains **bold text**, *italic text*, ***bold italic text***, ~~strikethrough~~, and `inline code`.

## Blockquote with Link

> Visit [Microsoft](https://www.microsoft.com/) for more information.

## Nested Blockquote

> Main quote
>
> > Nested quote
>
> Back to the main quote.

---

# Code

## Inline Code

Use `npm install` to install dependencies.

The application uses `npm run dev` during development.

The `DocxService` is responsible for generating Word documents.

## JavaScript

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("DocForge AI"));

## TypeScript

```typescript
interface DocumentOptions {
  preserveLinks: boolean;
  renderMermaid: boolean;
  preserveCodeBlocks: boolean;
  preserveImages: boolean;
}

const options: DocumentOptions = {
  preserveLinks: true,
  renderMermaid: true,
  preserveCodeBlocks: true,
  preserveImages: true
};
```

## React

```tsx
import React from 'react';

function Welcome() {
  return (
    <section>
      <h1>Welcome to DocForge AI</h1>
      <p>Markdown to Word conversion.</p>
    </section>
  );
}

export default Welcome;
```

## Bash

```bash
npm install
npm run dev
npm run lint
npm run build
```

## JSON

```json
{
  "name": "docforge-ai",
  "version": "1.0.0",
  "features": [
    "markdown",
    "docx",
    "mermaid"
  ]
}
```

## Java

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello DocForge AI");
    }
}
```

## Python

```python
def convert_markdown(markdown):
    print("Converting Markdown to DOCX")
    return True

convert_markdown("# Hello")
```

---

# Tables

## Basic Table

| Name | Role | Status |
| --- | --- | --- |
| Alice | Developer | Active |
| Bob | Tester | Active |
| Charlie | Designer | Completed |

## Alignment Table

| Feature | Left | Center | Right |
| :--- | :---: | ---: | ---: |
| Headings | Yes | Yes | Yes |
| Lists | Yes | Yes | Yes |
| Tables | Yes | Yes | Yes |
| Images | Yes | Yes | Yes |

## Table with Formatting

| Feature | Description | Status |
| --- | --- | --- |
| **Links** | Preserve clickable links | **Working** |
| *Code* | Preserve code formatting | **Working** |
| Mermaid | Render diagrams | **Working** |
| Tables | Convert Markdown tables | **Working** |

## Complex Table

| Component | Technology | Version | Purpose |
| --- | --- | --- | --- |
| Frontend | React | 19.x | User interface |
| Language | TypeScript | 5.x | Type safety |
| Desktop | Electron | Latest | Desktop application |
| Build | Electron Vite | Latest | Development/build |
| DOCX | docx | Latest | Word generation |
| Markdown | remark | Latest | Markdown parsing |

---

# Images

## Remote Image

![DocForge AI](https://httpbin.org/image/png)

## Image with Alt Text

![DocForge AI application preview](https://httpbin.org/image/png)

## Image with Title

![Architecture Diagram](https://httpbin.org/image/png "DocForge AI Architecture")

---

# Mermaid Diagrams

## Flowchart

```mermaid
flowchart TD
    A[Markdown File] --> B[Markdown Parser]
    B --> C[Document AST]
    C --> D[DOCX Renderer]
    D --> E[Word Document]
```

## Application Architecture

```mermaid
flowchart LR
    UI[React UI] --> Service[Application Services]
    Service --> Parser[Markdown Parser]
    Parser --> AST[Markdown AST]
    AST --> Renderer[DOCX Renderer]
    Renderer --> IPC[Electron IPC]
    IPC --> FS[File System]
    FS --> DOCX[Professional DOCX]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Parser
    participant Renderer
    participant Electron

    User->>App: Select Markdown
    App->>Parser: Parse Markdown
    Parser-->>App: Return AST
    App->>Renderer: Generate DOCX
    Renderer->>Electron: Save DOCX
    Electron-->>User: File created
```

## Class Diagram

```mermaid
classDiagram
    class MarkdownParserService {
        +parse(markdown)
    }

    class DocxService {
        +generateDocx(markdown)
        +saveDocx(path, markdown)
    }

    MarkdownParserService --> DocxService
```

---

# Horizontal Rules

Content above the rule.

---

Content below the rule.

---

# Special Characters

## Mathematical Symbols

± × ÷ = ≠ ≤ ≥ ∞ √ ∑ ∆ π

## Currency

₹ $ € £ ¥ ₩

## Arrows

→ ← ↑ ↓ ⇒ ⇐ ⇑ ⇓ ↔

## Symbols

© ® ™ § ¶ ✓ ✕ ★ ☆

## Unicode

Hello 世界

வணக்கம்

こんにちは

안녕하세요

Привет

---

# Escaping Markdown

These characters should appear literally:

\*Not italic\*

\**Not bold\*

\# Not a heading

\[Not a link\]

---

# Advanced Markdown

## Long Paragraph

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Empty Line Handling

First paragraph.

Second paragraph.

Third paragraph.

## HTML

Some Markdown documents may contain inline HTML.

<span>This is inline HTML.</span>

<div>This is a block-level HTML element.</div>

The converter should handle unsupported HTML gracefully.

---

# Conversion Requirements

1. Preserve heading hierarchy.
2. Preserve external hyperlinks.
3. Preserve internal document links where supported.
4. Preserve bold and italic formatting.
5. Preserve strikethrough formatting.
6. Preserve ordered lists.
7. Preserve unordered lists.
8. Preserve nested lists.
9. Preserve task lists.
10. Preserve blockquotes.
11. Preserve code blocks.
12. Preserve inline code.
13. Preserve tables.
14. Preserve images.
15. Render Mermaid diagrams.
16. Preserve Unicode characters.
17. Maintain readable spacing.
18. Avoid unnecessary blank pages.
19. Preserve document structure.
20. Generate a valid `.docx` file.
21. Save the generated DOCX automatically to the Windows Downloads folder.
22. Automatically create a unique filename when a file with the same name already exists.
23. Open successfully in Microsoft Word and Google Docs.

---

# Final Test

This is the final section of the master test document.

## Final Checklist

* [ ] Headings converted
* [ ] Paragraphs converted
* [ ] Bold converted
* [ ] Italic converted
* [ ] Strikethrough converted
* [ ] Links converted
* [ ] Internal links handled
* [ ] Bullet lists converted
* [ ] Numbered lists converted
* [ ] Nested lists converted
* [ ] Task lists converted
* [ ] Blockquotes converted
* [ ] Blockquote formatting preserved
* [ ] Inline code converted
* [ ] Code blocks converted
* [ ] Tables converted
* [ ] Images converted
* [ ] Mermaid diagrams rendered
* [ ] Unicode preserved
* [ ] DOCX saved automatically to Downloads
* [ ] Duplicate filename handled correctly
* [ ] DOCX opens successfully

---

# Heading 1 Test

## Heading 2 Test

### Heading 3 Test

#### Heading 4 Test

##### Heading 5 Test

###### Heading 6 Test

---

# Introduction

This is the introduction section.

[Go to Project Goals](#project-goals)

## Project Goals

These are the project goals.

[Go to Introduction](#introduction)

---

# Image Tests

## PNG Image

![PNG test image](./images/test.png)

## JPG Image

![JPG test image](./images/test.jpg)

## Image With Alt Text

![This is the image description](./images/test.png)

## Missing Image

![Missing image](./images/does-not-exist.png)

---

## Ordered List Test

1. First item
2. Second item
3. Third item

## Second Ordered List

1. Another first item
2. Another second item
3. Another third item

## Nested Ordered List

1. Main item one
   1. Nested item one
   2. Nested item two
   3. Nested item three
2. Main item two
   1. Nested item one
   2. Nested item two

## Mixed Lists

1. Main ordered item
   - Nested bullet one
   - Nested bullet two
2. Second ordered item
   - Nested bullet three
   - Nested bullet four

## Deep Nested Lists

1. Level one
   1. Level two
      1. Level three
      2. Level three second
   2. Level two second
2. Level one second

## Task List

- [ ] Create project
- [x] Configure Electron
- [ ] Implement Markdown parser
- [x] Implement DOCX converter

## Nested Task List

- [ ] Main task
  - [ ] Sub task one
  - [x] Sub task two
- [x] Completed main task

---

# End of DocForge AI Test Suite

**DocForge AI**

> Markdown → Professional Microsoft Word Converter