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

/**
 * Formats an ISO date string to US format without timezone conversion
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date string (MM/DD/YYYY)
 */
export function formatISODateToUS(dateString) {
	const [year, month, day] = dateString.split('-');
	return `${month}/${day}/${year}`;
}

/**
 * Gets the user's browser information in a more readable format
 * @returns {Object} Object containing browser name and version
 */
export function getBrowserInfo() {
	const userAgent = navigator.userAgent;
	let browserName = 'Unknown';
	let browserVersion = 'Unknown';

	// Chrome, Edge (Chromium-based), Opera, Safari, Firefox detection
	if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1 && userAgent.indexOf('OPR') === -1) {
		browserName = 'Chrome';
		const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
		if (match) browserVersion = match[1];
	} else if (userAgent.indexOf('Edg') > -1) {
		browserName = 'Edge';
		const match = userAgent.match(/Edg\/(\d+\.\d+)/);
		if (match) browserVersion = match[1];
	} else if (userAgent.indexOf('OPR') > -1 || userAgent.indexOf('Opera') > -1) {
		browserName = 'Opera';
		const match = userAgent.match(/OPR\/(\d+\.\d+)/);
		if (match) browserVersion = match[1];
	} else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
		browserName = 'Safari';
		const match = userAgent.match(/Version\/(\d+\.\d+)/);
		if (match) browserVersion = match[1];
	} else if (userAgent.indexOf('Firefox') > -1) {
		browserName = 'Firefox';
		const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
		if (match) browserVersion = match[1];
	}

	return {
		name: browserName,
		version: browserVersion,
		userAgent: userAgent, // Include full UA string for debugging/fallback
	};
}
