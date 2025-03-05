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

/**
 * Sets a CSS custom property for viewport height that accounts for
 * mobile browser UI elements and orientation changes
 */
export function initViewportHeight() {
	function setMobileHeight() {
		// Get the actual inner height of the window and divide by 100
		// to get a value for 1vh unit
		let vh = window.innerHeight * 0.01;

		// Set the value as a CSS custom property
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}

	// Set initial height
	setMobileHeight();

	// Update on window resize
	window.addEventListener('resize', setMobileHeight);

	// Update on orientation change for mobile devices
	window.addEventListener('orientationchange', () => {
		// Small timeout to ensure the browser has completed any UI adjustments
		setTimeout(setMobileHeight, 100);
	});

	// Some mobile browsers need an update after page load is complete
	window.addEventListener('load', setMobileHeight);
}
