// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                
                // Check for updates every time the page loads
                registration.update();
                
                // When a new service worker is available
                registration.onupdatefound = () => {
                    const newWorker = registration.installing;
                    
                    newWorker.onstatechange = () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available, let's reload
                            if (confirm('New version of the app is available. Reload now?')) {
                                window.location.reload();
                            }
                        }
                    };
                };
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
    
    // Add event listener for manual refresh
    document.addEventListener('DOMContentLoaded', () => {
        // Handle cases where cache might be stale
        if (navigator.onLine) {
            window.applicationCache && window.applicationCache.update();
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const board = document.getElementById("board");
    const addColumnBtn = document.getElementById("add-column");
    const clearBoardBtn = document.getElementById("clear-board");
    const exportBoardBtn = document.getElementById("export-board");
    const importBoardBtn = document.getElementById("import-board");
    const columnTemplate = document.getElementById("column-template");
    const taskTemplate = document.getElementById("task-template");
    const colorPicker = document.getElementById("color-picker");
    const colorOptions = document.querySelectorAll(".color-option");
    const colorOptionsSmall = document.querySelectorAll(".color-option-small");
    const boardDropdown = document.getElementById("board-dropdown");
    const newBoardBtn = document.getElementById("new-board");
    const renameBoardBtn = document.getElementById("rename-board");
    const deleteBoardBtn = document.getElementById("delete-board");
    const searchInput = document.getElementById("search-tasks");
    const taskEditModal = document.getElementById("task-edit-modal");
    const taskEditForm = document.getElementById("task-edit-form");
    const editTaskTitle = document.getElementById("edit-task-title");
    const editTaskDescription = document.getElementById("edit-task-description");
    const editTaskPriority = document.getElementById("edit-task-priority");
    const editTaskDueDate = document.getElementById("edit-task-due-date");
    const cancelEditBtn = document.getElementById("cancel-edit");
    const saveTaskEditBtn = document.getElementById("save-task-edit");
    const modalCloseBtn = document.getElementById("modal-close");
    const notification = document.getElementById("notification");

    // Current task being colored or edited
    let currentTask = null;
    let currentEditTask = null;
    
    // Current active board
    let currentBoardId = null;
    
    // Debounce timer for search
    let searchTimer = null;
    
    // Add keyboard event listener for ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideColorPicker();
            closeTaskEditModal();
        }
    });
    
    // Hide elements initially
    colorPicker.style.display = "none";
    taskEditModal.style.display = "none";
    
    // Initialize boards if they don't exist
    if (!localStorage.getItem("kanbanBoards")) {
        const initialBoard = {
            id: "board-" + Date.now(),
            name: "My First Board",
            data: null
        };
        
        localStorage.setItem("kanbanBoards", JSON.stringify([initialBoard]));
        currentBoardId = initialBoard.id;
    } else {
        // Get the first board as default
        const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
        currentBoardId = boards[0].id;
    }
    
    // Populate board dropdown
    populateBoardDropdown();
    
    // Load selected board
    loadBoard();

    // Event listeners
    addColumnBtn.addEventListener("click", addColumn);
    clearBoardBtn.addEventListener("click", clearBoard);
    exportBoardBtn.addEventListener("click", exportBoard);
    importBoardBtn.addEventListener("click", importBoard);
    board.addEventListener("click", handleBoardClick);
    board.addEventListener("focusout", handleContentEdit);
    boardDropdown.addEventListener("change", switchBoard);
    newBoardBtn.addEventListener("click", createNewBoard);
    renameBoardBtn.addEventListener("click", renameBoard);
    deleteBoardBtn.addEventListener("click", deleteBoard);
    searchInput.addEventListener("input", searchTasks);
    cancelEditBtn.addEventListener("click", closeTaskEditModal);
    modalCloseBtn.addEventListener("click", closeTaskEditModal);
    taskEditForm.addEventListener("submit", saveTaskEdit);

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
    
    // Event listeners for small color options in the edit modal
    colorOptionsSmall.forEach((option) => {
        option.style.backgroundColor = option.dataset.color;
        option.addEventListener("click", (e) => {
            // Remove selected class from all options
            colorOptionsSmall.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
            // Set the hidden input value
            document.getElementById('edit-task-color').value = option.dataset.color;
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
        
        // Set default priority
        const taskElement = taskNode.querySelector(".task");
        taskElement.dataset.priority = "medium";
        
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
            showNotification("Task deleted");
        }

        // Delete column button clicked
        if (event.target.classList.contains("delete-column")) {
            if (confirm("Are you sure you want to delete this column and all its tasks?")) {
                event.target.closest(".column").remove();
                saveBoard();
                showNotification("Column deleted");
            }
        }

        // Color task button clicked
        if (event.target.classList.contains("color-task")) {
            event.stopPropagation();
            currentTask = event.target.closest(".task");
            showColorPicker(event.target);
        }
        
        // Edit task button clicked
        if (event.target.classList.contains("edit-task")) {
            event.stopPropagation();
            currentEditTask = event.target.closest(".task");
            openTaskEditModal(currentEditTask);
        }
    }
    
    // Task edit functions
    function openTaskEditModal(task) {
        console.log("Opening modal for task:", task);
        
        // Populate form with task data
        editTaskTitle.value = task.querySelector(".task-content").textContent;
        editTaskDescription.value = task.dataset.description || "";
        editTaskPriority.value = task.dataset.priority || "medium";
        editTaskDueDate.value = task.dataset.dueDate || "";
        const taskColor = task.dataset.color || "#363c4a";
        document.getElementById('edit-task-color').value = taskColor;
        
        // Set the selected color in the color options
        colorOptionsSmall.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === taskColor) {
                option.classList.add('selected');
            }
        });
        
        // Show modal
        taskEditModal.style.display = "flex";
        taskEditModal.classList.add("visible");
        editTaskTitle.focus();
    }
    
    function closeTaskEditModal() {
        taskEditModal.classList.remove("visible");
        setTimeout(() => {
            taskEditModal.style.display = "none";
        }, 300); // Match animation duration
        currentEditTask = null;
    }
    
    function saveTaskEdit(event) {
        event.preventDefault();
        
        if (currentEditTask) {
            console.log("Saving task edit:", currentEditTask);
            
            // Update task with form data
            currentEditTask.querySelector(".task-content").textContent = editTaskTitle.value;
            currentEditTask.dataset.description = editTaskDescription.value;
            currentEditTask.dataset.priority = editTaskPriority.value;
            currentEditTask.dataset.dueDate = editTaskDueDate.value;
            const newColor = document.getElementById('edit-task-color').value;
            currentEditTask.dataset.color = newColor;
            currentEditTask.style.background = newColor;
            
            // Update task priority indicator
            currentEditTask.setAttribute("data-priority", editTaskPriority.value);
            
            // Update due date display
            const dueDateElement = currentEditTask.querySelector(".task-due-date");
            if (editTaskDueDate.value) {
                const formattedDate = new Date(editTaskDueDate.value).toLocaleDateString();
                dueDateElement.textContent = formattedDate;
                
                // Check if date is overdue
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(editTaskDueDate.value);
                if (dueDate < today) {
                    dueDateElement.classList.add("overdue");
                } else {
                    dueDateElement.classList.remove("overdue");
                }
            } else {
                dueDateElement.textContent = "";
                dueDateElement.classList.remove("overdue");
            }
            
            // Show description indicator if needed
            if (editTaskDescription.value.trim()) {
                currentEditTask.classList.add("has-description");
            } else {
                currentEditTask.classList.remove("has-description");
            }
            
            // Save changes
            saveBoard();
            closeTaskEditModal();
            showNotification("Task updated");
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

    // Board management functions
    function populateBoardDropdown() {
        // Clear existing options
        boardDropdown.innerHTML = "";
        
        // Get all boards
        const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
        
        // Add options for each board
        boards.forEach(board => {
            const option = document.createElement("option");
            option.value = board.id;
            option.textContent = board.name;
            boardDropdown.appendChild(option);
        });
        
        // Set current board as selected
        boardDropdown.value = currentBoardId;
    }
    
    function switchBoard(e) {
        // Save current board before switching
        saveBoard();
        
        // Update current board ID
        currentBoardId = e.target.value;
        
        // Load the selected board
        loadBoard();
    }
    
    function createNewBoard() {
        const boardName = prompt("Enter a name for the new board:");
        
        if (boardName && boardName.trim() !== "") {
            // Save current board first
            saveBoard();
            
            // Create new board
            const newBoard = {
                id: "board-" + Date.now(),
                name: boardName.trim(),
                data: null
            };
            
            // Get existing boards
            const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
            
            // Add new board
            boards.push(newBoard);
            
            // Save boards
            localStorage.setItem("kanbanBoards", JSON.stringify(boards));
            
            // Update current board ID
            currentBoardId = newBoard.id;
            
            // Update dropdown
            populateBoardDropdown();
            
            // Load empty board
            loadBoard();
        }
    }
    
    function renameBoard() {
        const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
        const currentBoard = boards.find(board => board.id === currentBoardId);
        
        const newName = prompt("Enter a new name for this board:", currentBoard.name);
        
        if (newName && newName.trim() !== "") {
            // Update board name
            currentBoard.name = newName.trim();
            
            // Save boards
            localStorage.setItem("kanbanBoards", JSON.stringify(boards));
            
            // Update dropdown
            populateBoardDropdown();
        }
    }
    
    function deleteBoard() {
        const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
        
        // Don't allow deleting the last board
        if (boards.length <= 1) {
            alert("Cannot delete the only board. Create a new board first.");
            return;
        }
        
        if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
            // Find current board index
            const currentBoardIndex = boards.findIndex(board => board.id === currentBoardId);
            
            // Remove current board
            boards.splice(currentBoardIndex, 1);
            
            // Save boards
            localStorage.setItem("kanbanBoards", JSON.stringify(boards));
            
            // Set new current board ID (previous board, or first if deleted first board)
            currentBoardId = boards[currentBoardIndex > 0 ? currentBoardIndex - 1 : 0].id;
            
            // Update dropdown
            populateBoardDropdown();
            
            // Load new current board
            loadBoard();
        }
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
                    priority: task.dataset.priority || "medium",
                    description: task.dataset.description || "",
                    dueDate: task.dataset.dueDate || ""
                });
            });

            boardData.columns.push({
                title: columnTitle,
                tasks: tasks,
            });
        });

        // Save to localStorage - update the current board in the boards collection
        const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
        const currentBoard = boards.find(board => board.id === currentBoardId);
        currentBoard.data = boardData;
        
        localStorage.setItem("kanbanBoards", JSON.stringify(boards));
    }

    function loadBoard() {
        // Clear existing board first
        board.innerHTML = "";

        // Get all boards
        const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
        const currentBoard = boards.find(board => board.id === currentBoardId);
        
        // Update the dropdown selection
        boardDropdown.value = currentBoardId;
        
        if (currentBoard.data) {
            const boardData = currentBoard.data;

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
                    
                    // Set task priority if available
                    if (typeof task === "object" && task.priority) {
                        taskElement.dataset.priority = task.priority;
                    }
                    
                    // Set task description if available
                    if (typeof task === "object" && task.description) {
                        taskElement.dataset.description = task.description;
                        taskElement.classList.add("has-description");
                    }
                    
                    // Set task due date if available
                    if (typeof task === "object" && task.dueDate) {
                        taskElement.dataset.dueDate = task.dueDate;
                        const dueDateElement = taskNode.querySelector(".task-due-date");
                        const formattedDate = new Date(task.dueDate).toLocaleDateString();
                        dueDateElement.textContent = formattedDate;
                        
                        // Check if date is overdue
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dueDate = new Date(task.dueDate);
                        if (dueDate < today) {
                            dueDateElement.classList.add("overdue");
                        }
                    }

                    taskList.appendChild(taskNode);
                });

                board.appendChild(columnNode);
            });
        } else {
            // Create default columns for first-time users
            const defaultColumns = ["Blocked", "To Do", "In Progress", "Done"];
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
            // Clear the board UI
            board.innerHTML = "";

            // Create default columns
            const defaultColumns = ["Blocked", "To Do", "In Progress", "Done"];
            defaultColumns.forEach((title) => {
                const columnNode = columnTemplate.content.cloneNode(true);
                const columnTitle = columnNode.querySelector(".column-title");
                columnTitle.textContent = title;
                board.appendChild(columnNode);
            });

            // Save the default board
            saveBoard();
            showNotification("Board cleared");
        }
    }
    
    // Search functionality
    function searchTasks(e) {
        // Debounce search
        clearTimeout(searchTimer);
        
        searchTimer = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Get all tasks
            const tasks = document.querySelectorAll(".task");
            
            if (searchTerm === "") {
                // Show all tasks if search is empty
                tasks.forEach(task => {
                    task.style.display = "block";
                });
                return;
            }
            
            tasks.forEach(task => {
                const content = task.querySelector(".task-content").textContent.toLowerCase();
                const description = task.dataset.description ? task.dataset.description.toLowerCase() : "";
                
                if (content.includes(searchTerm) || description.includes(searchTerm)) {
                    task.style.display = "block";
                    // Highlight match
                    task.classList.add("highlight");
                    setTimeout(() => {
                        task.classList.remove("highlight");
                    }, 1500);
                } else {
                    task.style.display = "none";
                }
            });
        }, 300);
    }
    
    // Export and import functionality
    function exportBoard() {
        // Get all boards
        const boards = JSON.parse(localStorage.getItem("kanbanBoards"));
        
        // Create a download file
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(boards));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "excaliban_boards.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        showNotification("Boards exported successfully");
    }
    
    function importBoard() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            
            if (!file) {
                return;
            }
            
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const imported = JSON.parse(event.target.result);
                    
                    // Validate imported data
                    if (!Array.isArray(imported)) {
                        throw new Error("Invalid format");
                    }
                    
                    // Store imported boards
                    localStorage.setItem("kanbanBoards", JSON.stringify(imported));
                    
                    // Update current board ID and reload
                    currentBoardId = imported[0].id;
                    
                    // Update dropdown
                    populateBoardDropdown();
                    
                    // Load selected board
                    loadBoard();
                    
                    showNotification("Boards imported successfully");
                } catch (err) {
                    showNotification("Error importing boards: " + err.message, true);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // Helper functions
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.classList.add("show");
        
        if (isError) {
            notification.style.borderColor = "#f28275";
        } else {
            notification.style.borderColor = "#6965db";
        }
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
    }
});
