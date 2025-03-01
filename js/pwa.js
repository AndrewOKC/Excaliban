/**
 * Progressive Web App functionality for Excaliban
 */

/**
 * Register the service worker for offline functionality
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    // Check for updates every time the page loads
                    registration.update();
                    
                    // When a new service worker is available
                    registration.onupdatefound = () => {
                        const newWorker = registration.installing;
                        
                        newWorker.onstatechange = () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New content is available, let's reload
                                if (confirm('New version of the app is available. Reload now?')) {
                                    window.location.reload();
                                }
                            }
                        };
                    };
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
        
        // Add event listener for manual refresh
        document.addEventListener('DOMContentLoaded', () => {
            // Handle cases where cache might be stale
            if (navigator.onLine) {
                window.applicationCache && window.applicationCache.update();
            }
        });
    }
}