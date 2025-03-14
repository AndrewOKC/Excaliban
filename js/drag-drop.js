/**
 * Drag and drop functionality for the Excaliban app
 * Provides support for both mouse and touch events with improved UX
 */

/**
 * Constants for drag and drop functionality
 */
const CONSTANTS = {
    THROTTLE_MS: 100, // Throttle time for dragover events (increased for better performance)
    AUTOSCROLL_THRESHOLD: 60, // Pixels from edge to trigger auto-scrolling
    AUTOSCROLL_SPEED: 10, // Auto-scroll speed in pixels per frame
    GHOST_OPACITY: 0.3, // Opacity value for the dragged item
    MOBILE_BREAKPOINT: 1250 // Breakpoint for disabling column drag on mobile
};

/**
 * Set up drag and drop for tasks
 * @param {HTMLElement} board - The board element
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function setupTaskDragAndDrop(board, saveBoardCallback) {
    let placeholder = null;
    let draggedTask = null;
    let autoScrollInterval = null;
    let touchTimeout = null;

    // Create an improved placeholder element for task drop that better represents the task
    function createPlaceholder(sourceTask) {
        const div = document.createElement("div");
        div.classList.add("task-drop-placeholder");
        
        // Match the height of the source task for better visual representation
        if (sourceTask) {
            const height = sourceTask.offsetHeight;
            div.style.height = `${height}px`;
        }
        
        return div;
    }

    // Remove any existing placeholder
    function removePlaceholder() {
        if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
        placeholder = null;
    }

    // Clear all drag related states
    function cleanupDragState() {
        removePlaceholder();
        stopAutoScroll();
        
        // Clean up all drag-over states
        document.querySelectorAll(".task-list.drag-over").forEach(el => {
            el.classList.remove("drag-over");
        });
        
        // Find and clean up any tasks that might still have dragging state
        document.querySelectorAll(".task.dragging").forEach(task => {
            task.classList.remove("dragging");
            // Also clear any inline styles that might have been added
            task.style.position = "";
            task.style.top = "";
            task.style.left = "";
            task.style.zIndex = "";
            task.style.opacity = "";
        });
        
        // Reset our tracked dragged task
        if (draggedTask) {
            draggedTask.classList.remove("dragging");
            draggedTask = null;
        }
    }

    // Start auto-scrolling when dragging near container edges
    function startAutoScroll(e, container) {
        stopAutoScroll(); // Clear any existing interval
        
        autoScrollInterval = setInterval(() => {
            const rect = container.getBoundingClientRect();
            const topDistance = e.clientY - rect.top;
            const bottomDistance = rect.bottom - e.clientY;
            
            // Scroll up or down depending on cursor position
            if (topDistance < CONSTANTS.AUTOSCROLL_THRESHOLD) {
                container.scrollTop -= CONSTANTS.AUTOSCROLL_SPEED;
            } else if (bottomDistance < CONSTANTS.AUTOSCROLL_THRESHOLD) {
                container.scrollTop += CONSTANTS.AUTOSCROLL_SPEED;
            }
        }, 16); // ~60fps for smooth scrolling
    }

    // Stop auto-scrolling
    function stopAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }

    // Event delegation for dynamically added elements
    board.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("task")) {
            draggedTask = e.target;
            e.target.classList.add("dragging");
            e.dataTransfer.setData("text/plain", "dragging-task");
            
            // Create ghost element for better visual feedback
            const rect = e.target.getBoundingClientRect();
            const ghostImage = e.target.cloneNode(true);
            
            // Apply styles to the ghost
            ghostImage.style.position = 'absolute';
            ghostImage.style.opacity = CONSTANTS.GHOST_OPACITY;
            ghostImage.style.pointerEvents = 'none';
            ghostImage.style.left = '-1000px';
            ghostImage.style.top = '0';
            ghostImage.style.width = `${rect.width}px`;
            ghostImage.style.height = `${rect.height}px`;
            
            document.body.appendChild(ghostImage);
            e.dataTransfer.setDragImage(ghostImage, rect.width / 2, rect.height / 2);
            
            // Remove ghost after drag starts
            setTimeout(() => {
                document.body.removeChild(ghostImage);
            }, 0);
            
            // Create placeholder based on the dragged task
            placeholder = createPlaceholder(e.target);
        }
    });

    board.addEventListener("dragend", (e) => {
        if (e.target.classList.contains("task")) {
            cleanupDragState();
            saveBoardCallback();
        }
    });

    // Throttle the dragover event to prevent excessive updates
    let lastDragOverTime = 0;

    board.addEventListener("dragover", (e) => {
        e.preventDefault();

        // Throttle updates to improve performance
        const now = Date.now();
        if (now - lastDragOverTime < CONSTANTS.THROTTLE_MS) {
            return;
        }
        lastDragOverTime = now;

        const draggingTask = draggedTask || document.querySelector(".task.dragging");
        if (!draggingTask) return;

        const taskList = e.target.closest(".task-list");
        if (taskList) {
            taskList.classList.add("drag-over");

            // Start auto-scrolling if near the edges
            startAutoScroll(e, taskList);

            // Create placeholder if it doesn't exist
            if (!placeholder) {
                placeholder = createPlaceholder(draggingTask);
            }

            // Find the closest task to drop position
            const afterElement = getDragAfterTask(taskList, e.clientY);

            // Position the placeholder - using requestAnimationFrame for smoother updates
            requestAnimationFrame(() => {
                // Add null check to prevent errors
                if (placeholder && placeholder.parentNode !== taskList) {
                    if (placeholder.parentNode) {
                        placeholder.parentNode.removeChild(placeholder);
                    }

                    if (afterElement) {
                        taskList.insertBefore(placeholder, afterElement);
                    } else {
                        taskList.appendChild(placeholder);
                    }
                } else if (afterElement && placeholder) {
                    // Move placeholder to new position only if needed
                    const nextElement = placeholder.nextElementSibling;
                    if (nextElement !== afterElement) {
                        taskList.insertBefore(placeholder, afterElement);
                    }
                } else if (placeholder && placeholder !== taskList.lastElementChild) {
                    taskList.appendChild(placeholder);
                }
            });
        } else {
            stopAutoScroll();
            // Only remove placeholder if we're not within any task list
            const board = e.target.closest(".board");
            const isInAnyTaskList = board ? !!board.querySelector(".task-list") : false;
            if (!isInAnyTaskList) {
                removePlaceholder();
            }
        }
    });

    board.addEventListener("dragleave", (e) => {
        const taskList = e.target.closest('.task-list');
        if (taskList && !taskList.contains(e.relatedTarget)) {
            taskList.classList.remove("drag-over");
            stopAutoScroll();
            
            // Only remove placeholder if we're actually leaving the task list
            // and not entering a child element
            if (!taskList.contains(e.relatedTarget)) {
                // Don't immediately remove to prevent flickering
                // This approach avoids premature placeholder removal
                setTimeout(() => {
                    // Double check that we're still not in this task list
                    const currentDragTarget = document.elementFromPoint(e.clientX, e.clientY);
                    if (currentDragTarget && !taskList.contains(currentDragTarget)) {
                        removePlaceholder();
                    }
                }, 50);
            }
        }
    });

    board.addEventListener("drop", (e) => {
        e.preventDefault();

        const taskList = e.target.closest(".task-list");
        if (taskList) {
            taskList.classList.remove("drag-over");
            const draggingTask = draggedTask || document.querySelector(".task.dragging");

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

                // Add a subtle animation when task is dropped
                draggingTask.classList.add("task-dropped");
                setTimeout(() => {
                    draggingTask.classList.remove("task-dropped");
                }, 300);

                cleanupDragState();
                saveBoardCallback();
            }
        }
    });

    // Add touch support for mobile devices
    board.addEventListener("touchstart", (e) => {
        const task = e.target.closest(".task");
        if (!task) return;
        
        // Don't trigger for buttons or editable content within tasks
        if (e.target.closest("button") || e.target.isContentEditable) return;

        // Clear previous touch timeout
        if (touchTimeout) clearTimeout(touchTimeout);
        
        // Set up the touch
        touchTimeout = setTimeout(() => {
            // Signal that we're dragging
            draggedTask = task;
            task.classList.add("dragging");
            
            // Add haptic feedback on supported devices
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // Create and position placeholder
            placeholder = createPlaceholder(task);
        }, 500); // 500ms is a good timing for long press
    });
    
    board.addEventListener("touchmove", (e) => {
        if (!draggedTask) return;
        // Only prevent default if we're actively dragging to allow normal scrolling
        if (draggedTask.classList.contains("dragging")) {
            e.preventDefault(); // Prevent scrolling while dragging
        }
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskList = element ? element.closest(".task-list") : null;
        
        if (taskList) {
            taskList.classList.add("drag-over");
            
            // Position the dragged task near the touch point
            draggedTask.style.position = "fixed";
            draggedTask.style.top = touch.clientY - draggedTask.offsetHeight / 2 + "px";
            draggedTask.style.left = touch.clientX - draggedTask.offsetWidth / 2 + "px";
            draggedTask.style.zIndex = "1000";
            draggedTask.style.opacity = "0.8";
            
            // Find position based on touch point
            const afterElement = getDragAfterTask(taskList, touch.clientY);
            
            // Position the placeholder
            if (placeholder) {
                if (placeholder.parentNode !== taskList) {
                    if (placeholder.parentNode) {
                        placeholder.parentNode.removeChild(placeholder);
                    }
                    
                    if (afterElement) {
                        taskList.insertBefore(placeholder, afterElement);
                    } else {
                        taskList.appendChild(placeholder);
                    }
                } else if (afterElement && placeholder) {
                    const nextElement = placeholder.nextElementSibling;
                    if (nextElement !== afterElement) {
                        taskList.insertBefore(placeholder, afterElement);
                    }
                } else if (placeholder && placeholder !== taskList.lastElementChild) {
                    taskList.appendChild(placeholder);
                }
            }
        }
    });
    
    board.addEventListener("touchend", (e) => {
        // Clear long press timeout
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
        
        if (!draggedTask) return;
        
        // Get final touch position
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskList = element ? element.closest(".task-list") : null;
        
        // Always reset the dragged task styling regardless of whether drop succeeded
        draggedTask.style.position = "";
        draggedTask.style.top = "";
        draggedTask.style.left = "";
        draggedTask.style.zIndex = "";
        draggedTask.style.opacity = "";
        
        if (taskList) {
            // Move the task to the placeholder position if available
            if (placeholder && placeholder.parentNode) {
                taskList.insertBefore(draggedTask, placeholder);
            } else {
                // Try to find a good position without placeholder
                const afterElement = getDragAfterTask(taskList, touch.clientY);
                if (afterElement) {
                    taskList.insertBefore(draggedTask, afterElement);
                } else {
                    taskList.appendChild(draggedTask);
                }
            }
            
            // Add a subtle animation when task is dropped
            draggedTask.classList.add("task-dropped");
            setTimeout(() => {
                draggedTask.classList.remove("task-dropped");
            }, 300);
        }
        
        // Always clean up completely, even if drop didn't succeed
        cleanupDragState();
        saveBoardCallback();
    });
    
    board.addEventListener("touchcancel", () => {
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
        
        cleanupDragState();
    });
}

/**
 * Set up drag and drop for columns
 * @param {HTMLElement} board - The board element
 * @param {Function} saveBoardCallback - Function to call when board is updated
 */
