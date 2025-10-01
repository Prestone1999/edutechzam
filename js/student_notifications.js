document.addEventListener('DOMContentLoaded', function() {
  if (typeof initializeNotificationSystem === 'function') {
    initializeNotificationSystem();
  }

  // Update badge on storage changes (e.g., when other tabs create notifications)
  window.addEventListener('storage', function(e) {
    if (e.key && e.key.startsWith('notifications_')) {
      if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
      }
    }
  });
});


