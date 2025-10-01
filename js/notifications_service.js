// Notification Service: shared across student and teacher dashboards
// Storage format: notifications are kept under key `notifications_<emailOrId>` as an array
// Notification item shape:
// { id, title, message, type, category, timestamp, isRead, targetUrl, icon, priority }

(function() {
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (_) {
      return null;
    }
  }

  function getUserKey(user) {
    if (!user) return null;
    return `notifications_${user.email || user.id || 'guest'}`;
  }

  function getNowIso() {
    return new Date().toISOString();
  }

  function readUserNotifications(user) {
    const key = getUserKey(user);
    if (!key) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (_) {
      return [];
    }
  }

  function writeUserNotifications(user, notifications) {
    const key = getUserKey(user);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(notifications));
  }

  function dedupeAndSort(notifications) {
    const seen = new Set();
    const result = [];
    for (const n of notifications) {
      const nid = n.id || `${n.type}_${n.timestamp}_${n.title}`;
      if (seen.has(nid)) continue;
      seen.add(nid);
      result.push({ ...n, id: nid });
    }
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return result;
  }

  function synthesizeFromContent(user) {
    const synthesized = [];
    // Messages
    try {
      const messages = JSON.parse(localStorage.getItem('lms_messages') || '[]');
      const userId = user?.id || user?.email;
      if (user && userId) {
        messages.forEach(m => {
          const isRecipient = (m.recipient === userId) || (m.recipient === 'teacher' && user.userType === 'teacher');
          const isSender = m.sender === userId;
          if (isRecipient) {
            synthesized.push({
              id: `msg_in_${m.id || m.timestamp}_${userId}`,
              title: 'New Message',
              message: `From ${typeof getNameById === 'function' ? getNameById(m.sender) : (m.sender || 'User')}: ${String(m.text || '').slice(0, 80)}${(m.text||'').length>80?'...':''}`,
              type: 'messages',
              category: 'message',
              timestamp: new Date(m.timestamp || getNowIso()),
              isRead: !!m.read,
              targetUrl: user.userType === 'teacher' ? 'teacher_messages.html' : 'messages.html',
              icon: 'fas fa-envelope',
              priority: 'medium'
            });
          }
          if (isSender && m.reply) {
            synthesized.push({
              id: `msg_reply_${m.id || m.timestamp}_${userId}`,
              title: 'Message Replied',
              message: `Reply: ${String(m.reply || '').slice(0, 80)}${(m.reply||'').length>80?'...':''}`,
              type: 'messages',
              category: 'message',
              timestamp: new Date(m.timestamp || getNowIso()),
              isRead: !!m.read,
              targetUrl: user.userType === 'teacher' ? 'teacher_messages.html' : 'messages.html',
              icon: 'fas fa-reply',
              priority: 'low'
            });
          }
        });
      }
    } catch(_) {}

    // Announcements (broadcast to students)
    try {
      const anns = JSON.parse(localStorage.getItem('allAnnouncements') || '[]');
      if (user && user.userType === 'student') {
        anns.forEach(a => {
          synthesized.push({
            id: `ann_${a.id || a.date}`,
            title: 'New Announcement',
            message: `${(a.title || 'Announcement')}${a.message ? ' - ' + a.message.substring(0, 60) + (a.message.length>60?'...':'') : ''}`,
            type: 'announcement',
            category: 'announcement',
            timestamp: new Date(a.date || getNowIso()),
            isRead: false,
            targetUrl: 'announcements.html',
            icon: 'fas fa-bullhorn',
            priority: 'high'
          });
        });
      }
    } catch(_) {}

    // Tests (visible to students)
    try {
      const tests = JSON.parse(localStorage.getItem('allTests') || '[]');
      if (user && user.userType === 'student') {
        tests.forEach(t => {
          synthesized.push({
            id: `test_${t.id}`,
            title: 'New Test Available',
            message: `${t.title} on ${t.date}`,
            type: 'tests',
            category: 'test',
            timestamp: new Date(t.dateCreated || t.date || getNowIso()),
            isRead: false,
            targetUrl: 'test.html',
            icon: 'fas fa-file-alt',
            priority: 'medium'
          });
        });
      }
    } catch(_) {}

    // Assignments (visible to students)
    try {
      const assigns = JSON.parse(localStorage.getItem('allAssignments') || '[]');
      if (user && user.userType === 'student') {
        assigns.forEach(a => {
          synthesized.push({
            id: `assign_${(a.title || 'assignment').replace(/\s+/g, '_')}_${a.dateCreated || a.due}`,
            title: 'New Assignment',
            message: `${a.title} due ${a.due}`,
            type: 'assignments',
            category: 'assignment',
            timestamp: new Date(a.dateCreated || getNowIso()),
            isRead: false,
            targetUrl: 'assignments.html',
            icon: 'fas fa-tasks',
            priority: 'medium'
          });
        });
      }
    } catch(_) {}

    return synthesized;
  }

  function getAllNotificationsForUser() {
    const user = getCurrentUser();
    if (!user) return [];

    // Stored
    const stored = readUserNotifications(user);
    // Synthesized in case some modules didn't persist notifications
    const synthesized = synthesizeFromContent(user);
    return dedupeAndSort([ ...stored, ...synthesized ]);
  }

  function getUnreadCountForUser() {
    const user = getCurrentUser();
    if (!user) return 0;
    const notifications = getAllNotificationsForUser();
    return notifications.filter(n => !n.isRead && !n.read).length;
  }

  function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;
    const count = getUnreadCountForUser();
    if (count > 0) {
      badge.textContent = String(count);
      badge.style.display = 'inline-flex';
    } else {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
  }

  function markAllAsRead() {
    const user = getCurrentUser();
    if (!user) return;
    const key = getUserKey(user);
    if (!key) return;
    const stored = readUserNotifications(user).map(n => ({ ...n, isRead: true, read: true }));
    writeUserNotifications(user, stored);
    updateNotificationBadge();
  }

  function buildDropdown(notifications) {
    let panel = document.getElementById('notifications-dropdown');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'notifications-dropdown';
      panel.className = 'notifications-dropdown-panel';
      document.body.appendChild(panel);
    }

    const itemsHtml = notifications.slice(0, 20).map(n => `
      <div class="notif-item ${n.isRead || n.read ? 'read' : 'unread'}" data-url="${n.targetUrl || '#'}">
        <i class="${n.icon || 'fas fa-bell'}"></i>
        <div class="notif-content">
          <div class="notif-title">${n.title || 'Notification'}</div>
          <div class="notif-message">${n.message || ''}</div>
          <div class="notif-meta">${new Date(n.timestamp).toLocaleString()}</div>
        </div>
      </div>
    `).join('');

    panel.innerHTML = `
      <div class="notif-header">
        <span>Notifications</span>
        <button id="mark-all-read-btn" class="notif-mark-read">Mark all read</button>
      </div>
      <div class="notif-list">${itemsHtml || '<div class="notif-empty">No notifications</div>'}</div>
      <style>
        .notifications-dropdown-panel{position:absolute;top:60px;right:16px;background:#fff;border:1px solid #eee;box-shadow:0 8px 24px rgba(0,0,0,0.08);width:360px;max-height:70vh;overflow:auto;border-radius:8px;z-index:9999;}
        .notif-header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600}
        .notif-mark-read{background:#f5f5f5;border:none;padding:6px 10px;border-radius:6px;cursor:pointer}
        .notif-item{display:flex;gap:10px;padding:10px 12px;border-bottom:1px solid #fafafa;cursor:pointer}
        .notif-item.unread{background:#f9f6ff}
        .notif-item i{color:#8e44ad;min-width:20px;margin-top:3px}
        .notif-title{font-weight:700;margin-bottom:2px}
        .notif-message{font-size:0.9rem;color:#555}
        .notif-meta{font-size:0.8rem;color:#888;margin-top:4px}
        .notif-empty{padding:16px;color:#777;text-align:center}
      </style>
    `;

    // Click handlers
    panel.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.getAttribute('data-url');
        markAllAsRead();
        if (url && url !== '#') window.location.href = url;
      });
    });

    const markBtn = document.getElementById('mark-all-read-btn');
    if (markBtn) {
      markBtn.onclick = function() { markAllAsRead(); renderDropdown(); };
    }

    return panel;
  }

  function positionDropdown(panel) {
    const bell = document.getElementById('notification-btn');
    if (!bell || !panel) return;
    const rect = bell.getBoundingClientRect();
    panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
    panel.style.right = `${document.documentElement.clientWidth - rect.right}px`;
  }

  function renderDropdown() {
    const notifications = getAllNotificationsForUser();
    const panel = buildDropdown(notifications);
    positionDropdown(panel);
  }

  function toggleDropdown() {
    let panel = document.getElementById('notifications-dropdown');
    if (panel && panel.style.display !== 'none') {
      panel.style.display = 'none';
      return;
    }
    renderDropdown();
    panel = document.getElementById('notifications-dropdown');
    if (panel) panel.style.display = 'block';
  }

  function setupNotificationBell() {
    const bell = document.getElementById('notification-btn');
    if (!bell) return;
    bell.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleDropdown();
    });
    document.addEventListener('click', function(e) {
      const panel = document.getElementById('notifications-dropdown');
      if (!panel) return;
      if (!panel.contains(e.target) && e.target !== bell) {
        panel.style.display = 'none';
      }
    });
  }

  function initializeNotificationSystem() {
    updateNotificationBadge();
    setupNotificationBell();
  }

  // Expose minimal API
  window.initializeNotificationSystem = initializeNotificationSystem;
  window.updateNotificationBadge = updateNotificationBadge;
  // Backward-compat alias used by some modules
  window.updateNotificationCount = updateNotificationBadge;
  window.getUnreadCountForUser = getUnreadCountForUser;
})();