export function setupColumnDragAndDrop(board, saveBoardCallback) {
    // Check if we're on mobile - disable column drag on smaller screens
    const isMobileOrTablet = () => window.innerWidth <= CONSTANTS.MOBILE_BREAKPOINT;
    let autoScrollIntervalHorizontal = null;
    
    function startAutoScrollHorizontal(e) {
        stopAutoScrollHorizontal(); // Clear any existing interval
        
        autoScrollIntervalHorizontal = setInterval(() => {
            const rect = board.getBoundingClientRect();
            const leftDistance = e.clientX - rect.left;
            const rightDistance = rect.right - e.clientX;
            
            // Scroll left or right depending on cursor position
            if (leftDistance < CONSTANTS.AUTOSCROLL_THRESHOLD) {
                board.scrollLeft -= CONSTANTS.AUTOSCROLL_SPEED;
            } else if (rightDistance < CONSTANTS.AUTOSCROLL_THRESHOLD) {
                board.scrollLeft += CONSTANTS.AUTOSCROLL_SPEED;
            }
        }, 16); // ~60fps for smooth scrolling
    }
    
    function stopAutoScrollHorizontal() {
        if (autoScrollIntervalHorizontal) {
            clearInterval(autoScrollIntervalHorizontal);
            autoScrollIntervalHorizontal = null;
        }
    }

    // Event delegation for column drag operations
    board.addEventListener("dragstart", (e) => {
        const column = e.target.closest(".column");
        const task = e.target.closest(".task");
        
        // If this is a task being dragged, don't interfere
        if (task) return;
        
        // Only apply this to column dragging, not task dragging
        if (column && !task) {
            // Don't allow column drag on mobile
            if (isMobileOrTablet()) {
                // Only prevent default if we're not dragging a task
                if (!document.querySelector(".task.dragging")) {
                    e.preventDefault();
                }
                return;
            }
            
            // Prevent dragging when clicking on editable content or buttons
            if (e.target.isContentEditable || e.target.tagName === "BUTTON") {
                e.preventDefault();
                return;
            }
    
            if (!column.querySelector(".task.dragging")) {
                column.classList.add("dragging");
                e.dataTransfer.setData("text/plain", "dragging-column");
                
                // Set drag image to the column itself
                e.dataTransfer.setDragImage(column, 20, 20);
            }
        }
    });

    board.addEventListener("dragend", (e) => {
        const column = e.target.closest(".column");
        if (column && column.classList.contains("dragging")) {
            column.classList.remove("dragging");
            stopAutoScrollHorizontal();
            saveBoardCallback();
        }
    });

    // Throttle the dragover event for columns
    let lastColumnDragOverTime = 0;
    
    board.addEventListener("dragover", (e) => {
        e.preventDefault();
        
        // Throttle updates to improve performance
        const now = Date.now();
        if (now - lastColumnDragOverTime < CONSTANTS.THROTTLE_MS) {
            return;
        }
        lastColumnDragOverTime = now;
        
        const draggingColumn = board.querySelector(".column.dragging");

        if (draggingColumn) {
            // Start auto-scrolling when near board edges
            startAutoScrollHorizontal(e);
            
            // Only process column dragging if we're not dragging a task
            if (!board.querySelector(".task.dragging")) {
                const afterElement = getDragAfterColumn(board, e.clientX);

                if (afterElement && afterElement !== draggingColumn) {
                    // Determine if mouse is on the right side of the column
                    const rect = afterElement.getBoundingClientRect();
                    const afterMidpoint = rect.left + rect.width / 2;

                    requestAnimationFrame(() => {
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
                    });
                } else if (!afterElement && draggingColumn !== board.lastElementChild) {
                    board.appendChild(draggingColumn);
                }
            }
        }
    });
    
    board.addEventListener("dragleave", () => {
        stopAutoScrollHorizontal();
    });
    
    board.addEventListener("drop", () => {
        stopAutoScrollHorizontal();
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
    const draggableElements = [...container.querySelectorAll(".task:not(.dragging), .task-drop-placeholder")];

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