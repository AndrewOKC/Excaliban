/**
 * Board management functionality for the Excaliban app
 */
import { saveBoard, getAllBoards } from "./storage.js";
import { showNotification, formatISODateToUS } from "./utils.js";

/**
 * Add a new column to the board
 * @param {HTMLElement} board - The board element
 * @param {HTMLTemplateElement} columnTemplate - The column template
 * @param {Function} saveBoardCallback - Function to call after adding the column
 */
export function addColumn(board, columnTemplate, saveBoardCallback) {
    // Clone the template content
    const columnNode = columnTemplate.content.cloneNode(true);

    // Append the column to the board
    board.appendChild(columnNode);

    // Focus on the column title for immediate editing
    const columnTitle = board.lastElementChild.querySelector(".column-title");
    if (columnTitle) {
        columnTitle.focus();
        // Select all text in the title
        const range = document.createRange();
        range.selectNodeContents(columnTitle);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    saveBoardCallback();
}

/**
 * Delete a column from the board
 * @param {HTMLElement} columnElement - The column to delete
 * @param {Function} saveBoardCallback - Function to call after deleting the column
 */
export function deleteColumn(columnElement, saveBoardCallback) {
    if (confirm("Are you sure you want to delete this column and all its tasks?")) {
        columnElement.remove();
        saveBoardCallback();
        showNotification("Column deleted");
    }
}

/**
 * Clear the board and reset to default columns
 * @param {HTMLElement} board - The board element
 * @param {HTMLTemplateElement} columnTemplate - The column template
 * @param {Function} saveBoardCallback - Function to call after clearing the board
 */
export function clearBoard(board, columnTemplate, saveBoardCallback) {
    if (confirm("Are you sure you want to clear the entire board?")) {
        // Clear the board UI
        board.innerHTML = "";

        // Create default columns
        const defaultColumns = ["Backlog", "To Do", "In Progress", "Done"];
        defaultColumns.forEach((title) => {
            const columnNode = columnTemplate.content.cloneNode(true);
            const columnTitle = columnNode.querySelector(".column-title");
            columnTitle.textContent = title;
            board.appendChild(columnNode);
        });

        // Save the default board
        saveBoardCallback();
        showNotification("Board cleared");
    }
}

/**
 * Load a board from localStorage
 * @param {HTMLElement} board - The board element
 * @param {string} currentBoardId - The ID of the board to load
 * @param {HTMLTemplateElement} columnTemplate - The column template
 * @param {HTMLTemplateElement} taskTemplate - The task template
 * @param {HTMLSelectElement} boardDropdown - The board dropdown element
 * @param {Function} saveBoardCallback - Function to call if default board is created
 */
export function loadBoard(board, currentBoardId, columnTemplate, taskTemplate, boardDropdown, saveBoardCallback) {
    // Clear existing board first
    board.innerHTML = "";

    // Get all boards
    const boards = getAllBoards();
    const currentBoard = boards.find((board) => board.id === currentBoardId);

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
                taskContent.textContent = typeof task === "object" ? task.content : task;

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
                    const formattedDate = formatISODateToUS(task.dueDate);
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
        const defaultColumns = ["Backlog", "To Do", "In Progress", "Done"];
        defaultColumns.forEach((title) => {
            const columnNode = columnTemplate.content.cloneNode(true);
            const columnTitle = columnNode.querySelector(".column-title");
            columnTitle.textContent = title;
            board.appendChild(columnNode);
        });

        saveBoardCallback();
    }
}

/**
 * Populate the board dropdown with available boards
 * @param {HTMLSelectElement} boardDropdown - The board dropdown element
 * @param {string} currentBoardId - The ID of the current board
 */
export function populateBoardDropdown(boardDropdown, currentBoardId) {
    // Clear existing options
    boardDropdown.innerHTML = "";

    // Get all boards
    const boards = getAllBoards();

    // Add options for each board
    boards.forEach((board) => {
        const option = document.createElement("option");
        option.value = board.id;
        option.textContent = board.name;
        boardDropdown.appendChild(option);
    });

    // Set current board as selected
    boardDropdown.value = currentBoardId;
}

/**
 * Switch to a different board
 * @param {string} boardId - The ID of the board to switch to
 * @param {Function} saveBoardCallback - Function to save the current board before switching
 * @param {Function} loadBoardCallback - Function to load the new board
 */
export function switchBoard(boardId, saveBoardCallback, loadBoardCallback) {
    // Save current board before switching
    saveBoardCallback();

    // Load the selected board
    loadBoardCallback(boardId);
}

/**
 * Create a new board
 * @param {Function} saveBoardCallback - Function to save the current board before creating a new one
 * @param {Function} loadBoardCallback - Function to load the new board
 * @param {Function} populateDropdownCallback - Function to update the board dropdown
 * @returns {string|null} - The ID of the new board or null if cancelled
 */
export function createNewBoard(saveBoardCallback, loadBoardCallback, populateDropdownCallback) {
    const boardName = prompt("Enter a name for the new board:");

    if (boardName && boardName.trim() !== "") {
        // Save current board first
        saveBoardCallback();

        // Create new board with timestamp
        const timestamp = Date.now();
        const newBoard = {
            id: "board-" + timestamp,
            name: boardName.trim(),
            sourceType: "local",
            lastUpdated: timestamp,
            schemaVersion: "1.0",
            synced: false,
            meta: {
                favorite: false,
            },
            data: null,
        };

        // Get existing boards
        const boards = getAllBoards();

        // Add new board
        boards.push(newBoard);

        // Save boards
        localStorage.setItem("kanbanBoards", JSON.stringify(boards));

        // Update dropdown
        populateDropdownCallback();

        // Load empty board
        loadBoardCallback(newBoard.id);

        return newBoard.id;
    }

    return null;
}

