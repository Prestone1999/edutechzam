document.addEventListener('DOMContentLoaded', function () {
    const assignmentForm = document.getElementById('assignmentForm');
    const formContainer = assignmentForm.parentElement;
    const assignmentsList = document.getElementById('teacher-assignments-list');
    const addAssignmentBtn = document.querySelector('.assignments .btn');
    let assignments = JSON.parse(localStorage.getItem('allAssignments')) || [];

    function saveAssignments() {
        localStorage.setItem('allAssignments', JSON.stringify(assignments));
        
        // Log activity for the last added assignment
        if (assignments.length > 0 && typeof logActivity === 'function') {
            const lastAssignment = assignments[assignments.length - 1];
            logActivity('assignment', 'Created Assignment', `Created assignment: ${lastAssignment.title}`, 'teacher_assignments.html');
        }
        
        // Clear all user notifications to force regeneration with new data
        clearAllUserNotifications();
    }

    function displayAssignments() {
        assignmentsList.innerHTML = '';
        if (assignments.length === 0) {
            assignmentsList.innerHTML = '<p>No assignments have been created yet.</p>';
            return;
        }

        assignments.forEach((assign, index) => {
            const assignElement = document.createElement('div');
            assignElement.classList.add('box');
            assignElement.innerHTML = `
                <h3>${assign.title}</h3>
                <p>${assign.description}</p>
                <p>Due: ${assign.due}</p>
                <button class="btn view-details-btn" data-index="${index}">View Details</button>
                <button class="btn view-submissions-btn" data-title="${assign.title}">View Submissions</button>
                <button class="btn-danger delete-btn" data-index="${index}">Delete</button>
            `;
            assignmentsList.appendChild(assignElement);
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function (e) {
                e.stopPropagation();
                const index = this.dataset.index;
                const assignment = assignments[index];
                
                // Create confirmation UI
                const confirmationHtml = `
                    <div class="confirmation-dialog">
                        <div class="confirmation-content">
                            <h3>Delete Assignment</h3>
                            <p>Are you sure you want to delete this assignment?</p>
                            <p><strong>${assignment.title}</strong></p>
                            <p>This action cannot be undone.</p>
                            <div class="confirmation-buttons">
                                <button id="confirm-delete-assignment" class="btn btn-danger" data-index="${index}">Delete</button>
                                <button id="cancel-delete-assignment" class="btn btn-secondary">Cancel</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Remove any existing dialogs
                const existingDialog = document.querySelector('.confirmation-dialog');
                if (existingDialog) {
                    existingDialog.remove();
                }
                
                // Add to DOM
                document.body.insertAdjacentHTML('beforeend', confirmationHtml);
                
                // Add event listeners
                document.getElementById('confirm-delete-assignment').addEventListener('click', function() {
                    const idx = this.getAttribute('data-index');
                    assignments.splice(idx, 1);
                    saveAssignments();
                    displayAssignments();
                    
                    // Remove the dialog
                    const dialog = document.querySelector('.confirmation-dialog');
                    if (dialog) dialog.remove();
                });
                
                document.getElementById('cancel-delete-assignment').addEventListener('click', function() {
                    const dialog = document.querySelector('.confirmation-dialog');
                    if (dialog) dialog.remove();
                });
                
                // Close dialog when clicking outside
                document.querySelector('.confirmation-dialog').addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.remove();
                    }
                });
            });
        });

        document.querySelectorAll('.view-submissions-btn').forEach(button => {
            button.addEventListener('click', function () {
                const title = this.dataset.title;
                openSubmissionsModal(title);
            });
        });

        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', function () {
                const idx = this.dataset.index;
                openAssignmentDetailsModal(assignments[idx]);
            });
        });
    }

    function openSubmissionsModal(assignmentTitle) {
        const modal = document.getElementById('submissions-modal');
        const content = document.getElementById('submissions-modal-content');
        const submissions = JSON.parse(localStorage.getItem('assignmentSubmissions') || '{}');
        let html = `<h2>Submissions for: ${assignmentTitle}</h2>`;
        let found = false;
        html += '<ul style="list-style:none; padding:0;">';
        for (const studentId in submissions) {
            if (submissions[studentId][assignmentTitle]) {
                found = true;
                const studentName = localStorage.getItem('currentStudentName') || studentId;
                html += `<li style='margin-bottom:1rem;'><b>Student:</b> ${studentId} <a href='${submissions[studentId][assignmentTitle].file}' target='_blank' class='btn'>View PDF</a> <span style='font-size:0.9em;color:#888;'>Submitted: ${new Date(submissions[studentId][assignmentTitle].date).toLocaleString()}</span></li>`;
            }
        }
        html += '</ul>';
        if (!found) html += '<p>No submissions yet for this assignment.</p>';
        content.innerHTML = html;
        modal.style.display = 'flex';
        document.getElementById('close-submissions-modal').onclick = function() {
            modal.style.display = 'none';
        };
    }

    function openAssignmentDetailsModal(assignment) {
        let modal = document.getElementById('assignment-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'assignment-details-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `<div class='modal-content-scrollable'><button id='close-assignment-details-modal' class='modal-close-btn'>&times;</button><div id='assignment-details-modal-content'></div></div>`;
            document.body.appendChild(modal);
        }
        const content = document.getElementById('assignment-details-modal-content');
        content.innerHTML = `<h2>${assignment.title}</h2><p>${assignment.description}</p><p><strong>Due:</strong> ${assignment.due}</p>`;
        modal.style.display = 'flex';
        document.getElementById('close-assignment-details-modal').onclick = function() {
            modal.style.display = 'none';
        };
    }

    addAssignmentBtn.addEventListener('click', () => {
        formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
    });

    assignmentForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const title = e.target.title.value;
        const description = e.target.description.value;
        const due = e.target.due.value;

        if (title && description && due) {
            const newAssignment = { title, description, due, dateCreated: new Date().toISOString() };
            assignments.push(newAssignment);
            saveAssignments();
            displayAssignments();
            e.target.reset();
            formContainer.style.display = 'none';
            
            // Log activity
            if (typeof logActivity === 'function') {
                logActivity('assignment', 'Created Assignment', `Created assignment: ${title}`, 'teacher_assignments.html');
            }
        }
    });

    // Initially hide the form
    formContainer.style.display = 'none';
    displayAssignments();
}); 