/**
 * Main application file for Excaliban
 */
import { initializeBoards, saveBoard } from './storage.js';
import { setupDragAndDrop } from './drag-drop.js';
import { registerServiceWorker } from './pwa.js';
import { showNotification } from './utils.js';
import * as TaskManager from './task-manager.js';
import * as BoardManager from './board-manager.js';

// Register service worker for PWA functionality
registerServiceWorker();

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
    const cancelEditBtn = document.getElementById("cancel-edit");
    const modalCloseBtn = document.getElementById("modal-close");
    
    // Current active board
    let currentBoardId = initializeBoards();
    
    // Debounce timer for search
    let searchTimer = null;
    
    // Add keyboard event listener for ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            TaskManager.hideColorPicker(colorPicker);
            TaskManager.closeTaskEditModal(taskEditModal);
        }
    });
    
    // Hide elements initially
    colorPicker.style.display = "none";
    taskEditModal.style.display = "none";
    
    // Populate board dropdown
    BoardManager.populateBoardDropdown(boardDropdown, currentBoardId);
    
    // Save board wrapper function
    const saveBoardWrapper = () => {
        saveBoard(currentBoardId, board);
    };
    
    // Load board wrapper function
    const loadBoardWrapper = (boardId) => {
        currentBoardId = boardId;
        BoardManager.loadBoard(
            board, 
            currentBoardId, 
            columnTemplate, 
            taskTemplate, 
            boardDropdown, 
            saveBoardWrapper
        );
    };
    
    // Populate dropdown wrapper function
    const populateDropdownWrapper = () => {
        BoardManager.populateBoardDropdown(boardDropdown, currentBoardId);
    };
    
    // Load selected board
    loadBoardWrapper(currentBoardId);
    
    // Set up task edit modal
    TaskManager.setupTaskEditModal(
        taskEditModal, 
        taskEditForm, 
        colorOptionsSmall, 
        saveBoardWrapper
    );
    
    // Set up color picker
    TaskManager.setupColorPicker(
        colorPicker, 
        colorOptions, 
        saveBoardWrapper
    );

    // Set up drag and drop
    setupDragAndDrop(board, saveBoardWrapper);

    // Event listeners
    addColumnBtn.addEventListener("click", () => {
        BoardManager.addColumn(board, columnTemplate, saveBoardWrapper);
    });
    
    clearBoardBtn.addEventListener("click", () => {
        BoardManager.clearBoard(board, columnTemplate, saveBoardWrapper);
    });
    
    exportBoardBtn.addEventListener("click", BoardManager.exportBoard);
    
    importBoardBtn.addEventListener("click", () => {
        BoardManager.importBoard(loadBoardWrapper, populateDropdownWrapper);
    });
    
    // Board click event delegation
    board.addEventListener("click", (event) => {
        // Add task button clicked
        if (event.target.classList.contains("add-task")) {
            TaskManager.addTask(event.target.closest(".column"), taskTemplate, saveBoardWrapper);
        }

        // Delete task button clicked
        if (event.target.classList.contains("delete-task")) {
            TaskManager.deleteTask(event.target.closest(".task"), saveBoardWrapper);
        }

        // Delete column button clicked
        if (event.target.classList.contains("delete-column")) {
            BoardManager.deleteColumn(event.target.closest(".column"), saveBoardWrapper);
        }

        // Color task button clicked
        if (event.target.classList.contains("color-task")) {
            event.stopPropagation();
            TaskManager.showColorPicker(colorPicker, event.target);
        }
        
        // Edit task button clicked
        if (event.target.classList.contains("edit-task")) {
            event.stopPropagation();
            TaskManager.openTaskEditModal(taskEditModal, event.target.closest(".task"), colorOptionsSmall);
        }
    });
    
    // Save when a contenteditable element loses focus
    board.addEventListener("focusout", (event) => {
        if (
            event.target.classList.contains("task-content") ||
            event.target.classList.contains("column-title")
        ) {
            saveBoardWrapper();
        }
    });
    
    // Board dropdown change
    boardDropdown.addEventListener("change", (e) => {
        BoardManager.switchBoard(e.target.value, saveBoardWrapper, loadBoardWrapper);
    });
    
    // Board management buttons
    newBoardBtn.addEventListener("click", () => {
        BoardManager.createNewBoard(saveBoardWrapper, loadBoardWrapper, populateDropdownWrapper);
    });
    
    renameBoardBtn.addEventListener("click", () => {
        BoardManager.renameBoard(currentBoardId, populateDropdownWrapper);
    });
    
    deleteBoardBtn.addEventListener("click", () => {
        const newId = BoardManager.deleteBoard(
            currentBoardId, 
            loadBoardWrapper, 
            populateDropdownWrapper
        );
        if (newId) currentBoardId = newId;
    });
    
    // Search input
    searchInput.addEventListener("input", (e) => {
        // Debounce search
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            TaskManager.searchTasks(searchTerm);
        }, 300);
    });
    
    // Modal close buttons
    cancelEditBtn.addEventListener("click", () => {
        TaskManager.closeTaskEditModal(taskEditModal);
    });
    
    modalCloseBtn.addEventListener("click", () => {
        TaskManager.closeTaskEditModal(taskEditModal);
    });
});