# Weekly Planner

A local-first weekly planner Progressive Web App.

## Features

- Weekly planner from Monday to Friday.
- Project table with editable project cells.
- Editable project column names.
- Add project columns with `+`.
- Remove project columns with `×`.
- Remove projects without confirmation.
- Highlight projects with the lightbulb button.
- Planner dropdowns grouped by project column.
- Planner cells show both the column name and the project name.
- Clear planner cells with `×`.
- Out-of-office row with green column highlighting.
- Undo button.
- Local browser storage through `localStorage`.
- Export/import JSON backup.
- Installable as a PWA.
- Offline support after first load.

## GitHub Pages

Upload all files to the root of the repository and enable:

```text
Settings → Pages → Deploy from a branch → main → /root
```

Do not upload exported JSON backups if they contain private data.

## Cache note

This version uses cache-busting asset URLs and a network-first service worker. After deploying, use a hard refresh or uninstall/reinstall the PWA if an old installed version remains cached.
