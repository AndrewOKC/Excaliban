/**
 * Storage operations for the Excaliban app
 */

/**
 * Save the current board to localStorage
 * @param {string} currentBoardId - ID of the current board
 * @param {HTMLElement} board - The board element
 */
export function saveBoard(currentBoardId, board) {
	const boardData = {
		columns: [],
	};

	// Get all columns
	const columns = board.querySelectorAll('.column');
	columns.forEach((column) => {
		const columnTitle = column.querySelector('.column-title').textContent;
		const tasks = [];

		// Get all tasks in this column
		const taskElements = column.querySelectorAll('.task');
		taskElements.forEach((task) => {
			tasks.push({
				content: task.querySelector('.task-content').textContent,
				color: task.dataset.color || '#6965db',
				priority: task.dataset.priority || 'medium',
				description: task.dataset.description || '',
				dueDate: task.dataset.dueDate || '',
			});
		});

		boardData.columns.push({
			title: columnTitle,
			tasks: tasks,
		});
	});

	// Save to localStorage - update the current board in the boards collection
	const boards = JSON.parse(localStorage.getItem('kanbanBoards'));
	const currentBoard = boards.find((board) => board.id === currentBoardId);
	
	// Update board data and lastUpdated timestamp
	currentBoard.data = boardData;
	currentBoard.lastUpdated = Date.now();
	
	// Ensure all required schema fields exist
	if (!currentBoard.sourceType) currentBoard.sourceType = 'local';
	if (!currentBoard.schemaVersion) currentBoard.schemaVersion = '1.0';
	if (!currentBoard.synced) currentBoard.synced = false;
	if (!currentBoard.meta) currentBoard.meta = { favorite: false };
	else if (!currentBoard.meta.hasOwnProperty('favorite')) currentBoard.meta.favorite = false;

	localStorage.setItem('kanbanBoards', JSON.stringify(boards));
}

/**
 * Initialize boards in localStorage if they don't exist
 * @returns {string} - ID of the initial board
 */
export function initializeBoards() {
	if (!localStorage.getItem('kanbanBoards')) {
		const timestamp = Date.now();
		const initialBoard = {
			id: 'board-' + timestamp,
			name: 'My First Board',
			sourceType: 'local',
			lastUpdated: timestamp,
			schemaVersion: '1.0',
			synced: false,
			meta: {
				favorite: false
			},
			data: null,
		};

		localStorage.setItem('kanbanBoards', JSON.stringify([initialBoard]));
		return initialBoard.id;
	} else {
		// Get the first board as default
		const boards = JSON.parse(localStorage.getItem('kanbanBoards'));
		return boards[0].id;
	}
}

/**
 * Get all boards from localStorage
 * @returns {Array} - Array of board objects
 */
export function getAllBoards() {
	return JSON.parse(localStorage.getItem('kanbanBoards'));
}
