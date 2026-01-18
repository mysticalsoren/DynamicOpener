# AI Dungeon Template for VSCode
Made personally for me. 

You don't need [Python](https://www.python.org) installed to start developing.  Everything is purely javascript, using vscode's built-in typescript.

## Features
* A basic outline of AI Dungeon's globals.
* Bundling support for combining multiple libraries into one `library.js`
  * *requires python to be installed*
## Using other libraries
```sh
cd lib && git clone username/repo.git
```
The rest will be set up correctly by the [`jsconfig.json`](./jsconfig.json)

---
Assumes that the file structure is
`./lib/*/src/library.js`
```javascript
. // Your current working directory
└── lib/
    ├── Auto-Cards/ // LewdLeah's repository
    │   └── src/
    │       ├── input.js
    │       ├── context.js
    │       ├── output.js
    │       └── library.js // Found!
    └── library-B/
        └── innerParent/
            └── src/
                ├── input.js
                ├── (...)
                └── library.js // Invalid file structure
```
## Bundling
```sh
python build.py
```
Combines all library files into one for copying and pasting to AI Dungeon.

*I don't know how does NodeJS and I tried but its faster for me to program in Python. Sorry!*
## Helpful tips
* Anything inside the `library` is available anywhere in global scope.
* `history` is not updated until the `Context` hook.
* `history` is a shallow copy. Meaning that any changes made will not be reflected on AI Dungeon's side
* `Input` hook is ran only on `Do`, `Say`, and `Story`.