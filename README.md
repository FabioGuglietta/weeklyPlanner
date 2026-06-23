# Weekly Planner

A local-first Web App for weekly planning.

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
- Progressive Web App support through `manifest.webmanifest` and `service-worker.js`.

## Local use

Open `index.html` in a browser.

Some PWA features, such as offline caching and installation, work only when the app is served through `http://` or `https://`, not when opened directly as a local file.

## Publishing on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files and folders:
   - `index.html`
   - `style.css`
   - `app.js`
   - `manifest.webmanifest`
   - `service-worker.js`
   - `icons/`
   - `README.md`
3. Go to `Settings → Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Select the `main` branch and `/root` folder.
6. Save.

After deployment, open the GitHub Pages URL. The browser may offer an `Install app` option. The app stores data locally in the browser and can be used offline after the first successful load.

## Data storage

The app stores data in the browser using `localStorage`. Data is not synchronized across devices. Use `Export JSON` and `Import JSON` to back up or move your planner data.
