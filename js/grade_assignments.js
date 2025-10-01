// Grade Manager class to handle all grade-related operations
class GradeManager {
    constructor() {
        this.gradesKey = 'eduTech_grades';
        this.usersKey = 'lms_users';
        this.coursesKey = 'lms_courses';
        this.initializeGradesStorage();
        this.initializeEventListeners();
    }

    // Initialize grades storage if it doesn't exist
    initializeGradesStorage() {
        if (!localStorage.getItem(this.gradesKey)) {
            localStorage.setItem(this.gradesKey, JSON.stringify([]));
        }
    }

    // Get current user from session
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // Load students into the dropdown
    loadStudents() {
        const studentSelect = document.getElementById('studentSelect');
        if (!studentSelect) return;

        // Get all users with role 'student'
        const allUsers = JSON.parse(localStorage.getItem(this.usersKey) || '[]');
        const students = allUsers.filter(user => user && user.userType === 'student');
        
        studentSelect.innerHTML = '<option value="">Select a student</option>';
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id || student.email; // Use email as ID if no ID exists
            option.textContent = `${student.name} (${student.email})`;
            option.dataset.email = student.email;
            studentSelect.appendChild(option);
        });

        // Add event listener to update email field when student is selected
        studentSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const emailInput = document.getElementById('studentEmail');
            if (emailInput && selectedOption.dataset.email) {
                emailInput.value = selectedOption.dataset.email;
            }
        });
    }

    // Load course suggestions into the datalist
    loadCourseSuggestions() {
        const datalist = document.getElementById('courseSuggestions');
        if (!datalist) return;

        // Get courses from localStorage or initialize empty array
        const courses = JSON.parse(localStorage.getItem(this.coursesKey) || '[]');
        const currentUser = this.getCurrentUser();
        
        datalist.innerHTML = '';
        
        // If no courses in storage, use an empty array
        const availableCourses = courses.length > 0 ? courses : [];
        
        // Create a Set to store unique course names
        const uniqueCourseNames = new Set();
        
        availableCourses.forEach(course => {
            // Only show courses for the current teacher (if teacher) or all courses for admin
            if (currentUser && currentUser.userType === 'teacher' && course.teacherId && 
                course.teacherId !== currentUser.id) {
                return; // Skip courses not taught by this teacher
            }
            
            const courseName = course.name || `Course ${course.id}`;
            if (courseName && !uniqueCourseNames.has(courseName)) {
                uniqueCourseNames.add(courseName);
                const option = document.createElement('option');
                option.value = courseName;
                datalist.appendChild(option);
            }
        });
    }

    // Get all grades
    getGrades() {
        return JSON.parse(localStorage.getItem(this.gradesKey)) || [];
    }

    // Save grades to localStorage
    saveGrades(grades) {
        localStorage.setItem(this.gradesKey, JSON.stringify(grades));
    }

    // Add a new grade
    addGrade(gradeData) {
        const grades = this.getGrades();
        const currentUser = this.getCurrentUser();
        
        // Get student info from the dropdown
        const studentSelect = document.getElementById('studentSelect');
        const selectedOption = studentSelect.options[studentSelect.selectedIndex];
        const studentId = selectedOption ? selectedOption.value : '';
        const studentEmail = document.getElementById('studentEmail')?.value || '';
        
        if (!studentId || !studentEmail) {
            throw new Error('Student information is missing');
        }
        
        // Get course ID if available
        const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
        const course = courses.find(c => c.name === gradeData.courseName);
        
        // Create a consistent grade object with both ID and email
        const newGrade = {
            id: 'g' + Date.now(),
            ...gradeData,
            courseId: course ? course.id : gradeData.courseName, // Store both ID and name for compatibility
            studentId: studentId,      // For student grades lookup
            studentEmail: studentEmail, // For backward compatibility
            gradedBy: currentUser ? currentUser.email : 'system',
            date: new Date().toISOString(),
            // Add term if not present (required for filtering)
            term: gradeData.term || 'Spring 2024' // Default term if not specified
        };
        
        console.log('Adding new grade:', newGrade);
        
        grades.push(newGrade);
        this.saveGrades(grades);
        
        // Log activity
        if (window.logActivity) {
            const activityMessage = `Graded ${gradeData.grade} for ${studentEmail} in ${gradeData.courseName}`;
            window.logActivity('grade', 'Grade Assigned', activityMessage, 'grade_assignments.html');
        }
        
        return newGrade;
    }

    // Get grades for a specific student
    getStudentGrades(studentId) {
        const grades = this.getGrades();
        return grades.filter(grade => grade.studentId === studentId);
    }

    // Get grades for a specific course
    getCourseGrades(courseId) {
        const grades = this.getGrades();
        return grades.filter(grade => grade.courseId === courseId);
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Form submission - use event delegation for better reliability
        document.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'gradingForm') {
                e.preventDefault();
                this.handleFormSubmit(e);
            }
        });
        
        // Reset form handler - use event delegation
        document.addEventListener('click', (e) => {
            if (e.target && e.target.matches('#gradingForm button[type="reset"]')) {
                e.preventDefault();
                // Get form data
                const formData = {
                    courseName: document.getElementById('courseName').value.trim(),
                    studentId: document.getElementById('studentSelect').value,
                    studentEmail: document.getElementById('studentEmail').value,
                    grade: document.getElementById('grade').value.trim(),
                    assignment: document.getElementById('assignment').value.trim(),
                    comments: document.getElementById('comments').value.trim()
                };
                
                // For backward compatibility, also set courseId to courseName
                formData.courseId = formData.courseName;
                this.resetForm();
            }
        });
        
        // Update student email when student is selected
        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'studentSelect') {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const email = selectedOption.dataset.email || '';
                const emailInput = document.getElementById('studentEmail');
                if (emailInput) {
                    emailInput.value = email;
                }
            }
        });
    }
    
    // Reset form to default state
    resetForm() {
        const form = document.getElementById('gradingForm');
        if (form) {
            form.reset();
            // Clear any error messages
            this.clearFormErrors();
        }
    }
    
    // Clear all form error messages
    clearFormErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
        
        const errorInputs = document.querySelectorAll('.is-invalid');
        errorInputs.forEach(input => input.classList.remove('is-invalid'));
    }
    
    // Validate form data
    validateFormData(formData) {
        const errors = [];
        
        // Check required fields
        const requiredFields = ['courseName', 'studentId', 'studentEmail', 'grade', 'assignment'];
        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
            }
        });
        
        // Validate grade format (A-F or 0-100)
        if (formData.grade) {
            const gradeRegex = /^([A-Fa-f][+-]?|100|\d{1,2})$/;
            if (!gradeRegex.test(formData.grade)) {
                errors.push('Please enter a valid grade (A-F or 0-100)');
            }
        }
        
        // Validate email format
        if (formData.studentEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.studentEmail)) {
                errors.push('Please enter a valid email address');
            }
        }
        
        return errors;
    }
    
    // Display form errors
    displayFormErrors(errors) {
        // Clear previous errors
        this.clearFormErrors();
        
        if (errors.length === 0) return;
        
        // Create error container
        const form = document.getElementById('gradingForm');
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger mb-4';
        errorContainer.role = 'alert';
        
        // Add error messages
        const errorList = document.createElement('ul');
        errorList.className = 'mb-0';
        
        errors.forEach(error => {
            const errorItem = document.createElement('li');
            errorItem.textContent = error;
            errorList.appendChild(errorItem);
        });
        
        errorContainer.appendChild(errorList);
        
        // Insert error container at the top of the form
        form.insertBefore(errorContainer, form.firstChild);
        
        // Scroll to top of form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Handle form submission
    handleFormSubmit(e) {
        // Ensure we have the form element
        const form = e.target.closest('form');
        if (!form) {
            console.error('Form not found');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const gradeData = Object.fromEntries(formData.entries());
        
        // Get current user
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            gradeData.gradedBy = currentUser.email || 'system';
        } else {
            this.showAlert('You must be logged in to submit grades', 'error');
            return;
        }
        
        // Validate form data
        const errors = this.validateFormData(gradeData);
        if (errors.length > 0) {
            this.displayFormErrors(errors);
            return;
        }
        
        try {
            console.log('Submitting grade data:', gradeData);
            
            // Add the grade
            const newGrade = this.addGrade(gradeData);
            
            // Show success message with more details
            this.showAlert(`Successfully submitted grade ${gradeData.grade} for ${gradeData.studentEmail}`, 'success');
            
            // Reset form
            this.resetForm();
            
            // Log activity
            if (window.logActivity) {
                const activityMessage = `Graded ${gradeData.grade} for ${gradeData.studentEmail} in ${gradeData.assignment}`;
                window.logActivity('grade', 'Grade Assigned', activityMessage, 'grade_assignments.html');
            }
            
            // Refresh the recent grades list
            this.loadRecentGrades();
            
        } catch (error) {
            console.error('Error in handleFormSubmit:', error);
            this.showAlert(`Error: ${error.message || 'Failed to submit grade. Please try again.'}`, 'error');
        }
    }

    // Validate grade format
    isValidGrade(grade) {
        // Check if grade is A-F (with optional + or -)
        if (/^[A-F][+-]?$/.test(grade.toUpperCase())) {
            return true;
        }
        
        // Check if grade is a number between 0 and 100
        const numericGrade = parseFloat(grade);
        return !isNaN(numericGrade) && numericGrade >= 0 && numericGrade <= 100;
    }

    // Load and display recent grades
    loadRecentGrades() {
        const recentGradesContainer = document.getElementById('recentGrades');
        if (!recentGradesContainer) return;

        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        // Get all grades, sorted by date (newest first)
        const allGrades = this.getGrades().sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        // Filter grades by current teacher (if teacher) or show all (if admin)
        const teacherGrades = allGrades.filter(grade => 
            currentUser.userType === 'admin' || 
            grade.gradedBy === currentUser.email
        );

        // Clear existing content
        recentGradesContainer.innerHTML = '';

        if (teacherGrades.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="text-center">No grades recorded yet.</td>
            `;
            recentGradesContainer.appendChild(row);
            return;
        }

        // Display up to 10 most recent grades
        const recentGrades = teacherGrades.slice(0, 10);
        
        recentGrades.forEach(grade => {
            const row = document.createElement('tr');
            
            // Format date
            const formattedDate = new Date(grade.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Format grade with color coding
            let gradeDisplay = grade.grade;
            const numericGrade = parseFloat(grade.grade);
            if (!isNaN(numericGrade)) {
                if (numericGrade >= 90) gradeDisplay = `<span class="grade-high">${grade.grade}</span>`;
                else if (numericGrade >= 70) gradeDisplay = `<span class="grade-medium">${grade.grade}</span>`;
                else gradeDisplay = `<span class="grade-low">${grade.grade}</span>`;
            }

            row.innerHTML = `
                <td>${grade.studentEmail || 'N/A'}</td>
                <td>${grade.courseName || 'N/A'}</td>
                <td>${gradeDisplay}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn-view-grade" data-grade-id="${grade.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            
            recentGradesContainer.appendChild(row);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.btn-view-grade').forEach(button => {
            button.addEventListener('click', (e) => {
                const gradeId = e.currentTarget.dataset.gradeId;
                this.viewGradeDetails(gradeId);
            });
        });
    }

    // View grade details in modal
    viewGradeDetails(gradeId) {
        const grade = this.getGrades().find(g => g.id === gradeId);
        if (!grade) {
            this.showAlert('Grade details not found', 'error');
            return;
        }

        const modal = document.getElementById('grade-modal');
        const modalContent = document.getElementById('grade-modal-content');
        
        if (!modal || !modalContent) return;

        // Format date
        const formattedDate = new Date(grade.date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create modal content
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Grade Details</h3>
            </div>
            <div class="modal-body">
                <div class="grade-detail-row">
                    <span class="label">Student:</span>
                    <span class="value">${grade.studentEmail || 'N/A'}</span>
                </div>
                <div class="grade-detail-row">
                    <span class="label">Course:</span>
                    <span class="value">${grade.courseName || 'N/A'}</span>
                </div>
                <div class="grade-detail-row">
                    <span class="label">Assignment:</span>
                    <span class="value">${grade.assignment || 'N/A'}</span>
                </div>
                <div class="grade-detail-row">
                    <span class="label">Grade:</span>
                    <span class="value grade-${this.getGradeLevel(grade.grade)}">
                        ${grade.grade || 'N/A'}
                    </span>
                </div>
                <div class="grade-detail-row">
                    <span class="label">Feedback:</span>
                    <p class="feedback">${grade.feedback || 'No feedback provided.'}</p>
                </div>
                <div class="grade-detail-row">
                    <span class="label">Graded By:</span>
                    <span class="value">${grade.gradedBy || 'System'}</span>
                </div>
                <div class="grade-detail-row">
                    <span class="label">Date Graded:</span>
                    <span class="value">${formattedDate}</span>
                </div>
            </div>
            <div class="modal-footer">
                <button id="close-grade-modal" class="btn btn-secondary">Close</button>
            </div>
        `;

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Close modal when clicking the close button
        const closeButton = document.querySelector('#close-grade-modal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        // Close modal when clicking outside the content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Helper method to determine grade level for styling
    getGradeLevel(grade) {
        if (!grade) return '';
        
        const numericGrade = parseFloat(grade);
        if (isNaN(numericGrade)) return '';
        
        if (numericGrade >= 90) return 'high';
        if (numericGrade >= 70) return 'medium';
        return 'low';
    }

    // Show alert message
    showAlert(message, type = 'info') {
        // Create alert container if it doesn't exist
        let alertContainer = document.querySelector('.alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.className = 'alert-container';
            alertContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1100;
                max-width: 400px;
                width: 90%;
            `;
            document.body.appendChild(alertContainer);
        }
        
        const alertId = 'alert-' + Date.now();
        const alertDiv = document.createElement('div');
        alertDiv.id = alertId;
        
        // Set alert styles based on type
        const typeStyles = {
            success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
            warning: { bg: '#fff3cd', text: '#856404', border: '#ffeeba' },
            info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
        };
        
        const style = typeStyles[type] || typeStyles.info;
        
        alertDiv.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px 20px;
            margin-bottom: 10px;
            border: 1px solid ${style.border};
            border-radius: 4px;
            background-color: ${style.bg};
            color: ${style.text};
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add icon based on type
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        alertDiv.innerHTML = `
            <i class="fas ${icon}" style="margin-right: 10px; font-size: 1.2em;"></i>
            <div style="flex-grow: 1;">${message}</div>
            <button type="button" class="close-btn" style="background: none; border: none; cursor: pointer; font-size: 1.2em; margin-left: 10px;">&times;</button>
        `;
        
        // Add the new alert
        alertContainer.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        const removeAlert = () => {
            alertDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        };
        
        const timeoutId = setTimeout(removeAlert, 5000);
        
        // Handle close button
        const closeButton = alertDiv.querySelector('.close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                clearTimeout(timeoutId);
                removeAlert();
            });
        }
        
        // Add keyframes for animations
        const styleElement = document.createElement('style');
        if (!document.getElementById('alert-animations')) {
            styleElement.id = 'alert-animations';
            styleElement.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateX(0); }
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
}

// Initialize Grade Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check if user is logged in and has permission
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser || (currentUser.userType !== 'teacher' && currentUser.userType !== 'admin')) {
            // Redirect to login or show access denied
            window.location.href = 'login.html';
            return;
        }

        console.log('Initializing Grade Manager...');
        const gradeManager = new GradeManager();
        window.gradeManager = gradeManager; // Make it accessible globally for debugging
        
        // Load students and courses
        console.log('Loading students and courses...');
        gradeManager.loadStudents();
        gradeManager.loadCourseSuggestions();
        
        // Add a small delay to ensure everything is loaded
        setTimeout(() => {
            console.log('Grade Manager initialized successfully');
            // Set the gradedBy field with current user's email
            const gradedByInput = document.getElementById('gradedBy');
            if (gradedByInput) {
                gradedByInput.value = currentUser.email || 'system';
            }
            
            // Load recent grades
            gradeManager.loadRecentGrades();
        }, 100);
        
    } catch (error) {
        console.error('Error initializing Grade Manager:', error);
        alert('An error occurred while initializing the page. Please refresh and try again.');
    }
});
