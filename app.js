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
const defaultCategories = ["INAIL", "TOV", "TEACHING", "BUROCRAZIA", "PERSONAL"];

const defaultState = {
  projects: {
    INAIL: ["Codice Coclea", "Progetto con Lollo"],
    TOV: ["Plasmi", "TLBFIND3D", "SmartHEART"],
    TEACHING: ["Lezioni Fis. Comp.", "Stage Lorenzo"],
    BUROCRAZIA: [],
    PERSONAL: ["Studia Drug Delivery", "Applicativo progetti", "BUSY"],
  },
  schedule: {
    monday: { "9": "SmartHEART", "14": "Plasmi" },
    tuesday: { "9": "Studia Drug Delivery", "14": "Codice Coclea" },
    wednesday: { "9": "SmartHEART", "14": "BUSY" },
    thursday: { "9": "Lezioni Fis. Comp.", "14": "Applicativo progetti" },
    friday: {},
  },
  outOfOffice: {
    monday: true,
    tuesday: false,
    wednesday: true,
    thursday: false,
    friday: false,
  },
  projectColumns: [...defaultCategories],
  highlightedProjects: ["Codice Coclea", "Plasmi", "TLBFIND3D", "SmartHEART"],
  highlightedProjectCells: [
    "INAIL::Codice Coclea",
    "TOV::Plasmi",
    "TOV::TLBFIND3D",
    "TOV::SmartHEART",
  ],
};

let state = loadState();

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

