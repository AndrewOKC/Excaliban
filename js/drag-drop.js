/**
 * Drag and drop functionality for the Excaliban app
 */

/**
 * Set up drag and drop for the board
 * @param {HTMLElement} board - The board element
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function setupTaskDragAndDrop(board, saveBoardCallback) {
    let placeholder = null;

    // Create placeholder element for task drop
    function createPlaceholder() {
        const div = document.createElement("div");
        div.classList.add("task-drop-placeholder");
        return div;
    }

    // Remove any existing placeholder
    function removePlaceholder() {
        if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
        placeholder = null;
    }

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
            removePlaceholder();
            saveBoardCallback();
        }
    });

    // Throttle the dragover event to prevent excessive updates
    let lastDragOverTime = 0;
    const throttleMs = 100; // Only process every 50ms

    board.addEventListener("dragover", (e) => {
        e.preventDefault();

        // Throttle updates to improve performance
        const now = Date.now();
        if (now - lastDragOverTime < throttleMs) {
            return;
        }
        lastDragOverTime = now;

        const draggingTask = document.querySelector(".task.dragging");
        if (!draggingTask) return;

        const taskList = e.target.closest(".task-list");
        if (taskList) {
            taskList.classList.add("drag-over");

            // Create placeholder if it doesn't exist
            if (!placeholder) {
                placeholder = createPlaceholder();
            }

            // Find the closest task to drop position
            const afterElement = getDragAfterTask(taskList, e.clientY);

            // Position the placeholder
            if (placeholder.parentNode !== taskList) {
                if (placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }

                if (afterElement) {
                    taskList.insertBefore(placeholder, afterElement);
                } else {
                    taskList.appendChild(placeholder);
                }
            } else if (afterElement) {
                // Move placeholder to new position only if needed
                const nextElement = placeholder.nextElementSibling;
                if (nextElement !== afterElement) {
                    taskList.insertBefore(placeholder, afterElement);
                }
            } else if (placeholder !== taskList.lastElementChild) {
                taskList.appendChild(placeholder);
            }
        } else {
            removePlaceholder();
        }
    });

    board.addEventListener("dragleave", (e) => {
        if (e.target.classList.contains("task-list") && !e.target.contains(e.relatedTarget)) {
            e.target.classList.remove("drag-over");
            // Only remove placeholder if we're actually leaving the task list
            if (!e.target.contains(e.relatedTarget)) {
                removePlaceholder();
            }
        }
    });

    board.addEventListener("drop", (e) => {
        e.preventDefault();

        const taskList = e.target.closest(".task-list");
        if (taskList) {
            taskList.classList.remove("drag-over");
            const draggingTask = document.querySelector(".task.dragging");

            if (draggingTask) {
                // Insert at placeholder position
                if (placeholder && placeholder.parentNode) {
                    taskList.insertBefore(draggingTask, placeholder);
                    removePlaceholder();
                } else {
                    // Fallback to original logic
                    const afterElement = getDragAfterTask(taskList, e.clientY);
                    if (afterElement) {
                        taskList.insertBefore(draggingTask, afterElement);
                    } else {
                        taskList.appendChild(draggingTask);
                    }
                }

                saveBoardCallback();
            }
        }
    });
}

/**
 * Set up drag and drop for columns
 * @param {HTMLElement} board - The board element
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function setupColumnDragAndDrop(board, saveBoardCallback) {
    // Event delegation for column drag operations
    board.addEventListener("dragstart", (e) => {
        // Prevent dragging when clicking on editable content or buttons
        if (e.target.isContentEditable || e.target.tagName === "BUTTON") {
            e.preventDefault();
            return;
        }

        // Finds the closest column to the target
        const column = e.target.closest(".column");

        // Checks if Column exists and makes sure that element being dragged is not a task
        if (column && !column.querySelector(".task.dragging")) {
            // Add dragging class to the column
            column.classList.add("dragging");

            // Set drag image to follow the cursor
            e.dataTransfer.setDragImage(column, 20, 20);
        }
    });

    board.addEventListener("dragend", (e) => {
        const column = e.target.closest(".column");
        if (column && column.classList.contains("dragging")) {
            column.classList.remove("dragging");
            saveBoardCallback();
        }
    });

    board.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggingColumn = board.querySelector(".column.dragging");

        if (draggingColumn) {
            // Only process column dragging if we're not dragging a task
            if (!board.querySelector(".task.dragging")) {
                const afterElement = getDragAfterColumn(board, e.clientX);

                if (afterElement && afterElement !== draggingColumn) {
                    // Determine if mouse is on the right side of the column
                    const rect = afterElement.getBoundingClientRect();
                    const afterMidpoint = rect.left + rect.width / 2;

                    if (e.clientX < afterMidpoint) {
                        board.insertBefore(draggingColumn, afterElement);
                    } else {
                        const nextElement = afterElement.nextElementSibling;
                        if (nextElement) {
                            board.insertBefore(draggingColumn, nextElement);
                        } else {
                            board.appendChild(draggingColumn);
                        }
                    }
                } else if (!afterElement && draggingColumn !== board.lastElementChild) {
                    board.appendChild(draggingColumn);
                }
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
function getDragAfterTask(container, y) {
    // Get all task elements that aren't currently being dragged
    const draggableElements = [...container.querySelectorAll(".task:not(.dragging)")];

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

/**
 * Helper function to determine where to drop the dragged column
 * @param {HTMLElement} container - The board container
 * @param {number} x - The current X position of the mouse
 * @returns {HTMLElement|undefined} - The element to insert before
 */
function getDragAfterColumn(container, x) {
    // Get all column elements that aren't currently being dragged
    const draggableElements = [...container.querySelectorAll(".column:not(.dragging)")];

    if (draggableElements.length === 0) return undefined;

    // Find the column element that should come after the dragged element
    return draggableElements.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}
