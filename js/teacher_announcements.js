document.addEventListener('DOMContentLoaded', function () {
    const announcementForm = document.getElementById('announcementForm');
    const announcementList = document.getElementById('announcement-list');
    const announcementTitle = document.getElementById('announcement-title');
    const announcementBody = document.getElementById('announcement-body');
    let announcements = JSON.parse(localStorage.getItem('allAnnouncements')) || [];

    function saveAnnouncements() {
        localStorage.setItem('allAnnouncements', JSON.stringify(announcements));
        
        // Log activity for the last added announcement
        if (announcements.length > 0) {
            const lastAnnouncement = announcements[announcements.length - 1];
            
            if (typeof logActivity === 'function') {
                logActivity('announcement', 'Posted Announcement', `Posted: ${lastAnnouncement.title}`, 'teacher_announcements.html');
            }
            
            // Create notifications for all students
            createAnnouncementNotification(lastAnnouncement);
        }
    }
    
    function createAnnouncementNotification(announcement) {
        // Get all students
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const now = new Date().toISOString();
        
        students.forEach(student => {
            const notification = {
                id: `announcement_${Date.now()}_${student.id}`,
                type: 'announcement',
                title: 'New Announcement',
                message: `${currentUser.name || 'Teacher'} posted: ${announcement.title}`,
                timestamp: now,
                read: false,
                targetUrl: 'announcements.html',
                priority: 'high',
                userId: student.email || student.id,
                fromUserId: currentUser.email || currentUser.id,
                fromUserName: currentUser.name || 'Teacher',
                announcementId: announcement.id || Date.now()
            };
            
            // Save notification for this student
            const studentNotifications = JSON.parse(localStorage.getItem(`notifications_${student.email || student.id}`) || '[]');
            studentNotifications.unshift(notification);
            localStorage.setItem(`notifications_${student.email || student.id}`, JSON.stringify(studentNotifications));
        });
        
        // Update notification count for all students
        updateAllStudentNotificationCounts();
    }
    
    function updateAllStudentNotificationCounts() {
        // This will be handled by the notification system when each student logs in
        // or when the notifications page is loaded
    }

    function displayAnnouncements() {
        announcementList.innerHTML = '';
        if (announcements.length === 0) {
            announcementTitle.textContent = 'No announcements yet';
            announcementBody.textContent = 'Create an announcement using the form below.';
            return;
        }

        announcements.forEach((ann, index) => {
            const listItem = document.createElement('li');
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = ann.title;
            button.addEventListener('click', () => {
                announcementTitle.textContent = ann.title;
                announcementBody.textContent = ann.message;
            });
            listItem.appendChild(button);
            announcementList.appendChild(listItem);
        });
    }

    announcementForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const title = e.target.title.value;
        const message = e.target.message.value;

        if (title && message) {
            const newAnnouncement = { title, message, date: new Date().toISOString() };
            announcements.push(newAnnouncement);
            saveAnnouncements();
            displayAnnouncements();
            e.target.reset();
            announcementTitle.textContent = 'Select an announcement';
            announcementBody.textContent = 'Click an announcement to view details.';
            
            // Log activity
            if (typeof logActivity === 'function') {
                logActivity('announcement', 'Posted Announcement', `Posted: ${title}`, 'teacher_announcements.html');
            }
        }
    });

    displayAnnouncements();
}); 