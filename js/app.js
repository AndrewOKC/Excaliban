/**
 * Main application file for Excaliban
 */

// Application version and schema version
export const APP_VERSION = "0.3.3";
export const SCHEMA_VERSION = "1.0";

import { initBoards, saveBoard } from "./storage.js";
import { setupTaskDragAndDrop, setupColumnDragAndDrop } from "./drag-drop.js";
import { initServiceWorker } from "./pwa.js";
import { initViewportHeight } from "./utils.js";
import * as TaskManager from "./task-manager.js";
import * as BoardManager from "./board-manager.js";
import { initFeedback } from "./feedback.js";

// Wait for DOM to be loaded before initializing feedback
document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const board = document.getElementById("board");
    const columnTemplate = document.getElementById("column-template");
    const taskTemplate = document.getElementById("task-template");
    const searchInputMobile = document.getElementById("search-tasks-mobile");
    const searchInputDesktop = document.getElementById("search-tasks-tablet-desktop");
    const taskEditModal = document.getElementById("task-edit-modal");
    const taskEditForm = document.getElementById("task-edit-form");
    const colorOptions = document.querySelectorAll(".color-option");
    const menuButton = document.getElementById("menu-button");
    const dropdownMenu = document.getElementById("dropdown-menu");
    const boardDropdown = document.getElementById("board-dropdown");

    // Initializers
    initServiceWorker();
    initViewportHeight();
    initFeedback();

    // Current active board
    let currentBoardId = initBoards();

    // Debounce timer for search
    let searchTimer = null;

    // Helper function for search input event handling
    const handleSearchInput = (e) => {
        // Debounce search
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();

            // Sync the other search input value
            if (e.target === searchInputMobile) {
                searchInputDesktop.value = searchTerm;
            } else {
                searchInputMobile.value = searchTerm;
            }

            TaskManager.searchTasks(searchTerm);
        }, 300);
    };

    // Search : Handle Input for both search fields
    searchInputMobile.addEventListener("input", handleSearchInput);
    searchInputDesktop.addEventListener("input", handleSearchInput);

    // Dropdown Menu Toggle
    menuButton.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");

        // Toggle menu button appearance (optional - can be hamburger to X animation)
        const menuLines = menuButton.querySelectorAll(".menu-line");
        menuLines.forEach((line) => line.classList.toggle("active"));
    });

    // Close menu when clicking elsewhere
    document.addEventListener("click", (e) => {
        if (!dropdownMenu.contains(e.target) && e.target !== menuButton) {
            dropdownMenu.classList.remove("show");

            // Reset menu button appearance
            const menuLines = menuButton.querySelectorAll(".menu-line");
            menuLines.forEach((line) => line.classList.remove("active"));
        }
    });

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

    // ESC Key : Event Listener
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            TaskManager.closeTaskEditModal(taskEditModal);
        }
    });

    // Button Click : Event Listener (Using switch/case)
    document.addEventListener("click", (event) => {
        // Get the clicked element or its closest parent with an ID
        const target = event.target;
        const targetElement = target.id ? target : target.closest("[id]");
        const targetId = targetElement ? targetElement.id : "";

        switch (targetId) {
            // Menu Board Management
            case "menu-new-board":
                if (window.umami) umami.track("New Board");
                BoardManager.createNewBoard(saveBoardWrapper, loadBoardWrapper, populateDropdownWrapper);
                dropdownMenu.classList.remove("show");
                break;

            case "menu-rename-board":
                if (window.umami) umami.track("Rename Board");
                BoardManager.renameBoard(currentBoardId, populateDropdownWrapper);
                dropdownMenu.classList.remove("show");
                break;

            case "menu-delete-board":
                if (window.umami) umami.track("Delete Board");
                const newId = BoardManager.deleteBoard(currentBoardId, loadBoardWrapper, populateDropdownWrapper);
                if (newId) currentBoardId = newId;
                dropdownMenu.classList.remove("show");
                break;

            // Menu Export/Import
            case "menu-import":
                if (window.umami) umami.track("Import Board");
                BoardManager.importBoard(loadBoardWrapper, populateDropdownWrapper);
                dropdownMenu.classList.remove("show");
                break;

            case "menu-export":
                if (window.umami) umami.track("Export Board");
                BoardManager.showExportModal();
                break;

            // Export Modal
            case "export-modal-current":
                if (window.umami) umami.track("Export Current Board");
                BoardManager.exportBoard("current", currentBoardId);
                break;

            case "export-modal-all":
                if (window.umami) umami.track("Export All Boards");
                BoardManager.exportBoard("all");
                break;

            case "export-modal-close":
                BoardManager.closeExportModal();
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
            case "close-task-edit-modal":
            case "cancel-task-edit-modal":
                TaskManager.closeTaskEditModal(taskEditModal);
                break;

            // Github Links
            case "github":
                if (window.umami) umami.track("GitHub Link");
                window.location.href = "https://github.com/AndrewOKC/Excaliban";
                break;
        }
    });
});
