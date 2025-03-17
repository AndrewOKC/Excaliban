/**
 * Feedback functionality for Excaliban
 */

import { showNotification, getBrowserInfo } from "./utils.js";
import { APP_VERSION } from "./app.js";

/**
 * Initialize the feedback system
 */
export function initFeedback() {
    createFeedbackButton();
    createFeedbackModal();
    setupEventListeners();
}

/**
 * Create the feedback button
 */
function createFeedbackButton() {
    const button = document.createElement("button");
    button.id = "feedback-button";
    button.setAttribute("aria-label", "Give feedback");
    button.innerHTML = "🙋 Feedback";
    button.classList.add("secondary-button", "feedback-button");
    document.body.appendChild(button);
}

/**
 * Create the feedback modal
 */
function createFeedbackModal() {
    const modal = document.createElement("div");
    modal.id = "feedback-modal";
    modal.classList.add("modal");
    modal.style.display = "none";

    modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Share Your Feedback</h3>
        <span id="close-feedback-modal" class="close-task-edit-modal" aria-label="Close">&times;</span>
      </div>
      <div class="modal-body">
        <form id="feedback-form">
          <div class="form-group">
            <label for="feedback-message">Tell us about your experience:</label>
            <textarea id="feedback-message" rows="4" required></textarea>
          </div>
          <div class="form-actions">
            <button type="button" id="cancel-feedback-modal" class="secondary-button">Cancel</button>
            <button type="submit" id="submit-feedback" class="primary-button">Submit</button>
          </div>
        </form>
      </div>
    </div>
  `;

    document.body.appendChild(modal);
}

/**
 * Set up event listeners for the feedback system
 */
function setupEventListeners() {
    // Open modal
    document.getElementById("feedback-button").addEventListener("click", openFeedbackModal);

    // Close modal
    document.getElementById("close-feedback-modal").addEventListener("click", closeFeedbackModal);
    document.getElementById("cancel-feedback-modal").addEventListener("click", closeFeedbackModal);

    // Submit feedback
    document.getElementById("feedback-form").addEventListener("submit", handleFeedbackSubmit);
}

/**
 * Open the feedback modal
 */
function openFeedbackModal() {
    const modal = document.getElementById("feedback-modal");
    modal.style.display = "flex";
    modal.classList.add("visible");
}

/**
 * Close the feedback modal
 */
function closeFeedbackModal() {
    const modal = document.getElementById("feedback-modal");
    modal.classList.remove("visible");
    setTimeout(() => {
        modal.style.display = "none";
        document.getElementById("feedback-form").reset();
    }, 300);
}

/**
 * Handle feedback form submission
 * @param {Event} event - Form submission event
 */
async function handleFeedbackSubmit(event) {
    event.preventDefault();

    const message = document.getElementById("feedback-message").value.trim();
    if (!message) return;

    const browserInfo = getBrowserInfo();

    try {
        await submitFeedback(message);
        closeFeedbackModal();
        showNotification("Thank you for your feedback!");
    } catch (error) {
        console.error("Error submitting feedback:", error);
        showNotification("Failed to submit feedback. Please try again.", true);
    }
}

/**
 * Submit feedback to the API
 * @param {string} message - Feedback message
 * @returns {Promise} - API response
 */
async function submitFeedback(message) {
    const browserInfo = getBrowserInfo();

    const response = await fetch("https://api.excaliban.com/feedback", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: message,
            appVersion: APP_VERSION,
            browser: `${browserInfo.name} ${browserInfo.version}`,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to submit feedback");
    }

    return await response.json();
}
