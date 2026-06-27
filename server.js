#!/usr/bin/env node
/*
 * inline server -- serve a folder of static files AND let `inline`'s save button
 * write edits back to the source files on disk. zero dependencies.
 *
 *   node server.js [--port 5173] [--dir .]
 *
 * then open http://localhost:5173/<page>?edit, edit text, and hit "save".
 * each edit is an exact old->new text replacement in the page's source .html
 * file, so the change is permanent (a .inline-bak copy is written the first
 * time a file is touched).
 *
 * note: this matches the *rendered* text against the file's text. it shines for
 * plain static HTML. for framework source (.astro/.jsx/etc.) it still works when
 * the literal string appears in the source; otherwise use "copy changes".
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opt = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const PORT = parseInt(opt("--port", "5173"), 10);
const ROOT = path.resolve(opt("--dir", "."));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

// resolve a url path to a file on disk (static-site conventions)
function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (p.endsWith("/")) p += "index.html";
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) return null; // no traversal
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (fs.existsSync(f)) return f;
  // extensionless: try .html then /index.html
  if (!path.extname(f)) {
    if (fs.existsSync(f + ".html")) return f + ".html";
    if (fs.existsSync(path.join(f, "index.html"))) return path.join(f, "index.html");
  }
  return null;
}

function send(res, code, body, type) {
  res.writeHead(code, { "content-type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

function handleSave(req, res) {
  let raw = "";
  req.on("data", (c) => {
    raw += c;
    if (raw.length > 2_000_000) req.destroy();
  });
  req.on("end", () => {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return send(res, 400, JSON.stringify({ ok: false, error: "bad json" }), TYPES[".json"]);
    }
    const file = resolveFile(payload.path || "/");
    if (!file) return send(res, 404, JSON.stringify({ ok: false, error: "no source file for " + payload.path }), TYPES[".json"]);

    let text = fs.readFileSync(file, "utf8");
    let replaced = 0;
    const misses = [];
    for (const e of payload.edits || []) {
      if (!e || e.old == null || e.new == null || e.old === e.new) continue;
      if (text.includes(e.old)) {
        text = text.split(e.old).join(e.new); // all exact occurrences
        replaced++;
      } else {
        misses.push(e.old.slice(0, 60));
      }
    }
    if (replaced) {
      const bak = file + ".inline-bak";
      if (!fs.existsSync(bak)) fs.writeFileSync(bak, fs.readFileSync(file));
      fs.writeFileSync(file, text, "utf8");
    }
    const rel = path.relative(ROOT, file);
    console.log(`  saved ${replaced} edit(s) -> ${rel}${misses.length ? `  (${misses.length} not found in source)` : ""}`);
    send(res, replaced || !misses.length ? 200 : 422, JSON.stringify({ ok: true, file: rel, replaced, misses }), TYPES[".json"]);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/__inline/save")) return handleSave(req, res);

  const file = resolveFile(req.url === "/" ? "/index.html" : req.url);
  if (!file) return send(res, 404, "not found");
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  inline server`);
  console.log(`  serving ${ROOT}`);
  console.log(`  → http://localhost:${PORT}/  (add ?edit to a page, then hit save)\n`);
});
