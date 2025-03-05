/**
 * Main application file for Excaliban
 */
import { initializeBoards, saveBoard } from './storage.js';
import { setupDragAndDrop } from './drag-drop.js';
import { registerServiceWorker } from './pwa.js';
import { showNotification, initViewportHeight } from './utils.js';
import * as TaskManager from './task-manager.js';
import * as BoardManager from './board-manager.js';

// Register service worker for PWA functionality
registerServiceWorker();

// Initialize viewport height for mobile devices
initViewportHeight();

document.addEventListener('DOMContentLoaded', () => {
	// DOM elements
	const board = document.getElementById('board');
	const columnTemplate = document.getElementById('column-template');
	const taskTemplate = document.getElementById('task-template');
	const searchInput = document.getElementById('search-tasks');
	const boardDropdown = document.getElementById('board-dropdown');
	const taskEditModal = document.getElementById('task-edit-modal');
	const colorOptions = document.querySelectorAll('.color-option');
	const taskEditForm = document.getElementById('task-edit-form');

	// Current active board
	let currentBoardId = initializeBoards();

	// Debounce timer for search
	let searchTimer = null;

	// Edit Modal : Hide Initially
	taskEditModal.style.display = 'none';

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
	boardDropdown.addEventListener('change', (e) => {
		BoardManager.switchBoard(e.target.value, saveBoardWrapper, loadBoardWrapper);
	});

	// Task Edit Modal : Setup
	TaskManager.setupTaskEditModal(taskEditModal, taskEditForm, colorOptions, saveBoardWrapper);

	// Drag and Drop Functionality : Setup
	setupDragAndDrop(board, saveBoardWrapper);

	// ContentEditable : Handle Focus Out (Saves Board on Exiting Editable Content)
	board.addEventListener('focusout', (event) => {
		if (event.target.classList.contains('task-content') || event.target.classList.contains('column-title')) {
			saveBoardWrapper();
		}
	});

	// Search : Handle Input
	searchInput.addEventListener('input', (e) => {
		// Debounce search
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			const searchTerm = e.target.value.toLowerCase().trim();
			TaskManager.searchTasks(searchTerm);
		}, 300);
	});

	// ESC Key : Event Listener
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			TaskManager.closeTaskEditModal(taskEditModal);
		}
	});

	// Button Click : Event Listener
	document.addEventListener('click', (event) => {
		// Create new board button
		if (event.target.id === 'new-board') {
			BoardManager.createNewBoard(saveBoardWrapper, loadBoardWrapper, populateDropdownWrapper);
		}

		// Rename board button
		if (event.target.id === 'rename-board') {
			BoardManager.renameBoard(currentBoardId, populateDropdownWrapper);
		}

		// Delete board button
		if (event.target.id === 'delete-board') {
			const newId = BoardManager.deleteBoard(currentBoardId, loadBoardWrapper, populateDropdownWrapper);
			if (newId) currentBoardId = newId;
		}

		// Add column
		if (event.target.id === 'add-column') {
			BoardManager.addColumn(board, columnTemplate, saveBoardWrapper);
		}

		// Clear board button
		if (event.target.id === 'clear-board') {
			BoardManager.clearBoard(board, columnTemplate, saveBoardWrapper);
		}

		// Export board button
		if (event.target.id === 'export-board') {
			// Track export action with Umami
			if (window.umami) {
				umami.track('Export Board');
			}
			BoardManager.exportBoard();
		}

		// Import board button
		if (event.target.id === 'import-board') {
			// Track import action with Umami
			if (window.umami) {
				umami.track('Import Board');
			}
			BoardManager.importBoard(loadBoardWrapper, populateDropdownWrapper);
		}

		// GitHub button
		if (event.target.id === 'github') {
			// Track GitHub link click with Umami
			if (window.umami) {
				umami.track('GitHub Link');
			}
			window.location.href = 'https://github.com/AndrewOKC/Excaliban';
		}

		// Delete column button
		if (event.target.id === 'delete-column') {
			BoardManager.deleteColumn(event.target.closest('.column'), saveBoardWrapper);
		}

		// Add task button
		if (event.target.id === 'add-task') {
			TaskManager.addTask(event.target.closest('.column'), taskTemplate, saveBoardWrapper);
		}

		// Edit task button
		if (event.target.id === 'edit-task') {
			event.stopPropagation();
			TaskManager.openTaskEditModal(taskEditModal, event.target.closest('.task'), colorOptions);
		}

		// Delete task button
		if (event.target.id === 'delete-task') {
			TaskManager.deleteTask(event.target.closest('.task'), saveBoardWrapper);
		}

		// Close edit modal button
		if (event.target.id === 'close-edit-modal') {
			TaskManager.closeTaskEditModal(taskEditModal);
		}

		// Cancel edit modal button
		if (event.target.id === 'cancel-edit-modal') {
			TaskManager.closeTaskEditModal(taskEditModal);
		}
	});
});
