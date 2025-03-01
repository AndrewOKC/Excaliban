document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const board = document.getElementById("board");
    const addColumnBtn = document.getElementById("add-column");
    const clearBoardBtn = document.getElementById("clear-board");
    const columnTemplate = document.getElementById("column-template");
    const taskTemplate = document.getElementById("task-template");
    const colorPicker = document.getElementById("color-picker");
    const colorOptions = document.querySelectorAll(".color-option");

    // Current task being colored
    let currentTask = null;

    // Hide color picker initially
    colorPicker.style.display = "none";

    // Load board from localStorage
    loadBoard();

    // Event listeners
    addColumnBtn.addEventListener("click", addColumn);
    clearBoardBtn.addEventListener("click", clearBoard);
    board.addEventListener("click", handleBoardClick);
    board.addEventListener("focusout", handleContentEdit);

    // Color picker event listeners
    colorOptions.forEach((option) => {
        option.style.backgroundColor = option.dataset.color;
        option.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentTask) {
                const color = option.dataset.color;
                currentTask.style.background = color;
                currentTask.dataset.color = color;
                hideColorPicker();
                saveBoard();
            }
        });
    });

    // Close color picker when clicking outside
    document.addEventListener("click", (e) => {
        if (
            !e.target.closest(".color-task") &&
            !e.target.closest(".color-picker")
        ) {
            hideColorPicker();
        }
    });

    // Set up drag and drop
    setupDragAndDrop();

    // Functions
    function addColumn() {
        // Clone the template content
        const columnNode = columnTemplate.content.cloneNode(true);

        // Append the column to the board
        board.appendChild(columnNode);

        // Focus on the column title for immediate editing
        const columnTitle =
            board.lastElementChild.querySelector(".column-title");
        if (columnTitle) {
            columnTitle.focus();
            // Select all text in the title
            const range = document.createRange();
            range.selectNodeContents(columnTitle);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        saveBoard();
    }

    function addTask(columnElement) {
        const taskList = columnElement.querySelector(".task-list");
        const taskNode = taskTemplate.content.cloneNode(true);
        taskList.appendChild(taskNode);

        // Focus on the new task content
        const newTask = taskList.lastElementChild;
        const taskContent = newTask.querySelector(".task-content");
        taskContent.focus();

        // Select all text in the task
        const range = document.createRange();
        range.selectNodeContents(taskContent);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        saveBoard();
    }

    function handleBoardClick(event) {
        // Add task button clicked
        if (event.target.classList.contains("add-task")) {
            addTask(event.target.closest(".column"));
        }

        // Delete task button clicked
        if (event.target.classList.contains("delete-task")) {
            event.target.closest(".task").remove();
            saveBoard();
        }

        // Delete column button clicked
        if (event.target.classList.contains("delete-column")) {
            event.target.closest(".column").remove();
            saveBoard();
        }

        // Color task button clicked
        if (event.target.classList.contains("color-task")) {
            event.stopPropagation();
            currentTask = event.target.closest(".task");
            showColorPicker(event.target);
        }
    }

    function showColorPicker(buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        colorPicker.style.display = "flex";
        colorPicker.style.top = `${rect.bottom + window.scrollY + 5}px`;
        colorPicker.style.left = `${rect.left + window.scrollX - 120}px`; // Position to the left of the button
        colorPicker.classList.add("visible");
    }

    function hideColorPicker() {
        colorPicker.classList.remove("visible");
        colorPicker.style.display = "none";
        currentTask = null;
    }

    function handleContentEdit(event) {
        // Save when a contenteditable element loses focus
        if (
            event.target.classList.contains("task-content") ||
            event.target.classList.contains("column-title")
        ) {
            saveBoard();
        }
    }

    function setupDragAndDrop() {
        // Event delegation for dynamically added elements
        board.addEventListener("dragstart", (e) => {
            if (e.target.classList.contains("task")) {
                e.target.classList.add("dragging");
                e.dataTransfer.setData("text/plain", "dragging-task");
            }
        });

        board.addEventListener("dragend", (e) => {
            if (e.target.classList.contains("task")) {
                e.target.classList.remove("dragging");
                saveBoard();
            }
        });

        board.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (e.target.classList.contains("task-list")) {
                e.target.classList.add("drag-over");
            }
        });

        board.addEventListener("dragleave", (e) => {
            if (e.target.classList.contains("task-list")) {
                e.target.classList.remove("drag-over");
            }
        });

        board.addEventListener("drop", (e) => {
            e.preventDefault();

            const taskList = e.target.closest(".task-list");
            if (taskList) {
                taskList.classList.remove("drag-over");
                const draggingTask = document.querySelector(".task.dragging");

                if (draggingTask) {
                    // Find the closest task to drop position
                    const afterElement = getDragAfterElement(
                        taskList,
                        e.clientY
                    );

                    if (afterElement) {
                        taskList.insertBefore(draggingTask, afterElement);
                    } else {
                        taskList.appendChild(draggingTask);
                    }

                    saveBoard();
                }
            }
        });
    }

    function getDragAfterElement(container, y) {
        // Get all task elements that aren't currently being dragged
        const draggableElements = [
            ...container.querySelectorAll(".task:not(.dragging)"),
        ];

        // Find the task element that should come after the dragged element
        return draggableElements.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;

                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            { offset: Number.NEGATIVE_INFINITY }
        ).element;
    }

    function saveBoard() {
        const boardData = {
            columns: [],
        };

        // Get all columns
        const columns = board.querySelectorAll(".column");
        columns.forEach((column) => {
            const columnTitle =
                column.querySelector(".column-title").textContent;
            const tasks = [];

            // Get all tasks in this column
            const taskElements = column.querySelectorAll(".task");
            taskElements.forEach((task) => {
                tasks.push({
                    content: task.querySelector(".task-content").textContent,
                    color: task.dataset.color || "#6965db",
                });
            });

            boardData.columns.push({
                title: columnTitle,
                tasks: tasks,
            });
        });

        // Save to localStorage
        localStorage.setItem("kanbanBoard", JSON.stringify(boardData));
    }

    function loadBoard() {
        const savedBoard = localStorage.getItem("kanbanBoard");

        // Clear existing board first
        board.innerHTML = "";

        if (savedBoard) {
            const boardData = JSON.parse(savedBoard);

            // Recreate columns and tasks
            boardData.columns.forEach((column) => {
                // Create column
                const columnNode = columnTemplate.content.cloneNode(true);
                const columnTitle = columnNode.querySelector(".column-title");
                columnTitle.textContent = column.title;

                // Add tasks to column
                const taskList = columnNode.querySelector(".task-list");
                column.tasks.forEach((task) => {
                    const taskNode = taskTemplate.content.cloneNode(true);
                    const taskElement = taskNode.querySelector(".task");
                    const taskContent = taskNode.querySelector(".task-content");

                    // Set task content
                    taskContent.textContent =
                        typeof task === "object" ? task.content : task;

                    // Set task border color if available
                    if (typeof task === "object" && task.color) {
                        taskElement.style.background = task.color;
                        taskElement.dataset.color = task.color;
                    }

                    taskList.appendChild(taskNode);
                });

                board.appendChild(columnNode);
            });
        } else {
            // Create default columns for first-time users
            const defaultColumns = ["To Do", "In Progress", "Done"];
            defaultColumns.forEach((title) => {
                const columnNode = columnTemplate.content.cloneNode(true);
                const columnTitle = columnNode.querySelector(".column-title");
                columnTitle.textContent = title;
                board.appendChild(columnNode);
            });

            saveBoard();
        }
    }

    function clearBoard() {
        if (confirm("Are you sure you want to clear the entire board?")) {
            // Remove from localStorage
            localStorage.removeItem("kanbanBoard");

            // Clear the board UI
            board.innerHTML = "";

            // Create default columns
            const defaultColumns = ["To Do", "In Progress", "Done"];
            defaultColumns.forEach((title) => {
                const columnNode = columnTemplate.content.cloneNode(true);
                const columnTitle = columnNode.querySelector(".column-title");
                columnTitle.textContent = title;
                board.appendChild(columnNode);
            });

            // Save the default board
            saveBoard();
        }
    }
});
