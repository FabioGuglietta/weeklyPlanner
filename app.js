const STORAGE_KEY = "week-planner-v1";

const days = [
  { key: "monday", label: "MONDAY" },
  { key: "tuesday", label: "TUESDAY" },
  { key: "wednesday", label: "WEDNESDAY" },
  { key: "thursday", label: "THURSDAY" },
  { key: "friday", label: "FRIDAY" },
];

const hoursMorning = ["9", "10", "11", "12"];
const hoursEvening = ["14", "15", "16", "17"];
const allHours = [...hoursMorning, ...hoursEvening];
const defaultCategories = ["PROJECTS"];

const defaultState = {
  projects: {
    PROJECTS: [],
  },
  schedule: {
    monday: {},
    tuesday: {},
    wednesday: {},
    thursday: {},
    friday: {},
  },
  outOfOffice: {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
  },
  projectColumns: [...defaultCategories],
  highlightedProjects: [],
  highlightedProjectCells: [],
};
let state = loadState();
let undoStack = [];
const MAX_UNDO_STEPS = 50;

function pushUndo() {
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
  updateUndoButton();
}

function undoLastAction() {
  const previous = undoStack.pop();
  if (!previous) return;
  state = JSON.parse(previous);
  saveState();
  render();
}

function updateUndoButton() {
  const button = document.getElementById("undoBtn");
  if (button) button.disabled = undoStack.length === 0;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(defaultState);

  try {
    const parsed = JSON.parse(raw);
    return {
      ...clone(defaultState),
      ...parsed,
      projects: { ...clone(defaultState).projects, ...(parsed.projects || {}) },
      schedule: { ...clone(defaultState).schedule, ...(parsed.schedule || {}) },
      outOfOffice: { ...clone(defaultState).outOfOffice, ...(parsed.outOfOffice || {}) },
      projectColumns: getMergedProjectColumns(parsed),
      highlightedProjectCells: parsed.highlightedProjectCells || migrateHighlightedProjects(parsed),
    };
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getMergedProjectColumns(source = state) {
  const columns = source.projectColumns || defaultCategories;
  const projectKeys = Object.keys(source.projects || {});
  return [...new Set([...columns, ...projectKeys])];
}

function getCategories() {
  state.projectColumns = getMergedProjectColumns(state);
  return state.projectColumns;
}

function cellKey(category, project) {
  return `${category}::${project}`;
}

function migrateHighlightedProjects(source) {
  const highlighted = source.highlightedProjects || [];
  const projects = source.projects || {};
  return Object.keys(projects).flatMap((category) =>
    (projects[category] || [])
      .filter((project) => highlighted.includes(project))
      .map((project) => cellKey(category, project))
  );
}

function getProjectList() {
  const values = getCategories().flatMap((category) => state.projects[category] || []);
  return [...new Set(values.filter(Boolean))];
}

function projectValue(category, project) {
  return cellKey(category, project);
}

function getProjectEntries() {
  return getCategories().flatMap((category) =>
    (state.projects[category] || [])
      .filter(Boolean)
      .map((project) => ({ category, project, value: projectValue(category, project) }))
  );
}

function findProjectEntry(value) {
  if (!value) return null;
  const entries = getProjectEntries();

  const exact = entries.find((entry) => entry.value === value);
  if (exact) return exact;

  return entries.find((entry) => entry.project === value) || null;
}

function scheduleValueMatchesProject(value, category, project) {
  if (!value) return false;
  return value === projectValue(category, project) || value === project;
}

function render() {
  renderSchedule();
  renderCategorySelect();
  renderDeleteColumnSelect();
  renderProjects();
  updateUndoButton();
}

function renderSchedule() {
  const tbody = document.getElementById("scheduleBody");
  tbody.innerHTML = "";

  hoursMorning.forEach((hour) => tbody.appendChild(makeScheduleRow(hour)));

  const breakRow = document.createElement("tr");
  breakRow.className = "break-row";
  const breakCell = document.createElement("td");
  breakCell.colSpan = 6;
  breakCell.textContent = "BREAK";
  breakRow.appendChild(breakCell);
  tbody.appendChild(breakRow);

  hoursEvening.forEach((hour) => tbody.appendChild(makeScheduleRow(hour)));

  const outRow = document.createElement("tr");
  outRow.className = "out-row";

  const label = document.createElement("td");
  label.className = "out-label";
  label.textContent = "OUT OF OFFICE";
  outRow.appendChild(label);

  days.forEach((day) => {
    const td = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "out-checkbox";
    checkbox.checked = Boolean(state.outOfOffice[day.key]);
    checkbox.addEventListener("change", () => {
      pushUndo();
      state.outOfOffice[day.key] = checkbox.checked;
      saveState();
      renderSchedule();
    });
    td.appendChild(checkbox);
    outRow.appendChild(td);
  });

  tbody.appendChild(outRow);
}

function makeScheduleRow(hour) {
  const tr = document.createElement("tr");

  const timeCell = document.createElement("td");
  timeCell.className = "time-cell";
  timeCell.textContent = hour;
  tr.appendChild(timeCell);

  const entries = getProjectEntries();

  days.forEach((day) => {
    const td = document.createElement("td");
    td.className = "planner-cell";
    if (state.outOfOffice[day.key]) td.classList.add("out-of-office");

    const rawValue = state.schedule?.[day.key]?.[hour] || "";
    const selectedEntry = findProjectEntry(rawValue);
    const selectedValue = selectedEntry ? selectedEntry.value : "";

    const wrapper = document.createElement("div");
    wrapper.className = "slot-wrapper";

    const categoryLabel = document.createElement("div");
    categoryLabel.className = "slot-category";
    categoryLabel.textContent = selectedEntry ? `${selectedEntry.category}:` : "";
    wrapper.appendChild(categoryLabel);

    const select = document.createElement("select");
    select.className = "slot-select";
    select.dataset.day = day.key;
    select.dataset.hour = hour;

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "";
    select.appendChild(empty);

    getCategories().forEach((category) => {
      const projects = (state.projects[category] || []).filter(Boolean);
      if (!projects.length) return;

      const group = document.createElement("optgroup");
      group.label = `${category}:`;

      projects.forEach((project) => {
        const option = document.createElement("option");
        option.value = projectValue(category, project);
        option.textContent = project;
        group.appendChild(option);
      });

      select.appendChild(group);
    });

    select.value = selectedValue;

    select.addEventListener("change", () => {
      pushUndo();
      if (!state.schedule[day.key]) state.schedule[day.key] = {};
      state.schedule[day.key][hour] = select.value;
      saveState();
      renderSchedule();
    });

    wrapper.appendChild(select);
    td.appendChild(wrapper);

    if (selectedEntry) {
      const clear = document.createElement("button");
      clear.className = "clear-slot";
      clear.title = "Clear slot";
      clear.textContent = "×";
      clear.addEventListener("click", (event) => {
        event.stopPropagation();
        pushUndo();
        if (!state.schedule[day.key]) state.schedule[day.key] = {};
        state.schedule[day.key][hour] = "";
        saveState();
        renderSchedule();
      });
      td.appendChild(clear);
    }

    tr.appendChild(td);
  });

  return tr;
}

function renderCategorySelect() {
  // Kept for compatibility with older saved versions. Project insertion is now done directly in the table.
}

function renderDeleteColumnSelect() {
  // Kept for compatibility with older saved versions. Column deletion is now done from the table header.
}

function renderProjects() {
  const head = document.getElementById("projectsHead");
  const body = document.getElementById("projectsBody");
  head.innerHTML = "";
  body.innerHTML = "";

  const categories = getCategories();
  const headerRow = document.createElement("tr");

  categories.forEach((category) => {
    const th = document.createElement("th");
    th.className = "project-header";

    const title = document.createElement("span");
    title.className = "column-title";
    title.textContent = category;
    th.appendChild(title);

    const del = document.createElement("button");
    del.className = "delete-column";
    del.title = `Remove column ${category}`;
    del.textContent = "×";
    del.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteProjectColumn(category);
    });
    th.appendChild(del);

    headerRow.appendChild(th);
  });

  const addTh = document.createElement("th");
  addTh.className = "add-column-header";
  const addButton = document.createElement("button");
  addButton.className = "add-column";
  addButton.title = "Add project column";
  addButton.textContent = "+";
  addButton.addEventListener("click", addProjectColumn);
  addTh.appendChild(addButton);
  headerRow.appendChild(addTh);

  head.appendChild(headerRow);

  const maxRows = Math.max(8, ...categories.map((cat) => (state.projects[cat] || []).length + 1));

  for (let i = 0; i < maxRows; i++) {
    const tr = document.createElement("tr");

    categories.forEach((category) => {
      const td = document.createElement("td");
      const project = state.projects[category]?.[i] || "";

      if (project && (state.highlightedProjectCells || []).includes(cellKey(category, project))) {
        td.classList.add("highlight-project");
      }
      if (!project) td.classList.add("empty-project-cell");

      if (project) {
        const highlight = document.createElement("button");
        highlight.className = "highlight-toggle";
        highlight.title = "Highlight project";
        highlight.textContent = "💡";
        highlight.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleProjectHighlight(category, project);
        });
        td.appendChild(highlight);
      }

      const editor = document.createElement("div");
      editor.className = "editable-project";
      editor.contentEditable = "true";
      editor.spellcheck = false;
      editor.dataset.category = category;
      editor.dataset.index = String(i);
      editor.dataset.original = project;
      editor.textContent = project;
      editor.title = project ? "Edit project" : "Type a new project";

      editor.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          editor.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          editor.textContent = editor.dataset.original || "";
          editor.blur();
        }
      });

      editor.addEventListener("blur", () => {
        editProjectCell(category, i, editor.dataset.original || "", editor.textContent.trim());
      });

      td.appendChild(editor);

      if (project) {
        const del = document.createElement("button");
        del.className = "delete-project";
        del.title = "Delete project";
        del.textContent = "×";
        del.addEventListener("click", (event) => {
          event.stopPropagation();
          deleteProject(category, project);
        });
        td.appendChild(del);
      }

      tr.appendChild(td);
    });

    const emptyTd = document.createElement("td");
    emptyTd.className = "add-column-cell";
    tr.appendChild(emptyTd);
    body.appendChild(tr);
  }
}

