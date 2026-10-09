# Kryptonite

A small Python script that reads a project folder and writes a colour-coded map of it: the file tree, then each file's imports, env vars, functions, classes, FastAPI routes and `__main__` block. It is handy for getting your bearings in an unfamiliar codebase, or for pasting a compact summary into a review or an LLM prompt.

![Kryptonite's report for the sample project](../docs/assets/kryptonite-report.png)

## Run it

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python kryptonite.py sample/pastry_shop
```

The report is written to `krypt/<folder>.md`. It uses inline HTML colours, so open it in a Markdown preview that renders HTML (VS Code does).

![Running Kryptonite](../docs/assets/kryptonite-run.png)

`sample/pastry_shop` is a tiny invented FastAPI project included only as input to try the tool on.

## Colour key

| Colour | Section |
| --- | --- |
| light blue | imports |
| green | env vars (`os.getenv`) |
| orange | functions (`@name` = async) |
| purple | classes |
| teal | routes (`@router.get/post/patch/delete`) |
| red | `if __name__ == "__main__":` block |

It is regex-based, not an AST parser, so well-formatted code gives the best results.
