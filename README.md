# inline

**edit the text on any page, in place.** one file, zero dependencies.

In our vibecode apocalypse, when you want to change a bit of text on your web app
or whatever, you have to go edit the file yourself in VS Code or prompt your LLM
to change it. Obviously it would be easier to just edit it inline — so that's
what this does.

(Heavier tools exist — TinaCMS, Decap/Netlify CMS, Builder.io — but nothing this
small and portable. `inline` is a single script you can paste onto anything.)

## use it

Drop the one file onto any page:

```html
<script src="inline.js"></script>
```

Then turn on edit mode any of three ways:

- add **`?edit`** to the URL
- press **⌘/Ctrl + Shift + E**
- call **`Inline.toggle()`** (from the console, or wire it to your own button)

Now click any line of text, type, and edit it in place. A small toolbar tracks
your edits. When you're happy:

- **copy changes** → puts a JSON map of `{ "selector": "new text" }` on your
  clipboard, so you can paste the edits back into your source and commit them.
- your edits are also saved to this browser's `localStorage` and re-applied on
  every reload, so they persist locally even before you commit anything.

`inline` only ever touches **leaf text** (`contenteditable="plaintext-only"`), so
your tags, links, and layout are never mangled — just the words change.

## configure (optional)

```html
<script src="inline.js"
  data-selector="h1,h2,p,li,blockquote"  <!-- which elements are editable -->
  data-auto="1">                          <!-- start in edit mode immediately -->
</script>
```

Add `data-inline-skip` to any element you never want to be editable.

## files

- `inline.js` — the whole thing (injects its own styles + toolbar)
- `index.html` — a live demo / docs page

## license

MIT.
