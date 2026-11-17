# Install page demo recordings

The short silent recordings at the top of each entry on `/install` live in
`public/install/`. This folder holds what made them, so a recording can be made
again when a product's output changes.

Nothing here runs in the site build or in the tests. It needs Playwright with
a Chromium build, and `ffmpeg` with `libx264`.

## What each recording shows

Every line of output in a recording is what the product printed. Record again
after running the commands again; do not edit output by hand.

| Recording | Made with | Where the content comes from |
| --- | --- | --- |
| `command-line` | `player.html`, `demos/command-line.json` | `legesher translate`, `cat` and `legesher run` on a six-line file, from a fresh `pipx install legesher` |
| `mcp-server` | `player.html`, `demos/mcp-server.json` | `tools/list` and one `translate_to_native` call over stdio against `uvx legesher-mcp` |
| `language-packs` | `band.html`, `demos/language-packs.json` | each pack's own word for `print`, with a greeting in that language |
| `vs-code` | `record-vscode.mjs` | a real VS Code session with the extension from the Marketplace and `legesher-lsp` from PyPI |

## Terminal and band recordings

`player.html` types each command and shows its output; `band.html` lights one
language at a time. `record.mjs` steps either page through its timeline, takes
a screenshot per frame at twice the page size, and joins the frames:

```sh
node record.mjs <path to the playwright package> "$PWD/player.html" demos/command-line.json out command-line
```

It writes `out/<name>.mp4` (1280 wide, H.264) and `out/<name>.png`, the last
frame. The still on the site is that frame as a JPEG:

```sh
ffmpeg -i out/command-line.png -q:v 4 ../../public/install/command-line.jpg
```

In a demo file, `{"cmd": "..."}` is typed, `{"out": "..."}` appears whole,
`{"gap": true}` is a blank line, and `{{hl|word}}` colours a word.

## VS Code recording

`record-vscode.mjs` drives VS Code's own web mode with Playwright, so nothing
opens on the desktop and the profile is separate from yours:

1. Start `code serve-web --host 127.0.0.1 --port <port> --without-connection-token --server-data-dir <empty folder>`.
2. Install the extension into an empty folder with
   `code --extensions-dir <folder> --user-data-dir <folder> --install-extension legesher.legesher-vscode`
   and copy it, with its `extensions.json` entry, into `<server data dir>/extensions`.
3. In `<server data dir>/data/Machine/settings.json` set `legesher.workingLanguage`, point
   `legesher.serverCommand` at a `legesher-lsp` from a fresh `pipx install legesher-language-server`,
   and turn workspace trust, the welcome page and extension recommendations off.
4. Put the file to show in a folder (here `hello_hi.py`, the Hindi file `legesher translate` wrote) and
   open the editor once to trust the folder and hide the side bar.
5. Run `node record-vscode.mjs <playwright> "http://127.0.0.1:<port>/?folder=<folder>" <browser profile folder> out vs-code hello_hi.py <keyword> <keyword>`.

The script opens the file, rests the pointer on each keyword in turn so the
language server's hover card shows, and records screenshots beside those real
actions. It prints the text of each card it saw.
