document.addEventListener('DOMContentLoaded', function () {
    const announcementsList = document.getElementById('student-announcements-list');
    const announcements = JSON.parse(localStorage.getItem('allAnnouncements') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Mark announcement notifications as read when viewing the announcements page
    markAnnouncementNotificationsAsRead();

    if (announcements.length === 0) {
        announcementsList.innerHTML = '<p>No announcements available at the moment.</p>';
        return;
    }

    announcements.forEach((ann, idx) => {
        const annElement = document.createElement('div');
        annElement.classList.add('box', 'announcement-box');
        annElement.innerHTML = `
            <h3>${ann.title}</h3>
            <p>${ann.message.length > 100 ? ann.message.slice(0, 100) + '...' : ann.message}</p>
            <p class="date">Posted on: ${new Date(ann.date).toLocaleDateString()}</p>
            <button class="btn view-announcement-btn" data-idx="${idx}">View Details</button>
        `;
        announcementsList.appendChild(annElement);
    });

    document.querySelectorAll('.view-announcement-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = this.getAttribute('data-idx');
            openAnnouncementModal(announcements[idx]);
        };
    });

    function openAnnouncementModal(announcement) {
        const modal = document.getElementById('announcement-modal');
        const content = document.getElementById('announcement-modal-content');
        let html = `
            <div class="announcement-details">
                <h2>${announcement.title}</h2>
                <p class="announcement-meta">
                    <i class="fas fa-user"></i> ${announcement.author || 'Administrator'} | 
                    <i class="far fa-calendar-alt"></i> ${new Date(announcement.date).toLocaleString()}
                </p>
                <div class="announcement-content">
                    <p>${announcement.message.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
        content.innerHTML = html;
        modal.style.display = 'flex';
        
        // Mark this specific announcement notification as read
        markAnnouncementAsRead(announcement.id || announcement.date);
        
        // Close modal when clicking outside content
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Close button
        document.getElementById('close-announcement-modal').onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    // Mark all announcement notifications as read
    function markAnnouncementNotificationsAsRead() {
        if (!currentUser || !currentUser.email) return;
        
        const notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.email}`) || '[]');
        let updated = false;
        
        const updatedNotifications = notifications.map(notification => {
            if (notification.type === 'announcement' && !notification.read) {
                updated = true;
                return { ...notification, read: true };
            }
            return notification;
        });
        
        if (updated) {
            localStorage.setItem(`notifications_${currentUser.email}`, JSON.stringify(updatedNotifications));
            // Update the notification badge
            if (typeof updateNotificationBadge === 'function') {
                updateNotificationBadge();
            }
        }
    }
    
    // Mark a specific announcement as read
    function markAnnouncementAsRead(announcementId) {
        if (!currentUser || !currentUser.email) return;
        
        const notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.email}`) || '[]');
        let updated = false;
        
        const updatedNotifications = notifications.map(notification => {
            if (notification.type === 'announcement' && 
                (notification.announcementId === announcementId || notification.timestamp === announcementId) && 
                !notification.read) {
                updated = true;
                return { ...notification, read: true };
            }
            return notification;
        });
        
        if (updated) {
            localStorage.setItem(`notifications_${currentUser.email}`, JSON.stringify(updatedNotifications));
            // Update the notification badge
            if (typeof updateNotificationBadge === 'function') {
                updateNotificationBadge();
            }
        }
    }
});