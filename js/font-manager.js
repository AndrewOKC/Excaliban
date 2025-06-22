/**
 * Font Manager Module
 * Handles font selection and switching functionality for Excaliban
 */

// Available fonts configuration
const AVAILABLE_FONTS = [
    { id: 'virgil', name: 'Virgil (Default)', variable: '--font-virgil' },
    { id: 'comic', name: 'Comic Shanns', variable: '--font-comic' },
    { id: 'nunito', name: 'Nunito Sans', variable: '--font-nunito' }
];

const STORAGE_KEY = 'selectedFont';

/**
 * Populates the font dropdown with available font options
 */
function populateFontDropdown() {
    const fontDropdown = document.getElementById('font-dropdown');
    
    if (!fontDropdown) {
        console.warn('Font dropdown element not found');
        return;
    }

    // Clear existing options
    fontDropdown.innerHTML = '';

    // Add font options
    AVAILABLE_FONTS.forEach(font => {
        const option = document.createElement('option');
        option.value = font.id;
        option.textContent = font.name;
        fontDropdown.appendChild(option);
    });

    // Set current selection based on saved preference
    const savedFont = loadFontSettings();
    if (savedFont) {
        fontDropdown.value = savedFont;
    }
}

/**
 * Changes the active font family
 * @param {string} fontId - The ID of the font to activate
 */
function changeFontFamily(fontId) {
    const font = AVAILABLE_FONTS.find(f => f.id === fontId);
    
    if (!font) {
        console.warn(`Font with ID "${fontId}" not found`);
        return;
    }

    // Get the CSS variable value for the selected font
    const fontVariable = getComputedStyle(document.documentElement)
        .getPropertyValue(font.variable);

    // Update the primary font CSS variable
    document.documentElement.style.setProperty('--font-primary', fontVariable);

    // Save the preference
    saveFontSettings(fontId);

    console.log(`Font changed to: ${font.name}`);
}

/**
 * Saves font preference to localStorage
 * @param {string} fontId - The ID of the font to save
 */
function saveFontSettings(fontId) {
    try {
        localStorage.setItem(STORAGE_KEY, fontId);
    } catch (error) {
        console.warn('Failed to save font settings:', error);
    }
}

/**
 * Loads font preference from localStorage
 * @returns {string|null} The saved font ID or null if none saved
 */
function loadFontSettings() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to load font settings:', error);
        return null;
    }
}

/**
 * Initializes the font management system
 */
function initializeFontManager() {
    // Populate the dropdown
    populateFontDropdown();

    // Load and apply saved font preference
    const savedFont = loadFontSettings();
    if (savedFont) {
        changeFontFamily(savedFont);
    }

    // Add event listener for font dropdown changes
    const fontDropdown = document.getElementById('font-dropdown');
    if (fontDropdown) {
        fontDropdown.addEventListener('change', (event) => {
            changeFontFamily(event.target.value);
        });
    }

    console.log('Font manager initialized');
}

// Export functions for use in other modules
export {
    populateFontDropdown,
    changeFontFamily,
    saveFontSettings,
    loadFontSettings,
    initializeFontManager,
    AVAILABLE_FONTS
};