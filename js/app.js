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
	//
	const columnTemplate = document.getElementById('column-template');
	const taskTemplate = document.getElementById('task-template');
	//
	const searchInput = document.getElementById('search-tasks');
	//
	const boardDropdown = document.getElementById('board-dropdown');
	const newBoardBtn = document.getElementById('new-board');
	const renameBoardBtn = document.getElementById('rename-board');
	const deleteBoardBtn = document.getElementById('delete-board');
	//
	const taskEditModal = document.getElementById('task-edit-modal');
	const taskEditForm = document.getElementById('task-edit-form');
	const colorOptions = document.querySelectorAll('.color-option');
	const cancelEditBtn = document.getElementById('cancel-edit');
	const modalCloseBtn = document.getElementById('modal-close');

	// Current active board
	let currentBoardId = initializeBoards();

	// Debounce timer for search
	let searchTimer = null;

	// Hide elements initially
	taskEditModal.style.display = 'none';

	// Populate board dropdown
	BoardManager.populateBoardDropdown(boardDropdown, currentBoardId);

	// Save board wrapper function
	const saveBoardWrapper = () => {
		saveBoard(currentBoardId, board);
	};

	// Load board wrapper function
	const loadBoardWrapper = (boardId) => {
		currentBoardId = boardId;
		BoardManager.loadBoard(board, currentBoardId, columnTemplate, taskTemplate, boardDropdown, saveBoardWrapper);
	};

	// Populate dropdown wrapper function
	const populateDropdownWrapper = () => {
		BoardManager.populateBoardDropdown(boardDropdown, currentBoardId);
	};

	// Load selected board
	loadBoardWrapper(currentBoardId);

	// Set up task edit modal
	TaskManager.setupTaskEditModal(taskEditModal, taskEditForm, colorOptions, saveBoardWrapper);

	// Set up drag and drop
	setupDragAndDrop(board, saveBoardWrapper);

	// ESC key event listener
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			TaskManager.closeTaskEditModal(taskEditModal);
		}
	});

	// Button event listeners
	document.addEventListener('click', (event) => {
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

		// Delete column button
		if (event.target.id === 'delete-column') {
			BoardManager.deleteColumn(event.target.closest('.column'), saveBoardWrapper);
		}
	});

	// Save when a contenteditable element loses focus
	board.addEventListener('focusout', (event) => {
		if (event.target.classList.contains('task-content') || event.target.classList.contains('column-title')) {
			saveBoardWrapper();
		}
	});

	// Search input
	searchInput.addEventListener('input', (e) => {
		// Debounce search
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			const searchTerm = e.target.value.toLowerCase().trim();
			TaskManager.searchTasks(searchTerm);
		}, 300);
	});

	// Board dropdown change
	boardDropdown.addEventListener('change', (e) => {
		BoardManager.switchBoard(e.target.value, saveBoardWrapper, loadBoardWrapper);
	});

	// Board management buttons
	newBoardBtn.addEventListener('click', () => {
		BoardManager.createNewBoard(saveBoardWrapper, loadBoardWrapper, populateDropdownWrapper);
	});

	renameBoardBtn.addEventListener('click', () => {
		BoardManager.renameBoard(currentBoardId, populateDropdownWrapper);
	});

	deleteBoardBtn.addEventListener('click', () => {
		const newId = BoardManager.deleteBoard(currentBoardId, loadBoardWrapper, populateDropdownWrapper);
		if (newId) currentBoardId = newId;
	});

	// Modal close buttons
	cancelEditBtn.addEventListener('click', () => {
		TaskManager.closeTaskEditModal(taskEditModal);
	});

	modalCloseBtn.addEventListener('click', () => {
		TaskManager.closeTaskEditModal(taskEditModal);
	});
});
