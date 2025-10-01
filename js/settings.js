document.addEventListener('DOMContentLoaded', function() {
    const clearUpdatesBtn = document.getElementById('clear-updates-btn');
    const clearCoursesBtn = document.getElementById('clear-courses-btn');
    const eraseTestsBtn = document.getElementById('erase-tests-btn');
    const clearAnnouncementsBtn = document.getElementById('clear-announcements-btn');
    const clearGradesBtn = document.getElementById('clear-grades-btn');
    const clearMessagesBtn = document.getElementById('clear-messages-btn');
    const clearAssignmentsBtn = document.getElementById('clear-assignments-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const rolesContainer = document.getElementById('roles-permissions-settings');
    const systemAccessRolesEl = document.getElementById('system-access-roles');
    const rolePermissionsMatrixEl = document.getElementById('role-permissions-matrix');
    const saveRolePermissionsBtn = document.getElementById('save-role-permissions-btn');
    const resetRolePermissionsBtn = document.getElementById('reset-role-permissions-btn');

    // ------- Roles & Permissions Helpers -------
    const ROLES_KEY = 'lms_roles';
    const PERMISSIONS_KEY = 'lms_permissions';
    const DEFAULT_ROLES = ['student','teacher','admin'];
    const DEFAULT_PERMISSIONS = {
        student: {
            canAccessSystem: true,
            canViewCourses: true,
            canTakeTests: true,
            canSubmitAssignments: true,
            canViewAnnouncements: true
        },
        teacher: {
            canAccessSystem: true,
            canCreateAssignments: true,
            canCreateAnnouncements: true,
            canCreateTests: true,
            canGradeAssignments: true,
            canViewCourses: true
        },
        admin: {
            canAccessSystem: true,
            canManageUsers: true,
            canManageCourses: true,
            canManageSystemSettings: true,
            canClearData: true
        }
    };

    function getRoles() {
        const saved = JSON.parse(localStorage.getItem(ROLES_KEY) || 'null');
        if (Array.isArray(saved) && saved.length) return saved;
        return DEFAULT_ROLES.slice();
    }
    function setRoles(roles) {
        localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
    }
    function getPermissions() {
        const saved = JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || 'null');
        if (saved && typeof saved === 'object') return saved;
        return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
    }
    function setPermissions(perms) {
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
    }

    function renderSystemAccess() {
        if (!systemAccessRolesEl) return;
        const roles = ['student','teacher','admin'];
        const enabled = getRoles();
        systemAccessRolesEl.innerHTML = roles.map(r => {
            const isEnabled = enabled.includes(r);
            return `<label class="checkbox" style="display:flex; align-items:center; gap:.6rem; font-size:1.6rem;">
                <input type="checkbox" data-role-access="${r}" ${isEnabled? 'checked':''}> ${r.charAt(0).toUpperCase()+r.slice(1)}
            </label>`;
        }).join('');
        systemAccessRolesEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function() {
                const role = this.getAttribute('data-role-access');
                const current = getRoles();
                if (!this.checked && role === 'admin') {
                    // Create confirmation dialog
                    const confirmationHtml = `
                        <div class="confirmation-dialog">
                            <div class="confirmation-content">
                                <h3>Warning: Admin Access</h3>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <p>Disabling Admin system access may lock you out of administrative functions.</p>
                                    <p>Are you sure you want to continue?</p>
                                </div>
                                <div class="confirmation-buttons">
                                    <button id="confirm-admin-disable" class="btn btn-danger">Disable Admin</button>
                                    <button id="cancel-admin-disable" class="btn btn-secondary">Cancel</button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Remove any existing dialogs
                    const existingDialog = document.querySelector('.confirmation-dialog');
                    if (existingDialog) {
                        existingDialog.remove();
                    }
                    
                    // Store the current checkbox reference
                    const checkbox = this;
                    
                    // Add to DOM
                    document.body.insertAdjacentHTML('beforeend', confirmationHtml);
                    
                    // Add event listeners
                    document.getElementById('confirm-admin-disable').addEventListener('click', function() {
                        const dialog = document.querySelector('.confirmation-dialog');
                        if (dialog) dialog.remove();
                        // Allow the checkbox to be unchecked
                        const current = getRoles();
                        const idx = current.indexOf(role);
                        if (idx !== -1) current.splice(idx,1);
                        setRoles(current);
                    });
                    
                    document.getElementById('cancel-admin-disable').addEventListener('click', function() {
                        const dialog = document.querySelector('.confirmation-dialog');
                        if (dialog) dialog.remove();
                        // Re-check the checkbox
                        checkbox.checked = true;
                    });
                    
                    // Close dialog when clicking outside
                    document.querySelector('.confirmation-dialog').addEventListener('click', function(e) {
                        if (e.target === this) {
                            this.remove();
                            // Re-check the checkbox if dialog is closed without confirmation
                            checkbox.checked = true;
                        }
                    });
                    
                    // Prevent default behavior (we'll handle it in the confirmation)
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                if (this.checked) {
                    if (!current.includes(role)) current.push(role);
                } else {
                    const idx = current.indexOf(role);
                    if (idx !== -1) current.splice(idx,1);
                }
                setRoles(current);
            });
        });
    }

    function renderPermissionsMatrix() {
        if (!rolePermissionsMatrixEl) return;
        const perms = getPermissions();
        // collect all permission keys across roles
        const allKeys = Array.from(new Set(Object.values(perms).flatMap(p => Object.keys(p))));
        // build simple table
        let html = '<table class="users-table"><thead><tr><th>Permission</th><th>Student</th><th>Teacher</th><th>Admin</th></tr></thead><tbody>';
        allKeys.forEach(key => {
            html += `<tr>
                <td style="text-transform:none;">${key}</td>
                <td style="text-align:center;"><input type="checkbox" data-perm="student:${key}" ${perms.student && perms.student[key] ? 'checked':''}></td>
                <td style="text-align:center;"><input type="checkbox" data-perm="teacher:${key}" ${perms.teacher && perms.teacher[key] ? 'checked':''}></td>
                <td style="text-align:center;"><input type="checkbox" data-perm="admin:${key}" ${perms.admin && perms.admin[key] ? 'checked':''}></td>
            </tr>`;
        });
        html += '</tbody></table>';
        rolePermissionsMatrixEl.innerHTML = html;
    }

    function initRolesUI() {
        if (!rolesContainer) return;
        renderSystemAccess();
        renderPermissionsMatrix();
        if (saveRolePermissionsBtn) {
            saveRolePermissionsBtn.onclick = function() {
                const perms = getPermissions();
                // read checkboxes
                rolePermissionsMatrixEl.querySelectorAll('input[type="checkbox"][data-perm]').forEach(cb => {
                    const token = cb.getAttribute('data-perm');
                    const [role, key] = token.split(':');
                    if (!perms[role]) perms[role] = {};
                    perms[role][key] = cb.checked;
                });
                setPermissions(perms);
                alert('Roles & permissions saved.');
            };
        }
        if (resetRolePermissionsBtn) {
            resetRolePermissionsBtn.onclick = async function() {
                // Create confirmation dialog
                const confirmationHtml = `
                    <div class="confirmation-dialog">
                        <div class="confirmation-content">
                            <h3>Reset Roles & Permissions</h3>
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>This will reset all roles and permissions to their default system settings.</p>
                                <p><strong>This action cannot be undone.</strong></p>
                            </div>
                            <div class="confirmation-buttons">
                                <button id="confirm-reset-roles" class="btn btn-danger">Reset to Defaults</button>
                                <button id="cancel-reset-roles" class="btn btn-secondary">Cancel</button>
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
                document.getElementById('confirm-reset-roles').addEventListener('click', function() {
                    setRoles(DEFAULT_ROLES.slice());
                    setPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
                    renderSystemAccess();
                    
                    const dialog = document.querySelector('.confirmation-dialog');
                    if (dialog) dialog.remove();
                    
                    // Show success message
                    showNotification('Roles and permissions have been reset to default settings.', 'success');
                });
                
                document.getElementById('cancel-reset-roles').addEventListener('click', function() {
                    const dialog = document.querySelector('.confirmation-dialog');
                    if (dialog) dialog.remove();
                });
                
                // Close dialog when clicking outside
                document.querySelector('.confirmation-dialog').addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.remove();
                    }
                });
            };
        }
    }

    // Clear Latest Updates Button
    if (clearUpdatesBtn) {
        clearUpdatesBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Clear Latest Updates</h3>
                        <p>Are you sure you want to clear the latest updates on the student dashboard?</p>
                        <p>This will clear:</p>
                        <ul>
                            <li>Latest Test</li>
                            <li>Latest Assignment</li>
                            <li>Latest Announcement</li>
                            <li>Latest Message</li>
                        </ul>
                        <div class="confirmation-buttons">
                            <button id="confirm-clear-updates" class="btn btn-danger">Clear</button>
                            <button id="cancel-clear-updates" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog');
            
            // Add event listeners
            document.getElementById('confirm-clear-updates').addEventListener('click', function() {
                localStorage.removeItem('allTests');
                localStorage.removeItem('allAssignments');
                localStorage.removeItem('allAnnouncements');
                localStorage.removeItem('allMessages');
                
                // Also clear any test results
                localStorage.removeItem('testResultsByStudent');
                
                alert('Latest updates have been cleared successfully!\n\nThe student dashboard will now show "No tests available yet", "No assignments available yet", "No announcements yet", and "No messages yet".');
                dialog.remove();
            });
            
            document.getElementById('cancel-clear-updates').addEventListener('click', function() {
                dialog.remove();
            });
        });
    }

    // Clear All Courses Button
    if (clearCoursesBtn) {
        clearCoursesBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Clear All Courses</h3>
                        <p>Are you sure you want to clear all courses from the student dashboard?</p>
                        <p>This will remove all courses from the "My Courses" section.</p>
                        <div class="confirmation-buttons">
                            <button id="confirm-clear-courses" class="btn btn-danger">Clear All</button>
                            <button id="cancel-clear-courses" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog:last-child');
            
            // Add event listeners
            document.getElementById('confirm-clear-courses').addEventListener('click', function() {
                localStorage.removeItem('lms_courses');
                alert('All courses have been cleared successfully!\n\nThe "My Courses" section will now show "No materials available."');
                dialog.remove();
            });
            
            document.getElementById('cancel-clear-courses').addEventListener('click', function() {
                dialog.remove();
            });
        });
    }

    // Erase All Tests Button
    if (eraseTestsBtn) {
        eraseTestsBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Erase All Tests</h3>
                        <p>Are you sure you want to permanently delete all tests?</p>
                        <p>This action cannot be undone.</p>
                        <p>This will remove:</p>
                        <ul>
                            <li>All created tests</li>
                            <li>All test results from students</li>
                            <li>Test data from student dashboard</li>
                        </ul>
                        <div class="confirmation-buttons">
                            <button id="confirm-erase-tests" class="btn btn-danger">Erase All</button>
                            <button id="cancel-erase-tests" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog:last-child');
            
            // Add event listeners
            document.getElementById('confirm-erase-tests').addEventListener('click', function() {
                localStorage.removeItem('allTests');
                localStorage.removeItem('lms_tests');
                localStorage.removeItem('testResultsByStudent');
                alert('All tests and test results have been erased successfully!\n\nStudents will no longer see any tests available.');
                dialog.remove();
            });
            
            document.getElementById('cancel-erase-tests').addEventListener('click', function() {
                dialog.remove();
            });
        });
    }

    // Clear Announcements Button
    if (clearAnnouncementsBtn) {
        clearAnnouncementsBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Clear All Announcements</h3>
                        <p>Are you sure you want to clear all announcements?</p>
                        <p>This will remove:</p>
                        <ul>
                            <li>All teacher announcements</li>
                            <li>Announcement data from student dashboard</li>
                        </ul>
                        <div class="confirmation-buttons">
                            <button id="confirm-clear-announcements" class="btn btn-danger">Clear All</button>
                            <button id="cancel-clear-announcements" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog:last-child');
            
            // Add event listeners
            document.getElementById('confirm-clear-announcements').addEventListener('click', function() {
                localStorage.removeItem('allAnnouncements');
                alert('All announcements have been cleared successfully!\n\nStudents will no longer see any announcements.');
                dialog.remove();
            });
            
            document.getElementById('cancel-clear-announcements').addEventListener('click', function() {
                dialog.remove();
            });
        });
    }

    // Clear Grades Button
    if (clearGradesBtn) {
        clearGradesBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Clear All Grades</h3>
                        <p>Are you sure you want to clear all grades?</p>
                        <p>This will remove:</p>
                        <ul>
                            <li>All student grades</li>
                            <li>Assignment grades</li>
                            <li>Grade data from student dashboard</li>
                            <li>This action cannot be undone!</li>
                        </ul>
                        <div class="confirmation-buttons">
                            <button id="confirm-clear-grades" class="btn btn-danger">Clear All</button>
                            <button id="cancel-clear-grades" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog:last-child');
            
            // Add event listeners
            document.getElementById('confirm-clear-grades').addEventListener('click', function() {
                // Clear all grade-related data
                localStorage.removeItem('allGrades');
                localStorage.removeItem('eduTech_grades');
                
                // Clear any grade statistics or cached data
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('grade') || key.includes('Grade'))) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                alert('All grades have been cleared successfully!\n\nThe gradebook has been reset and students will no longer see any grades.');
                dialog.remove();
            });
            
            document.getElementById('cancel-clear-grades').addEventListener('click', function() {
                dialog.remove();
            });
        });
    }

    // Clear Messages Button
    if (clearMessagesBtn) {
        clearMessagesBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Clear All Messages</h3>
                        <p>Are you sure you want to clear all messages?</p>
                        <p>This will remove:</p>
                        <ul>
                            <li>All student messages</li>
                            <li>Message data from student dashboard</li>
                        </ul>
                        <div class="confirmation-buttons">
                            <button id="confirm-clear-messages" class="btn btn-danger">Clear All</button>
                            <button id="cancel-clear-messages" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog:last-child');
            
            // Add event listeners
            document.getElementById('confirm-clear-messages').addEventListener('click', function() {
                localStorage.removeItem('allMessages');
                alert('All messages have been cleared successfully!\n\nStudents will no longer see any messages.');
                dialog.remove();
            });
            
            document.getElementById('cancel-clear-messages').addEventListener('click', function() {
                dialog.remove();
            });
        });
    }

    // Clear Assignments Button
    if (clearAssignmentsBtn) {
        clearAssignmentsBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Clear All Assignments</h3>
                        <p>Are you sure you want to clear all assignments?</p>
                        <p>This will remove:</p>
                        <ul>
                            <li>All teacher assignments</li>
                            <li>Assignment submissions</li>
                            <li>Assignment data from student dashboard</li>
                        </ul>
                        <div class="confirmation-buttons">
                            <button id="confirm-clear-assignments" class="btn btn-danger">Clear All</button>
                            <button id="cancel-clear-assignments" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog:last-child');
            
            // Add event listeners
            document.getElementById('confirm-clear-assignments').addEventListener('click', function() {
                localStorage.removeItem('allAssignments');
                localStorage.removeItem('assignmentSubmissions');
                
                // Clear assignment data from student dashboard
                const latestAssignmentEl = document.getElementById('latest-assignment');
                const assignmentsList = document.getElementById('assignments-list');
                
                if (latestAssignmentEl) latestAssignmentEl.innerHTML = '<p>No recent assignments.</p>';
                if (assignmentsList) assignmentsList.innerHTML = '<p>No assignments available at the moment.</p>';
                
                alert('All assignments and submissions have been cleared successfully!\n\nStudents will no longer see any assignments.');
                dialog.remove();
            });
            
            document.getElementById('cancel-clear-assignments').addEventListener('click', function() {
                dialog.remove();
            });
        });
    }

    // Clear All Data Button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Clear All Data</h3>
                        <p>⚠️ WARNING: Are you sure you want to clear ALL data?</p>
                        <p>This action cannot be undone!</p>
                        <p>This will remove:</p>
                        <ul>
                            <li>All tests and test results</li>
                            <li>All announcements</li>
                            <li>All grades</li>
                            <li>All messages</li>
                            <li>All assignments and submissions</li>
                            <li>All courses</li>
                            <li>All student data</li>
                        </ul>
                        <p>This will completely reset the system.</p>
                        <div class="confirmation-buttons">
                            <button id="confirm-clear-all" class="btn btn-danger">Clear All</button>
                            <button id="cancel-clear-all" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to DOM
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            const dialog = document.querySelector('.confirmation-dialog:last-child');
            
            // Add event listeners
            document.getElementById('confirm-clear-all').addEventListener('click', function() {
                // Clear all localStorage data except user preferences
                const darkMode = localStorage.getItem('dark-mode');
                const currentStudentId = localStorage.getItem('currentStudentId');
                const currentStudentName = localStorage.getItem('currentStudentName');
                
                // Clear localStorage completely
                localStorage.clear();
                
                // Restore user preferences
                if (darkMode) localStorage.setItem('dark-mode', darkMode);
                if (currentStudentId) localStorage.setItem('currentStudentId', currentStudentId);
                if (currentStudentName) localStorage.setItem('currentStudentName', currentStudentName);
                
                alert('All data has been cleared successfully!\n\nThe system has been completely reset. Only user preferences have been preserved.');
                
                // Remove the dialog
                dialog.remove();
            });
            
            // Add cancel button event listener
            document.getElementById('cancel-clear-all').addEventListener('click', function() {
                dialog.remove();
            });
            
            // Close dialog when clicking outside
            dialog.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.remove();
                }
            });
        });
    }

    // Add visual feedback for button clicks
    document.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            // Add a brief visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Initialize roles UI if present
    initRolesUI();
}); 