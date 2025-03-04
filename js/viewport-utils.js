/**
 * Viewport utilities for handling mobile browser inconsistencies
 */

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