function render() {
  renderSchedule();
  renderCategorySelect();
  renderDeleteColumnSelect();
  renderProjects();
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
  label.textContent = "FUORI SEDE";
  outRow.appendChild(label);

  days.forEach((day) => {
    const td = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "out-checkbox";
    checkbox.checked = Boolean(state.outOfOffice[day.key]);
    checkbox.addEventListener("change", () => {
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

  const projectList = getProjectList();

  days.forEach((day) => {
    const td = document.createElement("td");
    if (state.outOfOffice[day.key]) td.classList.add("out-of-office");

    const select = document.createElement("select");
    select.className = "slot-select";
    select.dataset.day = day.key;
    select.dataset.hour = hour;

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "";
    select.appendChild(empty);

    projectList.forEach((project) => {
      const option = document.createElement("option");
      option.value = project;
      option.textContent = project;
      select.appendChild(option);
    });

    const value = state.schedule?.[day.key]?.[hour] || "";
    select.value = projectList.includes(value) ? value : "";

    select.addEventListener("change", () => {
      if (!state.schedule[day.key]) state.schedule[day.key] = {};
      state.schedule[day.key][hour] = select.value;
      saveState();
    });

    td.appendChild(select);
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
    title.className = "column-title editable-column-title";
    title.contentEditable = "true";
    title.spellcheck = false;
    title.textContent = category;
    title.dataset.original = category;
    title.title = "Edit column name";

    title.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        title.blur();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        title.textContent = title.dataset.original || "";
        title.blur();
      }
    });

    title.addEventListener("blur", () => {
      renameProjectColumn(title.dataset.original || "", title.textContent.trim());
    });

    th.appendChild(title);

    const del = document.createElement("button");
    del.className = "delete-column";
    del.title = `Rimuovi colonna ${category}`;
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
  addButton.title = "Aggiungi colonna progetto";
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

      const editor = document.createElement("div");
      editor.className = "editable-project";
      editor.contentEditable = "true";
      editor.spellcheck = false;
      editor.dataset.category = category;
      editor.dataset.index = String(i);
      editor.dataset.original = project;
      editor.textContent = project;
      editor.title = project ? "Modifica progetto. Ctrl/Cmd-click evidenzia in giallo." : "Scrivi un nuovo progetto";

      editor.addEventListener("click", (event) => {
        if ((event.ctrlKey || event.metaKey) && project) {
          event.preventDefault();
          event.stopPropagation();
          toggleProjectHighlight(category, project);
        }
      });

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
        del.title = "Elimina progetto";
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
    alert(`Il progetto "${newName}" esiste già nella colonna "${category}".`);
    renderProjects();
    return;
  }

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

  if (!stillExists) {
    days.forEach((day) => {
      allHours.forEach((hour) => {
        if (state.schedule?.[day.key]?.[hour] === project) state.schedule[day.key][hour] = "";
      });
    });
  }
}

function renameProjectReferences(category, oldName, newName) {
  const oldKey = cellKey(category, oldName);
  const newKey = cellKey(category, newName);

  state.highlightedProjects = (state.highlightedProjects || []).map((item) => item === oldName ? newName : item);
  state.highlightedProjectCells = (state.highlightedProjectCells || []).map((item) => item === oldKey ? newKey : item);

  days.forEach((day) => {
    allHours.forEach((hour) => {
      if (state.schedule?.[day.key]?.[hour] === oldName) state.schedule[day.key][hour] = newName;
    });
  });
}

function deleteProject(category, project) {
  const used = days.some((day) => allHours.some((hour) => state.schedule?.[day.key]?.[hour] === project));
  const message = used
    ? `Il progetto "${project}" è usato nella settimana. Eliminarlo comunque? Verrà rimosso dagli slot se non esiste in altre colonne.`
    : `Eliminare "${project}"?`;

  if (!confirm(message)) return;

  state.projects[category] = (state.projects[category] || []).filter((item) => item !== project);
  removeProjectReferences(category, project);

  saveState();
  render();
}

function toggleProjectHighlight(category, project) {
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
  const raw = prompt("Nome nuova colonna progetto:");
  if (raw === null) return;

  const name = raw.trim().toUpperCase();
  if (!name) return;

  const categories = getCategories();
  if (categories.includes(name)) {
    alert(`La colonna "${name}" esiste già.`);
    return;
  }

  state.projectColumns = [...categories, name];
  state.projects[name] = [];
  saveState();
  render();
}

function renameProjectColumn(oldName, newName) {
  oldName = String(oldName || "").trim();
  newName = String(newName || "").trim().toUpperCase();

  if (!oldName || !newName || oldName === newName) {
    renderProjects();
    return;
  }

  const categories = getCategories();
  if (categories.includes(newName)) {
    alert(`La colonna "${newName}" esiste già.`);
    renderProjects();
    return;
  }

  const oldProjects = state.projects[oldName] || [];

  state.projectColumns = categories.map((category) =>
    category === oldName ? newName : category
  );

  state.projects[newName] = oldProjects;
  delete state.projects[oldName];

  state.highlightedProjectCells = (state.highlightedProjectCells || []).map((item) => {
    if (!item.startsWith(`${oldName}::`)) return item;
    return item.replace(`${oldName}::`, `${newName}::`);
  });

  saveState();
  render();
}

function deleteProjectColumn(category) {
  const categories = getCategories();

  if (!category) return;
  if (categories.length <= 1) {
    alert("Deve rimanere almeno una colonna progetto.");
    return;
  }

  const projectsToRemove = state.projects[category] || [];
  const message = projectsToRemove.length
    ? `Rimuovere la colonna "${category}" e i suoi ${projectsToRemove.length} progetti? Gli slot settimanali che usano progetti presenti solo in questa colonna verranno svuotati.`
    : `Rimuovere la colonna "${category}"?`;

  if (!confirm(message)) return;

  state.projectColumns = categories.filter((item) => item !== category);
  delete state.projects[category];

  state.highlightedProjectCells = (state.highlightedProjectCells || []).filter(
    (item) => !item.startsWith(`${category}::`)
  );

  const remainingProjects = new Set(
    state.projectColumns.flatMap((column) => state.projects[column] || []).filter(Boolean)
  );

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
  if (!confirm("Cancellare solo la pianificazione settimanale?")) return;
  state.schedule = Object.fromEntries(days.map((day) => [day.key, {}]));
  state.outOfOffice = Object.fromEntries(days.map((day) => [day.key, false]));
  saveState();
  render();
}

function resetAll() {
  if (!confirm("Cancellare tutti i dati locali e ripristinare l'esempio iniziale?")) return;
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
      alert("File JSON non valido.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

document.getElementById("exportBtn").addEventListener("click", exportJson);
document.getElementById("importInput").addEventListener("change", importJson);
document.getElementById("resetWeekBtn").addEventListener("click", resetWeek);
document.getElementById("resetAllBtn").addEventListener("click", resetAll);

render();