function compactProjects(category) {
  state.projects[category] = (state.projects[category] || []).map((item) => String(item).trim()).filter(Boolean);
}

function editProjectCell(category, index, oldName, newName) {
  if (!state.projects[category]) state.projects[category] = [];
  oldName = String(oldName || "").trim();
  newName = String(newName || "").trim();

  if (oldName === newName) return;

  if (newName && state.projects[category].some((item, i) => item === newName && i !== index)) {
    alert(`The project "${newName}" already exists in the "${category}" column.`);
    renderProjects();
    return;
  }

  pushUndo();
  state.projects[category][index] = newName;
  compactProjects(category);

  if (oldName && !newName) {
    removeProjectReferences(category, oldName);
  }

  if (oldName && newName) {
    renameProjectReferences(category, oldName, newName);
  }

  saveState();
  render();
}

function addProject() {
  // Deprecated: projects are now inserted directly in the PROJECTS table.
}

function removeProjectReferences(category, project) {
  state.highlightedProjects = (state.highlightedProjects || []).filter((item) => item !== project);
  state.highlightedProjectCells = (state.highlightedProjectCells || []).filter((item) => item !== cellKey(category, project));

  const stillExists = getCategories().some((cat) =>
    cat !== category && (state.projects[cat] || []).includes(project)
  );

  days.forEach((day) => {
    allHours.forEach((hour) => {
      const value = state.schedule?.[day.key]?.[hour];
      if (value === projectValue(category, project)) {
        state.schedule[day.key][hour] = "";
      }
      if (!stillExists && value === project) {
        state.schedule[day.key][hour] = "";
      }
    });
  });
}

