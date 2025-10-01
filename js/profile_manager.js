// =========================
// Enhanced Profile Manager
// =========================

class ProfileManager {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.initializeProfile();
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    initializeProfile() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        this.loadProfileData();
        this.loadStatistics();
        this.loadRecentActivity();
        this.loadSkillsAndAchievements();
    }

    loadProfileData() {
        // Update profile header
        document.querySelector('.profile-name').textContent = this.currentUser.name || 'User Name';
        document.querySelector('.profile-role').textContent = this.currentUser.userType || 'student';
        
        // Generate profile information based on user type
        const profileInfo = this.generateProfileInfo();
        this.renderProfileInfo(profileInfo);
    }

    generateProfileInfo() {
        const baseInfo = {
            email: this.currentUser.email || `${this.currentUser.name?.toLowerCase().replace(' ', '.')}@edutech.com`,
            phone: this.currentUser.phone || '+260 97X XXX XXX',
            joinDate: this.currentUser.joinDate || '2024-01-15',
            lastLogin: new Date().toLocaleDateString(),
            bio: this.currentUser.bio || this.getDefaultBio()
        };

        // Add role-specific information
        if (this.currentUser.userType === 'student') {
            return {
                ...baseInfo,
                studentId: this.currentUser.studentId || 'STU' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                year: this.currentUser.year || 'Year 3',
                program: this.currentUser.program || 'Computer Science',
                gpa: this.currentUser.gpa || '3.7'
            };
        } else if (this.currentUser.userType === 'teacher') {
            return {
                ...baseInfo,
                employeeId: this.currentUser.employeeId || 'TEA' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                department: this.currentUser.department || 'Computer Science',
                specialization: this.currentUser.specialization || 'Software Engineering',
                experience: this.currentUser.experience || '5 years'
            };
        } else if (this.currentUser.userType === 'admin') {
            return {
                ...baseInfo,
                adminId: this.currentUser.adminId || 'ADM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                department: this.currentUser.department || 'IT Administration',
                clearanceLevel: this.currentUser.clearanceLevel || 'Level 5',
                systemAccess: this.currentUser.systemAccess || 'Full Access'
            };
        }
        
        return baseInfo;
    }

    getDefaultBio() {
        const bios = {
            student: 'Passionate learner pursuing academic excellence and personal growth.',
            teacher: 'Dedicated educator committed to inspiring and guiding students.',
            admin: 'System administrator ensuring smooth operation of the learning platform.'
        };
        return bios[this.currentUser.userType] || 'Welcome to EduTech LMS!';
    }

    renderProfileInfo(info) {
        const infoGrid = document.querySelector('.profile-info-grid');
        if (!infoGrid) return;

        const infoItems = [
            { icon: 'fas fa-envelope', label: 'Email', value: info.email },
            { icon: 'fas fa-phone', label: 'Phone', value: info.phone },
            { icon: 'fas fa-calendar', label: 'Joined', value: new Date(info.joinDate).toLocaleDateString() },
            { icon: 'fas fa-clock', label: 'Last Login', value: info.lastLogin }
        ];

        // Add role-specific info items
        if (this.currentUser.userType === 'student') {
            infoItems.push(
                { icon: 'fas fa-id-card', label: 'Student ID', value: info.studentId },
                { icon: 'fas fa-graduation-cap', label: 'Program', value: info.program },
                { icon: 'fas fa-calendar-alt', label: 'Year', value: info.year },
                { icon: 'fas fa-chart-line', label: 'GPA', value: info.gpa }
            );
        } else if (this.currentUser.userType === 'teacher') {
            infoItems.push(
                { icon: 'fas fa-id-badge', label: 'Employee ID', value: info.employeeId },
                { icon: 'fas fa-building', label: 'Department', value: info.department },
                { icon: 'fas fa-star', label: 'Specialization', value: info.specialization },
                { icon: 'fas fa-briefcase', label: 'Experience', value: info.experience }
            );
        } else if (this.currentUser.userType === 'admin') {
            infoItems.push(
                { icon: 'fas fa-shield-alt', label: 'Admin ID', value: info.adminId },
                { icon: 'fas fa-building', label: 'Department', value: info.department },
                { icon: 'fas fa-key', label: 'Clearance', value: info.clearanceLevel },
                { icon: 'fas fa-unlock', label: 'System Access', value: info.systemAccess }
            );
        }

        infoGrid.innerHTML = infoItems.map(item => `
            <div class="info-item">
                <div class="info-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="info-content">
                    <h4>${item.label}</h4>
                    <p>${item.value}</p>
                </div>
            </div>
        `).join('');

        // Add bio section
        const bioSection = document.createElement('div');
        bioSection.className = 'info-item';
        bioSection.innerHTML = `
            <div class="info-icon">
                <i class="fas fa-user-edit"></i>
            </div>
            <div class="info-content">
                <h4>Bio</h4>
                <p>${info.bio}</p>
            </div>
        `;
        infoGrid.appendChild(bioSection);
    }

    loadStatistics() {
        const statsGrid = document.querySelector('.stats-grid');
        if (!statsGrid) return;

        const stats = this.generateStatistics();
        
        statsGrid.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-number">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `).join('');
    }

    generateStatistics() {
        const userType = this.currentUser.userType;
        const userId = this.currentUser.email || this.currentUser.id;
        
        if (userType === 'student') {
            return this.getStudentStatistics(userId);
        } else if (userType === 'teacher') {
            return this.getTeacherStatistics(userId);
        } else if (userType === 'admin') {
            return this.getAdminStatistics();
        }
        
        return [];
    }

    getStudentStatistics(studentId) {
        // Courses enrolled
        const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
        const enrolledCourses = courses.length;

        // Assignments completed
        const submissions = JSON.parse(localStorage.getItem('assignmentSubmissions') || '{}');
        const studentSubmissions = submissions[studentId] || {};
        const assignmentsCompleted = Object.keys(studentSubmissions).length;

        // Tests taken
        const testResults = JSON.parse(localStorage.getItem('testResultsByStudent') || '{}');
        const studentTests = testResults[studentId] || [];
        const testsTaken = studentTests.length;

        // Calculate GPA from grades
        const allGrades = JSON.parse(localStorage.getItem('allGrades') || '[]');
        const studentGrades = allGrades.filter(grade => grade.studentId === studentId || grade.studentEmail === studentId);
        let gpa = 'N/A';
        
        if (studentGrades.length > 0) {
            const totalPoints = studentGrades.reduce((sum, grade) => {
                const numericGrade = this.convertGradeToPoints(grade.grade);
                return sum + numericGrade;
            }, 0);
            gpa = (totalPoints / studentGrades.length).toFixed(1);
        }

        return [
            { label: 'Courses Enrolled', value: enrolledCourses },
            { label: 'Assignments Completed', value: assignmentsCompleted },
            { label: 'Tests Taken', value: testsTaken },
            { label: 'Current GPA', value: gpa }
        ];
    }

    getTeacherStatistics(teacherId) {
        // Courses teaching
        const allTests = JSON.parse(localStorage.getItem('allTests') || '[]');
        const allAssignments = JSON.parse(localStorage.getItem('allAssignments') || '[]');
        
        const teacherTests = allTests.filter(test => test.createdBy === teacherId || test.teacher === teacherId);
        const teacherAssignments = allAssignments.filter(assignment => 
            assignment.createdBy === teacherId || assignment.teacher === teacherId
        );
        
        // Get unique courses from tests and assignments
        const coursesSet = new Set();
        teacherTests.forEach(test => test.course && coursesSet.add(test.course));
        teacherAssignments.forEach(assignment => assignment.course && coursesSet.add(assignment.course));
        const coursesTeaching = coursesSet.size;

        // Students taught (from graded assignments)
        const grades = JSON.parse(localStorage.getItem(`grades_${teacherId}`) || '[]');
        const uniqueStudents = new Set(grades.map(grade => grade.studentId || grade.studentEmail));
        const studentsTaught = uniqueStudents.size;

        // Assignments created
        const assignmentsCreated = teacherAssignments.length;

        // Calculate average grade given
        let avgGrade = 'N/A';
        if (grades.length > 0) {
            const totalPoints = grades.reduce((sum, grade) => {
                return sum + this.convertGradeToPoints(grade.grade);
            }, 0);
            avgGrade = (totalPoints / grades.length).toFixed(1);
        }

        return [
            { label: 'Courses Teaching', value: coursesTeaching },
            { label: 'Students Taught', value: studentsTaught },
            { label: 'Assignments Created', value: assignmentsCreated },
            { label: 'Average Grade Given', value: avgGrade }
        ];
    }

    getAdminStatistics() {
        // Total users
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const totalUsers = allUsers.length;

        // Active courses (from tests and assignments)
        const allTests = JSON.parse(localStorage.getItem('allTests') || '[]');
        const allAssignments = JSON.parse(localStorage.getItem('allAssignments') || '[]');
        const coursesSet = new Set();
        allTests.forEach(test => test.course && coursesSet.add(test.course));
        allAssignments.forEach(assignment => assignment.course && coursesSet.add(assignment.course));
        const activeCourses = coursesSet.size;

        // System notifications handled
        const adminNotifications = JSON.parse(localStorage.getItem('notifications_admin') || '[]');
        const notificationsHandled = adminNotifications.filter(n => n.isRead).length;

        // Total content created (tests + assignments + announcements)
        const allAnnouncements = JSON.parse(localStorage.getItem('allAnnouncements') || '[]');
        const totalContent = allTests.length + allAssignments.length + allAnnouncements.length;

        return [
            { label: 'Total Users', value: totalUsers },
            { label: 'Active Courses', value: activeCourses },
            { label: 'Notifications Handled', value: notificationsHandled },
            { label: 'Total Content', value: totalContent }
        ];
    }

    convertGradeToPoints(grade) {
        // Convert letter grades to 4.0 scale
        const gradeMap = {
            'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0
        };

        // If it's a letter grade
        if (gradeMap.hasOwnProperty(grade)) {
            return gradeMap[grade];
        }

        // If it's a numeric grade, convert to 4.0 scale
        const numericGrade = parseFloat(grade);
        if (!isNaN(numericGrade)) {
            if (numericGrade >= 90) return 4.0;
            if (numericGrade >= 80) return 3.0;
            if (numericGrade >= 70) return 2.0;
            if (numericGrade >= 60) return 1.0;
            return 0.0;
        }

        return 0.0; // Default for invalid grades
    }

    loadRecentActivity() {
        const activityFeed = document.querySelector('.activity-feed');
        if (!activityFeed) return;

        const activities = this.getRealUserActivities();
        
        if (activities.length === 0) {
            activityFeed.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <h5>No Recent Activity</h5>
                        <p>Start using the platform to see your activity here</p>
                    </div>
                    <div class="activity-time">-</div>
                </div>
            `;
            return;
        }
        
        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h5>${activity.title}</h5>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
        
        // Log profile view activity
        if (typeof logActivity === 'function') {
            logActivity('profile', 'Viewed Profile', 'User accessed their profile page');
        }
    }

    getRealUserActivities() {
        const userId = this.currentUser.email || this.currentUser.id;
        
        // Get activities from the ActivityTracker system
        const trackedActivities = this.getTrackedActivities(userId);
        
        // Get legacy activities from existing localStorage data
        const legacyActivities = this.getLegacyActivities(userId);
        
        // Combine and sort all activities
        const allActivities = [...trackedActivities, ...legacyActivities];
        
        // Sort by timestamp (newest first) and limit to 10
        return allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    }

    getTrackedActivities(userId) {
        // Get activities from the new ActivityTracker system
        const storageKey = `user_activities_${userId}`;
        const activities = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        return activities.map(activity => ({
            icon: this.getActivityIcon(activity.type),
            title: activity.title,
            description: activity.description,
            time: this.formatTimeAgo(activity.timestamp),
            timestamp: activity.timestamp
        }));
    }

    getActivityIcon(type) {
        const iconMap = {
            'test': 'fas fa-file-alt',
            'assignment': 'fas fa-tasks',
            'grade': 'fas fa-star',
            'course': 'fas fa-graduation-cap',
            'announcement': 'fas fa-bullhorn',
            'message': 'fas fa-envelope',
            'login': 'fas fa-sign-in-alt',
            'profile': 'fas fa-user-edit',
            'system': 'fas fa-cog',
            'user': 'fas fa-user-plus'
        };
        return iconMap[type] || 'fas fa-info-circle';
    }

    getLegacyActivities(userId) {
        const userType = this.currentUser.userType;
        const activities = [];

        if (userType === 'student') {
            activities.push(...this.getStudentActivities(userId));
        } else if (userType === 'teacher') {
            activities.push(...this.getTeacherActivities(userId));
        } else if (userType === 'admin') {
            activities.push(...this.getAdminActivities());
        }

        return activities;
    }

    getStudentActivities(studentId) {
        const activities = [];

        // Test submissions
        const testResults = JSON.parse(localStorage.getItem('testResultsByStudent') || '{}');
        if (testResults[studentId]) {
            testResults[studentId].forEach(result => {
                activities.push({
                    icon: 'fas fa-file-alt',
                    title: 'Completed Test',
                    description: `${result.testTitle} - Score: ${result.score}/${result.totalQuestions}`,
                    time: this.formatTimeAgo(result.date),
                    timestamp: result.date
                });
            });
        }

        // Assignment submissions
        const submissions = JSON.parse(localStorage.getItem('assignmentSubmissions') || '{}');
        if (submissions[studentId]) {
            Object.keys(submissions[studentId]).forEach(assignmentTitle => {
                const submission = submissions[studentId][assignmentTitle];
                activities.push({
                    icon: 'fas fa-tasks',
                    title: 'Submitted Assignment',
                    description: assignmentTitle,
                    time: this.formatTimeAgo(submission.date),
                    timestamp: submission.date
                });
            });
        }

        // Grade notifications (received grades)
        const studentNotifications = JSON.parse(localStorage.getItem(`notifications_${studentId}`) || '[]');
        const gradeNotifications = studentNotifications.filter(n => n.type === 'grades');
        gradeNotifications.forEach(notification => {
            activities.push({
                icon: 'fas fa-star',
                title: 'Grade Received',
                description: notification.message,
                time: this.formatTimeAgo(notification.timestamp),
                timestamp: notification.timestamp
            });
        });

        // Course enrollments
        const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
        courses.forEach(course => {
            if (course.enrolledDate) {
                activities.push({
                    icon: 'fas fa-graduation-cap',
                    title: 'Enrolled in Course',
                    description: course.title,
                    time: this.formatTimeAgo(course.enrolledDate),
                    timestamp: course.enrolledDate
                });
            }
        });

        return activities;
    }

    getTeacherActivities(teacherId) {
        const activities = [];

        // Created tests
        const allTests = JSON.parse(localStorage.getItem('allTests') || '[]');
        const teacherTests = allTests.filter(test => test.createdBy === teacherId || test.teacher === teacherId);
        teacherTests.forEach(test => {
            activities.push({
                icon: 'fas fa-file-alt',
                title: 'Created Test',
                description: test.title,
                time: this.formatTimeAgo(test.dateCreated),
                timestamp: test.dateCreated
            });
        });

        // Created assignments
        const allAssignments = JSON.parse(localStorage.getItem('allAssignments') || '[]');
        const teacherAssignments = allAssignments.filter(assignment => 
            assignment.createdBy === teacherId || assignment.teacher === teacherId
        );
        teacherAssignments.forEach(assignment => {
            activities.push({
                icon: 'fas fa-tasks',
                title: 'Created Assignment',
                description: assignment.title,
                time: this.formatTimeAgo(assignment.dateCreated),
                timestamp: assignment.dateCreated
            });
        });

        // Graded assignments
        const allGrades = JSON.parse(localStorage.getItem(`grades_${teacherId}`) || '[]');
        allGrades.forEach(grade => {
            activities.push({
                icon: 'fas fa-marker',
                title: 'Graded Assignment',
                description: `${grade.studentName} - ${grade.course}`,
                time: this.formatTimeAgo(grade.dateCreated),
                timestamp: grade.dateCreated
            });
        });

        // Posted announcements
        const allAnnouncements = JSON.parse(localStorage.getItem('allAnnouncements') || '[]');
        const teacherAnnouncements = allAnnouncements.filter(announcement => 
            announcement.createdBy === teacherId || announcement.teacher === teacherId
        );
        teacherAnnouncements.forEach(announcement => {
            activities.push({
                icon: 'fas fa-bullhorn',
                title: 'Posted Announcement',
                description: announcement.title,
                time: this.formatTimeAgo(announcement.dateCreated),
                timestamp: announcement.dateCreated
            });
        });

        return activities;
    }

    getAdminActivities() {
        const activities = [];

        // System notifications and activities
        const adminNotifications = JSON.parse(localStorage.getItem('notifications_admin') || '[]');
        adminNotifications.forEach(notification => {
            let icon = 'fas fa-info-circle';
            let title = 'System Activity';
            
            if (notification.type === 'users') icon = 'fas fa-user-plus';
            if (notification.type === 'courses') icon = 'fas fa-graduation-cap';
            if (notification.type === 'security') icon = 'fas fa-shield-alt';
            if (notification.type === 'maintenance') icon = 'fas fa-wrench';
            
            if (notification.category === 'activity') {
                title = 'System Activity';
            } else if (notification.category === 'alert') {
                title = 'System Alert';
            }

            activities.push({
                icon: icon,
                title: title,
                description: notification.message,
                time: this.formatTimeAgo(notification.timestamp),
                timestamp: notification.timestamp
            });
        });

        // Recent user registrations (from user management)
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const recentUsers = allUsers.filter(user => 
            user.registrationDate && 
            new Date(user.registrationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        recentUsers.forEach(user => {
            activities.push({
                icon: 'fas fa-user-plus',
                title: 'New User Registration',
                description: `${user.name} registered as ${user.userType}`,
                time: this.formatTimeAgo(user.registrationDate),
                timestamp: user.registrationDate
            });
        });

        return activities;
    }

    loadSkillsAndAchievements() {
        this.loadSkills();
        this.loadAchievements();
    }

    loadSkills() {
        const skillsContainer = document.querySelector('.skills-tags');
        if (!skillsContainer) return;

        const skills = this.generateSkills();
        
        skillsContainer.innerHTML = skills.map(skill => `
            <span class="skill-tag">${skill}</span>
        `).join('');
    }

    generateSkills() {
        const userType = this.currentUser.userType;
        
        const skillSets = {
            student: ['JavaScript', 'Python', 'HTML/CSS', 'React', 'Node.js', 'Database Design', 'Problem Solving', 'Team Work'],
            teacher: ['Curriculum Design', 'Student Assessment', 'Educational Technology', 'Research', 'Public Speaking', 'Mentoring', 'Course Development'],
            admin: ['System Administration', 'User Management', 'Security', 'Database Management', 'Network Administration', 'Policy Development', 'Analytics']
        };

        const availableSkills = skillSets[userType] || [];
        // Return 4-6 random skills
        const numSkills = Math.floor(Math.random() * 3) + 4;
        return availableSkills.sort(() => 0.5 - Math.random()).slice(0, numSkills);
    }

    loadAchievements() {
        const achievementsGrid = document.querySelector('.achievements-grid');
        if (!achievementsGrid) return;

        const achievements = this.generateAchievements();
        
        achievementsGrid.innerHTML = achievements.map(achievement => `
            <div class="achievement-badge" title="${achievement.description}">
                <div class="badge-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="badge-name">${achievement.name}</div>
            </div>
        `).join('');
    }

    generateAchievements() {
        const userType = this.currentUser.userType;
        
        const achievementSets = {
            student: [
                { icon: 'fas fa-trophy', name: 'Honor Roll', description: 'Maintained high GPA for 2 semesters' },
                { icon: 'fas fa-medal', name: 'Perfect Attendance', description: 'No missed classes this semester' },
                { icon: 'fas fa-star', name: 'Top Performer', description: 'Highest score in Database course' },
                { icon: 'fas fa-users', name: 'Team Player', description: 'Excellent collaboration in group projects' },
                { icon: 'fas fa-lightbulb', name: 'Innovation', description: 'Creative solution in programming assignment' },
                { icon: 'fas fa-clock', name: 'Early Bird', description: 'Consistently submits assignments early' }
            ],
            teacher: [
                { icon: 'fas fa-award', name: 'Excellence in Teaching', description: 'Outstanding student feedback ratings' },
                { icon: 'fas fa-graduation-cap', name: 'Mentor', description: 'Successfully guided 50+ students' },
                { icon: 'fas fa-book', name: 'Curriculum Developer', description: 'Created innovative course materials' },
                { icon: 'fas fa-chart-line', name: 'High Performance', description: 'Students show 95% pass rate' },
                { icon: 'fas fa-handshake', name: 'Collaboration', description: 'Active in faculty development programs' },
                { icon: 'fas fa-rocket', name: 'Innovation', description: 'Implemented new teaching methodologies' }
            ],
            admin: [
                { icon: 'fas fa-shield-alt', name: 'Security Expert', description: 'Maintained zero security incidents' },
                { icon: 'fas fa-cogs', name: 'System Optimizer', description: 'Improved system performance by 40%' },
                { icon: 'fas fa-users-cog', name: 'User Advocate', description: 'Resolved 99% of user issues' },
                { icon: 'fas fa-database', name: 'Data Guardian', description: 'Ensured 100% data backup reliability' },
                { icon: 'fas fa-chart-bar', name: 'Analytics Pro', description: 'Generated comprehensive usage reports' },
                { icon: 'fas fa-wrench', name: 'Problem Solver', description: 'Quick resolution of technical issues' }
            ]
        };

        const availableAchievements = achievementSets[userType] || [];
        // Return 4-6 random achievements
        const numAchievements = Math.floor(Math.random() * 3) + 4;
        return availableAchievements.sort(() => 0.5 - Math.random()).slice(0, numAchievements);
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffTime = Math.abs(now - new Date(date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a profile page
    if (document.querySelector('.user-profile')) {
        new ProfileManager();
    }
});
