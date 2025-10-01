document.addEventListener('DOMContentLoaded', function() {
  if (typeof initializeNotificationSystem === 'function') {
    initializeNotificationSystem();
  }

  // Refresh badge when new student messages arrive
  window.addEventListener('storage', function(e) {
    if (e.key === 'lms_messages' || (e.key && e.key.startsWith('notifications_'))) {
      if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
      }
    }
  });
});


