# Weekly Planner

Static local-first Web App for weekly planning.

## Features

- Monday-Friday weekly planner.
- Dropdown menu for each time slot, grouped by project column.
- `OUT OF OFFICE` checkbox with automatic green column highlighting.
- Directly editable `PROJECTS` table: click inside a cell and type.
- Press Enter to confirm an edit; press Esc to cancel the current edit.
- `+` button after the last project column to add a new project column.
- `×` button next to each column name to remove that column.
- `×` button next to each project to delete it.
- Lightbulb button next to each project to highlight it in yellow or remove the highlight.
- `×` button inside planner cells to quickly clear a slot.
- Planner entries show both the source project column and the project name.
- Automatic saving in `localStorage`.
- Export/Import JSON.
- Undo button for recent actions.
- Reset week and Reset all buttons.
- `How to use it` button with built-in usage instructions.

## Local use

Open `index.html` in a browser.

## Publishing on GitHub Pages

Upload `index.html`, `style.css`, `app.js`, and `README.md` to a GitHub repository, then enable GitHub Pages from `Settings → Pages`.


## Default data

The app starts empty by default. It contains one generic project column named `PROJECTS`, no predefined project names, an empty weekly planner, no highlighted cells, and no out-of-office days selected.
