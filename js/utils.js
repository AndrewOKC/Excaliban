/**
 * Utility functions for the Excaliban app
 */

/**
 * Shows a notification to the user
 * @param {string} message - The message to display
 * @param {boolean} isError - Whether the notification is an error
 */
export function showNotification(message, isError = false) {
	const notification = document.getElementById('notification');
	notification.textContent = message;
	notification.classList.add('show');

	if (isError) {
		notification.style.borderColor = '#f28275';
	} else {
		notification.style.borderColor = '#6965db';
	}

	// Hide after 3 seconds
	setTimeout(() => {
		notification.classList.remove('show');
	}, 3000);
}