function renameProjectReferences(category, oldName, newName) {
  const oldKey = cellKey(category, oldName);
  const newKey = cellKey(category, newName);

  state.highlightedProjects = (state.highlightedProjects || []).map((item) => item === oldName ? newName : item);
  state.highlightedProjectCells = (state.highlightedProjectCells || []).map((item) => item === oldKey ? newKey : item);

  days.forEach((day) => {
    allHours.forEach((hour) => {
      const value = state.schedule?.[day.key]?.[hour];
      if (value === oldKey) state.schedule[day.key][hour] = newKey;
      if (value === oldName) state.schedule[day.key][hour] = newName;
    });
  });
}

function deleteProject(category, project) {
  pushUndo();
  state.projects[category] = (state.projects[category] || []).filter((item) => item !== project);
  removeProjectReferences(category, project);

  saveState();
  render();
}

function toggleProjectHighlight(category, project) {
  pushUndo();
  const key = cellKey(category, project);
  const highlighted = new Set(state.highlightedProjectCells || []);

  if (highlighted.has(key)) {
    highlighted.delete(key);
  } else {
    highlighted.add(key);
  }

  state.highlightedProjectCells = [...highlighted];
  saveState();
  renderProjects();
}

function addProjectColumn() {
  const raw = prompt("New project column name:");
  if (raw === null) return;

  const name = raw.trim().toUpperCase();
  if (!name) return;

  const categories = getCategories();
  if (categories.includes(name)) {
    alert(`The column "${name}" already exists.`);
    return;
  }

  pushUndo();
  state.projectColumns = [...categories, name];
  state.projects[name] = [];
  saveState();
  render();
}

