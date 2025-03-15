/**
 * Main application file for Excaliban
 */

// Application version - update when releasing new versions
export const APP_VERSION = "0.2.0";
export const SCHEMA_VERSION = "1.0";

import { initializeBoards, saveBoard } from "./storage.js";
import { setupTaskDragAndDrop, setupColumnDragAndDrop } from "./drag-drop.js";
import { registerServiceWorker } from "./pwa.js";
import { showNotification, initViewportHeight, getBrowserInfo } from "./utils.js";
import * as TaskManager from "./task-manager.js";
import * as BoardManager from "./board-manager.js";
import { initFeedback } from "./feedback.js";

// Register service worker for PWA functionality
registerServiceWorker();

// Initialize viewport height for mobile devices
initViewportHeight();

// Wait for DOM to be loaded before initializing feedback
document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const board = document.getElementById("board");
    const columnTemplate = document.getElementById("column-template");
    const taskTemplate = document.getElementById("task-template");
    const searchInput = document.getElementById("search-tasks");
    const boardDropdown = document.getElementById("board-dropdown");
    const taskEditModal = document.getElementById("task-edit-modal");
    const colorOptions = document.querySelectorAll(".color-option");
    const taskEditForm = document.getElementById("task-edit-form");

    // Current active board
    let currentBoardId = initializeBoards();

    // Debounce timer for search
    let searchTimer = null;

    // Edit Modal : Hide Initially
    taskEditModal.style.display = "none";

    // Board : Save Wrapper
    const saveBoardWrapper = () => {
        saveBoard(currentBoardId, board);
    };

    // Board : Load Wrapper
    const loadBoardWrapper = (boardId) => {
        currentBoardId = boardId;
        BoardManager.loadBoard(board, currentBoardId, columnTemplate, taskTemplate, boardDropdown, saveBoardWrapper);
    };

    // Board : Load Initial
    loadBoardWrapper(currentBoardId);
    
    // Initialize feedback component
    initFeedback();

    // Board Dropdown : Populate Wrapper
    const populateDropdownWrapper = () => {
        BoardManager.populateBoardDropdown(boardDropdown, currentBoardId);
    };

    // Board Dropdown : Populate
    BoardManager.populateBoardDropdown(boardDropdown, currentBoardId);

    // Board Dropdown : Handle Change
    boardDropdown.addEventListener("change", (e) => {
        BoardManager.switchBoard(e.target.value, saveBoardWrapper, loadBoardWrapper);
    });

    // Task Edit Modal : Setup
    TaskManager.setupTaskEditModal(taskEditModal, taskEditForm, colorOptions, saveBoardWrapper);

    // Drag and Drop Functionality : Setup
    setupTaskDragAndDrop(board, saveBoardWrapper);
    setupColumnDragAndDrop(board, saveBoardWrapper);

    // ContentEditable : Handle Focus Out (Saves Board on Exiting Editable Content)
    board.addEventListener("focusout", (event) => {
        if (event.target.classList.contains("task-content") || event.target.classList.contains("column-title")) {
            saveBoardWrapper();
        }
    });

    // Search : Handle Input
    searchInput.addEventListener("input", (e) => {
        // Debounce search
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            TaskManager.searchTasks(searchTerm);
        }, 300);
    });

    // ESC Key : Event Listener
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            TaskManager.closeTaskEditModal(taskEditModal);
        }
    });

    // Button Click : Event Listener (Using switch/case)
    document.addEventListener("click", (event) => {
        const targetId = event.target.id;

        switch (targetId) {
            // Board Management
            case "new-board":
                if (window.umami) umami.track("New Board");
                BoardManager.createNewBoard(saveBoardWrapper, loadBoardWrapper, populateDropdownWrapper);
                break;

            case "rename-board":
                if (window.umami) umami.track("Rename Board");
                BoardManager.renameBoard(currentBoardId, populateDropdownWrapper);
                break;

            case "delete-board":
                if (window.umami) umami.track("Delete Board");
                const newId = BoardManager.deleteBoard(currentBoardId, loadBoardWrapper, populateDropdownWrapper);
                if (newId) currentBoardId = newId;
                break;

            // Column Management
            case "add-column":
                if (window.umami) umami.track("Add Column");
                BoardManager.addColumn(board, columnTemplate, saveBoardWrapper);
                break;

            case "delete-column":
                if (window.umami) umami.track("Delete Column");
                BoardManager.deleteColumn(event.target.closest(".column"), saveBoardWrapper);
                break;

            case "clear-board":
                if (window.umami) umami.track("Clear Board");
                BoardManager.clearBoard(board, columnTemplate, saveBoardWrapper);
                break;

            // Task Management
            case "add-task":
                if (window.umami) umami.track("Add Task");
                TaskManager.addTask(event.target.closest(".column"), taskTemplate, saveBoardWrapper);
                break;

            case "edit-task":
                event.stopPropagation();
                if (window.umami) umami.track("Edit Task");
                TaskManager.openTaskEditModal(taskEditModal, event.target.closest(".task"), colorOptions);
                break;

            case "delete-task":
                if (window.umami) umami.track("Delete Task");
                TaskManager.deleteTask(event.target.closest(".task"), saveBoardWrapper);
                break;

            // Modal Controls
            case "close-edit-modal":
            case "cancel-edit-modal":
                TaskManager.closeTaskEditModal(taskEditModal);
                break;

            // Export/Import/Github
            case "export-board":
                if (window.umami) umami.track("Export Board");
                BoardManager.showExportModal();
                break;
                
            case "export-current":
                if (window.umami) umami.track("Export Current Board");
                BoardManager.exportBoard('current', currentBoardId);
                break;
                
            case "export-all":
                if (window.umami) umami.track("Export All Boards");
                BoardManager.exportBoard('all');
                break;
                
            case "close-export-modal":
                BoardManager.closeExportModal();
                break;

            case "import-board":
                if (window.umami) umami.track("Import Board");
                BoardManager.importBoard(loadBoardWrapper, populateDropdownWrapper);
                break;

            case "github":
                if (window.umami) umami.track("GitHub Link");
                window.location.href = "https://github.com/AndrewOKC/Excaliban";
                break;
        }
    });
});
