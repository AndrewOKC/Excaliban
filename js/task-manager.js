/**
 * Task management functionality for the Excaliban app
 */
import { showNotification } from './utils.js';

let currentTask = null;
let currentEditTask = null;

/**
 * Add a new task to a column
 * @param {HTMLElement} columnElement - The column to add the task to
 * @param {HTMLTemplateElement} taskTemplate - The task template
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function addTask(columnElement, taskTemplate, saveBoardCallback) {
	const taskList = columnElement.querySelector('.task-list');
	const taskNode = taskTemplate.content.cloneNode(true);

	// Set default priority
	const taskElement = taskNode.querySelector('.task');
	taskElement.dataset.priority = 'medium';

	taskList.appendChild(taskNode);

	// Focus on the new task content
	const newTask = taskList.lastElementChild;
	const taskContent = newTask.querySelector('.task-content');
	taskContent.focus();

	// Select all text in the task
	const range = document.createRange();
	range.selectNodeContents(taskContent);
	const selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange(range);

	saveBoardCallback();
}

/**
 * Delete a task
 * @param {HTMLElement} taskElement - The task to delete
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function deleteTask(taskElement, saveBoardCallback) {
	taskElement.remove();
	saveBoardCallback();
	showNotification('Task deleted');
}

/**
 * Set up the task edit modal functionality
 * @param {HTMLElement} taskEditModal - The task edit modal element
 * @param {HTMLElement} editTaskForm - The task edit form
 * @param {NodeList} colorOptions - The small color options in the modal
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function setupTaskEditModal(taskEditModal, editTaskForm, colorOptions, saveBoardCallback) {
	// Event listeners for small color options in the edit modal
	colorOptions.forEach((option) => {
		option.style.backgroundColor = option.dataset.color;
		option.addEventListener('click', (e) => {
			// Remove selected class from all options
			colorOptions.forEach((opt) => opt.classList.remove('selected'));
			// Add selected class to clicked option
			option.classList.add('selected');
			// Set the hidden input value
			document.getElementById('edit-task-color').value = option.dataset.color;
		});
	});

	// Form submission handler
	editTaskForm.addEventListener('submit', (event) => {
		event.preventDefault();
		saveTaskEdit(taskEditModal, saveBoardCallback);
	});
}

/**
 * Open the task edit modal
 * @param {HTMLElement} taskEditModal - The task edit modal element
 * @param {HTMLElement} task - The task to edit
 * @param {NodeList} colorOptions - The small color options in the modal
 */
export function openTaskEditModal(taskEditModal, task, colorOptions) {
	currentEditTask = task;

	// Populate form with task data
	const editTaskTitle = document.getElementById('edit-task-title');
	const editTaskDescription = document.getElementById('edit-task-description');
	const editTaskPriority = document.getElementById('edit-task-priority');
	const editTaskDueDate = document.getElementById('edit-task-due-date');

	editTaskTitle.value = task.querySelector('.task-content').textContent;
	editTaskDescription.value = task.dataset.description || '';
	editTaskPriority.value = task.dataset.priority || 'medium';
	editTaskDueDate.value = task.dataset.dueDate || '';
	const taskColor = task.dataset.color || '#363c4a';
	document.getElementById('edit-task-color').value = taskColor;

	// Set the selected color in the color options
	colorOptions.forEach((option) => {
		option.classList.remove('selected');
		if (option.dataset.color === taskColor) {
			option.classList.add('selected');
		}
	});

	// Show modal
	taskEditModal.style.display = 'flex';
	taskEditModal.classList.add('visible');
	editTaskTitle.focus();
}

/**
 * Close the task edit modal
 * @param {HTMLElement} taskEditModal - The task edit modal element
 */
export function closeTaskEditModal(taskEditModal) {
	taskEditModal.classList.remove('visible');
	setTimeout(() => {
		taskEditModal.style.display = 'none';
	}, 300); // Match animation duration
	currentEditTask = null;
}

/**
 * Save the task edit
 * @param {HTMLElement} taskEditModal - The task edit modal element
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
function saveTaskEdit(taskEditModal, saveBoardCallback) {
	if (!currentEditTask) return;

	const editTaskTitle = document.getElementById('edit-task-title');
	const editTaskDescription = document.getElementById('edit-task-description');
	const editTaskPriority = document.getElementById('edit-task-priority');
	const editTaskDueDate = document.getElementById('edit-task-due-date');

	// Update task with form data
	currentEditTask.querySelector('.task-content').textContent = editTaskTitle.value;
	currentEditTask.dataset.description = editTaskDescription.value;
	currentEditTask.dataset.priority = editTaskPriority.value;
	currentEditTask.dataset.dueDate = editTaskDueDate.value;
	const newColor = document.getElementById('edit-task-color').value;
	currentEditTask.dataset.color = newColor;
	currentEditTask.style.background = newColor;

	// Update task priority indicator
	currentEditTask.setAttribute('data-priority', editTaskPriority.value);

	// Update due date display
	const dueDateElement = currentEditTask.querySelector('.task-due-date');
	if (editTaskDueDate.value) {
		const formattedDate = new Date(editTaskDueDate.value).toLocaleDateString();
		dueDateElement.textContent = formattedDate;

		// Check if date is overdue
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dueDate = new Date(editTaskDueDate.value);
		if (dueDate < today) {
			dueDateElement.classList.add('overdue');
		} else {
			dueDateElement.classList.remove('overdue');
		}
	} else {
		dueDateElement.textContent = '';
		dueDateElement.classList.remove('overdue');
	}

	// Show description indicator if needed
	if (editTaskDescription.value.trim()) {
		currentEditTask.classList.add('has-description');
	} else {
		currentEditTask.classList.remove('has-description');
	}

	// Save changes
	saveBoardCallback();
	closeTaskEditModal(taskEditModal);
	showNotification('Task updated');
}

/**
 * Search tasks based on the search term
 * @param {string} searchTerm - The term to search for
 */
export function searchTasks(searchTerm) {
	// Get all tasks
	const tasks = document.querySelectorAll('.task');

	if (searchTerm === '') {
		// Show all tasks if search is empty
		tasks.forEach((task) => {
			task.style.display = 'block';
		});
		return;
	}

	tasks.forEach((task) => {
		const content = task.querySelector('.task-content').textContent.toLowerCase();
		const description = task.dataset.description ? task.dataset.description.toLowerCase() : '';

		if (content.includes(searchTerm) || description.includes(searchTerm)) {
			task.style.display = 'block';
			// Highlight match
			task.classList.add('highlight');
			setTimeout(() => {
				task.classList.remove('highlight');
			}, 1500);
		} else {
			task.style.display = 'none';
		}
	});
}
