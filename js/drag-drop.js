/**
 * Drag and drop functionality for the Excaliban app
 */

/**
 * Set up drag and drop for the board
 * @param {HTMLElement} board - The board element
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function setupDragAndDrop(board, saveBoardCallback) {
	// Event delegation for dynamically added elements
	board.addEventListener('dragstart', (e) => {
		if (e.target.classList.contains('task')) {
			e.target.classList.add('dragging');
			e.dataTransfer.setData('text/plain', 'dragging-task');
		}
	});

	board.addEventListener('dragend', (e) => {
		if (e.target.classList.contains('task')) {
			e.target.classList.remove('dragging');
			saveBoardCallback();
		}
	});

	board.addEventListener('dragover', (e) => {
		e.preventDefault();
		if (e.target.classList.contains('task-list')) {
			e.target.classList.add('drag-over');
		}
	});

	board.addEventListener('dragleave', (e) => {
		if (e.target.classList.contains('task-list')) {
			e.target.classList.remove('drag-over');
		}
	});

	board.addEventListener('drop', (e) => {
		e.preventDefault();

		const taskList = e.target.closest('.task-list');
		if (taskList) {
			taskList.classList.remove('drag-over');
			const draggingTask = document.querySelector('.task.dragging');

			if (draggingTask) {
				// Find the closest task to drop position
				const afterElement = getDragAfterElement(taskList, e.clientY);

				if (afterElement) {
					taskList.insertBefore(draggingTask, afterElement);
				} else {
					taskList.appendChild(draggingTask);
				}

				saveBoardCallback();
			}
		}
	});
}

/**
 * Helper function to determine where to drop the dragged task
 * @param {HTMLElement} container - The task list container
 * @param {number} y - The current Y position of the mouse
 * @returns {HTMLElement|undefined} - The element to insert before
 */
function getDragAfterElement(container, y) {
	// Get all task elements that aren't currently being dragged
	const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];

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