function deleteProjectColumn(category) {
  const categories = getCategories();

  if (!category) return;
  if (categories.length <= 1) {
    alert("At least one project column must remain.");
    return;
  }

  const projectsToRemove = state.projects[category] || [];
  const message = projectsToRemove.length
    ? `Remove the "${category}" column and its ${projectsToRemove.length} projects? Weekly slots using projects that exist only in this column will be cleared.`
    : `Remove the "${category}" column?`;

  if (!confirm(message)) return;

  pushUndo();
  state.projectColumns = categories.filter((item) => item !== category);
  delete state.projects[category];

  state.highlightedProjectCells = (state.highlightedProjectCells || []).filter(
    (item) => !item.startsWith(`${category}::`)
  );

  const remainingProjects = new Set();
  state.projectColumns.forEach((column) => {
    (state.projects[column] || []).filter(Boolean).forEach((project) => {
      remainingProjects.add(project);
      remainingProjects.add(projectValue(column, project));
    });
  });

  days.forEach((day) => {
    allHours.forEach((hour) => {
      const selectedProject = state.schedule?.[day.key]?.[hour];
      if (selectedProject && !remainingProjects.has(selectedProject)) {
        state.schedule[day.key][hour] = "";
      }
    });
  });

  saveState();
  render();
}

function resetWeek() {
  if (!confirm("Clear the weekly planner only?")) return;
  pushUndo();
  state.schedule = Object.fromEntries(days.map((day) => [day.key, {}]));
  state.outOfOffice = Object.fromEntries(days.map((day) => [day.key, false]));
  saveState();
  render();
}

function resetAll() {
  if (!confirm("Clear all local data and restore an empty planner?")) return;
  pushUndo();
  state = clone(defaultState);
  saveState();
  render();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "week-planner-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      pushUndo();
      state = {
        ...clone(defaultState),
        ...imported,
        projects: { ...clone(defaultState).projects, ...(imported.projects || {}) },
        schedule: { ...clone(defaultState).schedule, ...(imported.schedule || {}) },
        outOfOffice: { ...clone(defaultState).outOfOffice, ...(imported.outOfOffice || {}) },
        projectColumns: getMergedProjectColumns(imported),
        highlightedProjectCells: imported.highlightedProjectCells || migrateHighlightedProjects(imported),
      };
      saveState();
      render();
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}


function openHowTo() {
  const modal = document.getElementById("howToModal");
  if (modal) modal.hidden = false;
}

function closeHowTo() {
  const modal = document.getElementById("howToModal");
  if (modal) modal.hidden = true;
}

document.getElementById("howToBtn").addEventListener("click", openHowTo);
document.getElementById("closeHowToBtn").addEventListener("click", closeHowTo);
document.getElementById("howToModal").addEventListener("click", (event) => {
  if (event.target.id === "howToModal") closeHowTo();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeHowTo();
});
document.getElementById("undoBtn").addEventListener("click", undoLastAction);
document.getElementById("exportBtn").addEventListener("click", exportJson);
document.getElementById("importInput").addEventListener("change", importJson);
document.getElementById("resetWeekBtn").addEventListener("click", resetWeek);
document.getElementById("resetAllBtn").addEventListener("click", resetAll);

render();
