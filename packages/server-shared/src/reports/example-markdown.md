# Welcome to the Plate Playground!

Experience a modern rich-text editor built with [Slate](https://slatejs.org) and [React](https://reactjs.org). This playground showcases just a part of Plate's capabilities. [Explore the documentation](/docs) to discover more.

## Collaborative Editing

Review and refine content seamlessly. Use [](/docs/suggestion) or to . Discuss changes using [comments](/docs/comment) on many text segments. You can even have  annotations!

## AI-Powered Editing

Boost your productivity with integrated [AI SDK](/docs/ai). Press <kbd>⌘+J</kbd> or <kbd>Space</kbd> in an empty line to:

* Generate content (continue writing, summarize, explain)
* Edit existing text (improve, fix grammar, change tone)

## Rich Content Editing

Structure your content with [headings](/docs/heading), [lists](/docs/list), and [quotes](/docs/blockquote). Apply [marks](/docs/basic-marks) like **bold**, _italic_, <u>underline</u>, ~~strikethrough~~, and `code`. Use [autoformatting](/docs/autoformat) for [Markdown](/docs/markdown)-like shortcuts (e.g., <kbd>\*</kbd>  for lists, <kbd>#</kbd>  for H1).

> Blockquotes are great for highlighting important information.

```javascript
function hello() { 
  console.info('Code blocks are supported!');
}
```

Create [links](/docs/link), [@mention](/docs/mention) users like [Alice](mention:Alice), or insert [emojis](/docs/emoji) ✨. Use the [slash command](/docs/slash-command) (/) for quick access to elements.

​

* Check
* [ ] Check 2
* [ ] Check 3

​

<callout icon="💡">
  This is a good callout
</callout>

​

<column_group>
  <column width="33.333333333333336%">
    Column 1
  </column>

  <column width="33.333333333333336%">
    Column 2
  </column>

  <column width="33.333333333333336%">
    Column 3
  </column>
</column_group>

### How Plate Compares

Plate offers many features out-of-the-box as free, open-source plugins.

| **Feature**         | **Plate (Free & OSS)** | **Tiptap**            |
| ------------------- | ---------------------- | --------------------- |
| AI                  | ✅                      | Paid Extension        |
| Comments            | ✅                      | Paid Extension        |
| Suggestions         | ✅                      | Paid (Comments Pro)   |
| Emoji Picker        | ✅                      | Paid Extension        |
| Table of Contents   | ✅                      | Paid Extension        |
| Drag Handle         | ✅                      | Paid Extension        |
| Collaboration (Yjs) | ✅                      | Hocuspocus (OSS/Paid) |

### Images and Media

Embed rich media like images directly in your content. Supports [Media uploads](/docs/media) and [drag & drop](/docs/dnd) for a smooth experience.

![](https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80\&w=600\&auto=format\&fit=crop\&ixlib=rb-4.0.3\&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

<file isUpload="true" name="sample.pdf" src="https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf" />

<audio src="https://samplelib.com/lib/preview/mp3/sample-3s.mp3" />


<metric metricId="123-456-789" />

### Table of Contents

<toc />

​