/**
 * Rename the current board
 * @param {string} currentBoardId - The ID of the current board
 * @param {Function} populateDropdownCallback - Function to update the board dropdown
 */
export function renameBoard(currentBoardId, populateDropdownCallback) {
    const boards = getAllBoards();
    const currentBoard = boards.find((board) => board.id === currentBoardId);

    const newName = prompt("Enter a new name for this board:", currentBoard.name);

    if (newName && newName.trim() !== "") {
        // Update board name and lastUpdated timestamp
        currentBoard.name = newName.trim();
        currentBoard.lastUpdated = Date.now();

        // Save boards
        localStorage.setItem("kanbanBoards", JSON.stringify(boards));

        // Update dropdown
        populateDropdownCallback();
    }
}

/**
 * Delete the current board
 * @param {string} currentBoardId - The ID of the current board
 * @param {Function} loadBoardCallback - Function to load a different board
 * @param {Function} populateDropdownCallback - Function to update the board dropdown
 * @returns {string|null} - The ID of the new current board or null if cancelled
 */
export function deleteBoard(currentBoardId, loadBoardCallback, populateDropdownCallback) {
    const boards = getAllBoards();

    // Don't allow deleting the last board
    if (boards.length <= 1) {
        alert("Cannot delete the only board. Create a new board first.");
        return null;
    }

    if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
        // Find current board index
        const currentBoardIndex = boards.findIndex((board) => board.id === currentBoardId);

        // Remove current board
        boards.splice(currentBoardIndex, 1);

        // Save boards
        localStorage.setItem("kanbanBoards", JSON.stringify(boards));

        // Set new current board ID (previous board, or first if deleted first board)
        const newCurrentBoardId = boards[currentBoardIndex > 0 ? currentBoardIndex - 1 : 0].id;

        // Update dropdown
        populateDropdownCallback();

        // Load new current board
        loadBoardCallback(newCurrentBoardId);

        return newCurrentBoardId;
    }

    return null;
}

/**
 * Show the export modal
 */
export function showExportModal() {
    const exportModal = document.getElementById("export-modal");
    exportModal.style.display = "flex";
}

/**
 * Close the export modal
 */
export function closeExportModal() {
    const exportModal = document.getElementById("export-modal");
    exportModal.style.display = "none";
}

/**
 * Export boards to a JSON file
 * @param {string} exportType - 'current' for current board only, 'all' for all boards
 * @param {string} currentBoardId - ID of the current board
 */
export function exportBoard(exportType = "all", currentBoardId = null) {
    // Get all boards
    const boards = getAllBoards();
    let dataToExport;
    let filename;

    if (exportType === "current" && currentBoardId) {
        const currentBoard = boards.find((board) => board.id === currentBoardId);
        dataToExport = [currentBoard]; // Array with single board
        filename = `excaliban_board_${currentBoard.name.replace(/\s+/g, "_")}.json`;
    } else {
        dataToExport = boards;
        filename = "excaliban_all_boards.json";
    }

    // Create download file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    // Close the modal
    closeExportModal();

    showNotification(`Board${exportType === "all" ? "s" : ""} exported successfully`);
}

/**
 * Import boards from a JSON file
 * @param {Function} loadBoardCallback - Function to load the new board
 * @param {Function} populateDropdownCallback - Function to update the board dropdown
 */
export function importBoard(loadBoardCallback, populateDropdownCallback) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);

                // Validate imported data
                if (!Array.isArray(imported)) {
                    throw new Error("Invalid format");
                }

                // Get existing boards
                const existingBoards = getAllBoards();
                const existingNames = existingBoards.map((board) => board.name);

                // Process imported boards with new IDs and timestamps
                const timestamp = Date.now();
                const processedImported = imported.map((board, index) => {
                    // Create new ID to avoid conflicts
                    const newId = `board-${timestamp + index}`;

                    // Check for name conflicts and append "(Imported)" if needed
                    let newName = board.name;
                    if (existingNames.includes(newName)) {
                        newName = `${newName} (Imported)`;
                    }

                    // Return updated board
                    return {
                        ...board,
                        id: newId,
                        name: newName,
                        sourceType: "imported",
                        lastUpdated: timestamp,
                        schemaVersion: "1.0",
                        synced: false,
                        meta: {
                            favorite: false,
                            ...(board.meta || {}),
                        },
                    };
                });

                // Merge boards (add imported to existing)
                const mergedBoards = [...existingBoards, ...processedImported];

                // Save merged boards
                localStorage.setItem("kanbanBoards", JSON.stringify(mergedBoards));

                // Update dropdown
                populateDropdownCallback();

                // Load first imported board
                if (processedImported.length > 0) {
                    loadBoardCallback(processedImported[0].id);
                }

                showNotification(`${processedImported.length} board(s) imported successfully`);
            } catch (err) {
                showNotification("Error importing boards: " + err.message, true);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}
