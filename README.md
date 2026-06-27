# inline

**edit the text on any page, in place.** one file, zero dependencies.

In our vibecode apocalypse, when you want to change a bit of text on your web app
or whatever, you have to go edit the file yourself in VS Code or prompt your LLM
to change it. Obviously it would be easier to just edit it inline -- so that's
what this does.

(Heavier tools exist -- TinaCMS, Decap/Netlify CMS, Builder.io -- but nothing this
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

- **save** → permanently writes your edits back into the source file on disk
  (see below). this is the one you want during development.
- **copy changes** → puts a JSON map of `{ "selector": "new text" }` on your
  clipboard, to paste back into your source by hand.
- your edits are also saved to this browser's `localStorage` and re-applied on
  every reload, so they persist locally even before you save anything.

## permanent save (writes the file)

`save` POSTs your edits to a small included server that rewrites the source file
on disk. Run your site through it:

```bash
node server.js            # serves the current folder on :5173
node server.js --port 8080 --dir public
```

Then open `http://localhost:5173/<page>?edit`, edit, and hit **save** -- each edit
is an exact old → new text replacement in that page's source file (a one-time
`.inline-bak` backup is written the first time a file is touched). It's perfect
for plain static HTML; for framework source (`.astro`, `.jsx`, …) it still works
whenever the literal string appears in the source, and falls back to *copy
changes* otherwise.

Pointing `save` at your own backend instead:

```html
<script src="inline.js" data-save="/api/inline-save"></script>
```

The endpoint receives `{ path, edits: [{ key, old, new }] }`.

`inline` only ever touches **leaf text** (`contenteditable="plaintext-only"`), so
your tags, links, and layout are never mangled -- just the words change.

## configure (optional)

```html
<script src="inline.js"
  data-selector="h1,h2,p,li,blockquote"  <!-- which elements are editable -->
  data-auto="1">                          <!-- start in edit mode immediately -->
</script>
```

Add `data-inline-skip` to any element you never want to be editable.

## files

- `inline.js` -- the client (injects its own styles + toolbar); the only file you
  need to use the editor + *copy changes*
- `server.js` -- optional zero-dep dev server that makes **save** write to disk
- `index.html` -- a live demo / docs page

## license

MIT.
