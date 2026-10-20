
const STORAGE_KEY = "taskflow-todos";

const initialTodos = [
    {
        id: 1,
        text: "Pray ishaa #deen",
        done: false
    },
    {
        id: 2,
        text: "Eat healthy #health",
        done: false
    },
    {
        id: 3,
        text: "Go gym #fitness #health",
        done: false
    }
];

function loadTodos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === null) {
            return initialTodos;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            return initialTodos;
        }

        return parsed.filter(todo =>
            todo &&
            (typeof todo.id === "string" ||
                typeof todo.id === "number") &&
            typeof todo.text === "string" &&
            typeof todo.done === "boolean"
        );
    } catch {
        return initialTodos;
    }
}

const state = {
    todos: loadTodos(),
    filter: "",
    select: "all",
    search: ""
};

const elements = {
    form: document.querySelector("#todo-form"),
    input: document.querySelector("#todo-input"),
    search: document.querySelector("#search"),
    select: document.querySelector("#select"),
    todos: document.querySelector("#todos"),
    total: document.querySelector("#total-count"),
    completed: document.querySelector("#completed-count"),
    remaining: document.querySelector("#remaining-count"),
    visibleCount: document.querySelector("#visible-count"),
    emptyState: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyDescription: document.querySelector("#empty-description"),
    activeFilter: document.querySelector("#active-filter"),
    filterDescription: document.querySelector("#filter-description"),
    clearFilter: document.querySelector("#clear-filter"),
    clearCompleted: document.querySelector("#clear-completed"),
    progressText: document.querySelector("#progress-text"),
    progressBar: document.querySelector("#progress-bar")
};

function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
    } catch (error) {
        console.error("Could not save tasks:", error);
    }
}

function parseTags(text) {
    return [
        ...new Set(
            text.match(/#[\p{L}\p{N}_-]+/gu) || []
        )
    ];
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function getVisibleTodos() {
    return state.todos.filter(todo => {
        const matchesTag =
            !state.filter || parseTags(todo.text).includes(state.filter);

        const matchesStatus =
            state.select === "all" ||
            (state.select === "completed" && todo.done) ||
            (state.select === "uncompleted" && !todo.done);

        const query = state.search.trim().toLowerCase();

        const matchesSearch =
            !query || todo.text.toLowerCase().includes(query);

        return matchesTag && matchesStatus && matchesSearch;
    });
}

function renderStats() {
    const total = state.todos.length;
    const completed = state.todos.filter(todo => todo.done).length;
    const remaining = total - completed;
    const percentage = total
        ? Math.round((completed / total) * 100)
        : 0;

    elements.total.textContent = total;
    elements.completed.textContent = completed;
    elements.remaining.textContent = remaining;

    elements.progressText.textContent = `${percentage}% completed`;
    elements.progressBar.style.width = `${percentage}%`;
    elements.progressBar.setAttribute("role", "progressbar");
    elements.progressBar.setAttribute("aria-valuemin", "0");
    elements.progressBar.setAttribute("aria-valuemax", "100");
    elements.progressBar.setAttribute("aria-valuenow", percentage);

    elements.clearCompleted.disabled = completed === 0;
    elements.clearCompleted.style.opacity = completed === 0 ? "0.5" : "1";
}

function renderTodo(todo) {
    const li = createElement(
        "li",
        `todo-item${todo.done ? " done" : ""}`
    );

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-check";
    checkbox.checked = todo.done;
    checkbox.setAttribute(
        "aria-label",
        `Mark "${todo.text}" as ${todo.done ? "uncompleted" : "completed"}`
    );

    checkbox.addEventListener("change", () => {
        todo.done = checkbox.checked;
        saveTodos();
        render();
    });

    const content = createElement("div", "todo-content");
    const text = createElement("div", "todo-text", todo.text);

    content.appendChild(text);

    const tags = parseTags(todo.text);

    if (tags.length) {
        const tagContainer = createElement("div", "todo-tags");

        tags.forEach(tag => {
            const button = createElement("button", "tag", tag);
            button.type = "button";
            button.setAttribute("aria-pressed", String(state.filter === tag));

            if (state.filter === tag) {
                button.classList.add("active");
            }

            button.setAttribute("aria-label", `Filter by ${tag}`);

            button.addEventListener("click", () => {
                state.filter = state.filter === tag ? "" : tag;
                render();
            });

            tagContainer.appendChild(button);
        });

        content.appendChild(tagContainer);
    }

    const deleteButton = createElement("button", "delete-button", "×");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete task: ${todo.text}`);
    deleteButton.title = "Delete task";

    deleteButton.addEventListener("click", () => {
        state.todos = state.todos.filter(item => item.id !== todo.id);
        saveTodos();
        render();
    });

    li.append(checkbox, content, deleteButton);

    return li;
}

function render() {
    const visibleTodos = getVisibleTodos();

    elements.todos.replaceChildren(
        ...visibleTodos.map(renderTodo)
    );

    renderStats();

    elements.visibleCount.textContent =
        `${visibleTodos.length} ${visibleTodos.length === 1 ? "task" : "tasks"}`;

    const noTasksAtAll = state.todos.length === 0;

    elements.emptyState.hidden = visibleTodos.length !== 0;

    if (noTasksAtAll) {
        elements.emptyTitle.textContent = "No tasks yet";
        elements.emptyDescription.textContent =
            "Add your first task and get started!";
    } else {
        elements.emptyTitle.textContent = "No matching tasks";
        elements.emptyDescription.textContent =
            "Try changing your search or filters.";
    }

    const filtersActive =
        Boolean(state.filter) ||
        state.select !== "all" ||
        Boolean(state.search.trim());

    elements.activeFilter.hidden = !filtersActive;

    if (filtersActive) {
        const descriptions = [];

        if (state.filter) {
            descriptions.push(`Tag: ${state.filter}`);
        }

        if (state.select !== "all") {
            descriptions.push(
                state.select === "completed"
                    ? "Completed"
                    : "Uncompleted"
            );
        }

        if (state.search.trim()) {
            descriptions.push(`Search: "${state.search.trim()}"`);
        }

        elements.filterDescription.textContent =
            `Active filters: ${descriptions.join(" · ")}`;
    }
}

function addTodo(text) {
    const trimmedText = text.trim();

    if (!trimmedText) {
        return;
    }

    state.todos.unshift({
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        text: trimmedText,
        done: false
    });

    saveTodos();
    render();
}

elements.form.addEventListener("submit", event => {
    event.preventDefault();

    const text = elements.input.value;

    if (!text.trim()) {
        elements.input.focus();
        return;
    }

    addTodo(text);

    elements.input.value = "";
    elements.input.focus();
});

elements.search.addEventListener("input", event => {
    state.search = event.target.value;
    render();
});

elements.select.addEventListener("change", event => {
    state.select = event.target.value;
    render();
});

elements.clearFilter.addEventListener("click", () => {
    state.filter = "";
    state.select = "all";
    state.search = "";

    elements.select.value = "all";
    elements.search.value = "";

    render();
});

elements.clearCompleted.addEventListener("click", () => {
    state.todos = state.todos.filter(todo => !todo.done);

    saveTodos();
    render();
});

render();