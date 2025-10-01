// =========================
// LMS Main Script
// =========================
// All dynamic logic for student/teacher dashboards, course management, and UI

// =========================
// Activity Tracking System
// =========================

class ActivityTracker {
    static logActivity(type, title, description, targetUrl = null) {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const userId = currentUser.email || currentUser.id;
        const activity = {
            id: Date.now().toString(),
            type: type,
            title: title,
            description: description,
            timestamp: new Date().toISOString(),
            targetUrl: targetUrl,
            userId: userId,
            userType: currentUser.userType
        };

        // Store in user-specific activity log
        const storageKey = `user_activities_${userId}`;
        let activities = JSON.parse(localStorage.getItem(storageKey) || '[]');
        activities.unshift(activity); // Add to beginning (newest first)
        
        // Keep only last 50 activities to prevent storage bloat
        activities = activities.slice(0, 50);
        
        localStorage.setItem(storageKey, JSON.stringify(activities));
    }

    static getActivities(userId) {
        const storageKey = `user_activities_${userId}`;
        return JSON.parse(localStorage.getItem(storageKey) || '[]');
    }
}

// Global activity logging functions
window.logActivity = ActivityTracker.logActivity;

// =========================
// Utility Functions
// =========================

function getFromStorage(key) {
   return JSON.parse(localStorage.getItem(key) || '[]');
}

function setInStorage(key, data) {
   localStorage.setItem(key, JSON.stringify(data));
}

// Authentication and Session Management

function getCurrentUser() {
   return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function isLoggedIn() {
   return getCurrentUser() !== null;
}

function logout() {
   // Log logout activity before clearing user data
   if (typeof logActivity === 'function') {
      logActivity('login', 'Logged Out', 'User logged out of the system');
   }
   localStorage.removeItem('currentUser');
   window.location.href = 'login.html';
}

function checkAuth() {
   const currentUser = getCurrentUser();
   if (!currentUser) {
      window.location.href = 'login.html';
      return false;
   }
   return currentUser;
}

function checkUserType(allowedTypes) {
   const currentUser = checkAuth();
   if (!currentUser) return false;
   
   if (!allowedTypes.includes(currentUser.userType)) {
      alert('Access denied. You do not have permission to view this page.');
      logout();
      return false;
   }
   return currentUser;
}


// =========================
// Roles & Permissions (Global)
// =========================
const ROLES_KEY = 'lms_roles';
const PERMISSIONS_KEY = 'lms_permissions';
const DEFAULT_ROLES_ENABLED = ['student','teacher','admin'];
const DEFAULT_PERMISSIONS_MAP = {
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

function getEnabledRoles() {
  const saved = JSON.parse(localStorage.getItem(ROLES_KEY) || 'null');
  if (Array.isArray(saved) && saved.length) return saved;
  return DEFAULT_ROLES_ENABLED.slice();
}

function getPermissionsConfig() {
  const saved = JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || 'null');
  if (saved && typeof saved === 'object') return saved;
  return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_MAP));
}

function isRoleEnabled(role) {
  return getEnabledRoles().includes(role);
}

function hasPermission(role, permissionKey) {
  const perms = getPermissionsConfig();
  return !!(perms[role] && perms[role][permissionKey]);
}

function enforceGlobalAccess() {
  try {
    const current = getCurrentUser();
    if (!current) return;
    const role = current.userType;
    if (!isRoleEnabled(role) || !hasPermission(role, 'canAccessSystem')) {
      alert('Your account role does not currently have access to the system. Please contact an administrator.');
      logout();
    }
  } catch (_) {
    // fail-safe: do nothing
  }
}

// =========================
// Page Navigation Activity Logging
// =========================

// Log page visits automatically
document.addEventListener('DOMContentLoaded', function() {
    // Log page visit activity
    const pageName = document.title || window.location.pathname.split('/').pop().replace('.html', '');
    if (typeof logActivity === 'function') {
        logActivity('navigation', 'Visited Page', `Accessed ${pageName}`, window.location.href);
    }
});

// =========================
// Form Enhancement Functions
// =========================

// Toggle password visibility
function togglePassword(inputId) {
   const input = document.getElementById(inputId);
   if (!input) {
      return;
   }
   
   const inputGroup = input.closest('.input-group');
   if (!inputGroup) {
      return;
   }
   
   const toggleBtn = inputGroup.querySelector('.password-toggle');
   if (!toggleBtn) {
      return;
   }
   
   const icon = toggleBtn.querySelector('i');
   if (!icon) {
      return;
   }
   
   if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
   } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
   }
}

// Check password strength
function checkPasswordStrength(password) {
   let strength = 0;
   let feedback = '';
   
   if (password.length >= 8) strength++;
   if (/[a-z]/.test(password)) strength++;
   if (/[A-Z]/.test(password)) strength++;
   if (/[0-9]/.test(password)) strength++;
   if (/[^A-Za-z0-9]/.test(password)) strength++;
   
   if (strength < 3) {
      feedback = 'Weak password';
      return { strength: 'weak', feedback };
   } else if (strength < 5) {
      feedback = 'Medium strength password';
      return { strength: 'medium', feedback };
   } else {
      feedback = 'Strong password';
      return { strength: 'strong', feedback };
   }
}

// Show forgot password modal
function showForgotPassword() {
   document.getElementById('forgotPasswordModal').classList.add('show');
}

// Close forgot password modal
function closeForgotPassword() {
   document.getElementById('forgotPasswordModal').classList.remove('show');
}

// Show terms modal
function showTerms() {
   document.getElementById('termsModal').classList.add('show');
}

// Close terms modal
function closeTerms() {
   document.getElementById('termsModal').classList.remove('show');
}

// Show privacy modal
function showPrivacy() {
   document.getElementById('privacyModal').classList.add('show');
}

// Close privacy modal
function closePrivacy() {
   document.getElementById('privacyModal').classList.remove('show');
}

// Initialize form enhancements
function initializeFormEnhancements() {
   // Password strength indicator for login and register forms
   const passwordInput = document.getElementById('password');
   if (passwordInput) {
      passwordInput.addEventListener('input', function() {
         const password = this.value;
         const strengthDiv = document.getElementById('passwordStrength');
         
         if (strengthDiv) {
            if (password.length > 0) {
               const result = checkPasswordStrength(password);
               strengthDiv.textContent = result.feedback;
               strengthDiv.className = 'password-strength ' + result.strength;
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Password confirmation check for register form
   const confirmPasswordInput = document.getElementById('confirmPassword');
   if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', function() {
         const password = document.getElementById('password').value;
         const confirmPassword = this.value;
         const strengthDiv = document.getElementById('confirmPasswordStrength');
         
         if (strengthDiv) {
            if (confirmPassword.length > 0) {
               if (password === confirmPassword) {
                  strengthDiv.textContent = 'Passwords match';
                  strengthDiv.className = 'password-strength strong';
               } else {
                  strengthDiv.textContent = 'Passwords do not match';
                  strengthDiv.className = 'password-strength weak';
               }
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Password strength indicator for update form new password
   const newPasswordInput = document.getElementById('newPassword');
   if (newPasswordInput) {
      newPasswordInput.addEventListener('input', function() {
         const password = this.value;
         const strengthDiv = document.getElementById('newPasswordStrength');
         
         if (strengthDiv) {
            if (password.length > 0) {
               const result = checkPasswordStrength(password);
               strengthDiv.textContent = result.feedback;
               strengthDiv.className = 'password-strength ' + result.strength;
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Password confirmation check for update form
   const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
   if (confirmNewPasswordInput) {
      confirmNewPasswordInput.addEventListener('input', function() {
         const newPassword = document.getElementById('newPassword').value;
         const confirmPassword = this.value;
         const strengthDiv = document.getElementById('confirmNewPasswordStrength');
         
         if (strengthDiv) {
            if (confirmPassword.length > 0) {
               if (newPassword === confirmPassword) {
                  strengthDiv.textContent = 'Passwords match';
                  strengthDiv.className = 'password-strength strong';
               } else {
                  strengthDiv.textContent = 'Passwords do not match';
                  strengthDiv.className = 'password-strength weak';
               }
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Password strength indicator for teacher update form new password
   const teacherNewPasswordInput = document.getElementById('teacherNewPassword');
   if (teacherNewPasswordInput) {
      teacherNewPasswordInput.addEventListener('input', function() {
         const password = this.value;
         const strengthDiv = document.getElementById('teacherNewPasswordStrength');
         
         if (strengthDiv) {
            if (password.length > 0) {
               const result = checkPasswordStrength(password);
               strengthDiv.textContent = result.feedback;
               strengthDiv.className = 'password-strength ' + result.strength;
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Password confirmation check for teacher update form
   const teacherConfirmNewPasswordInput = document.getElementById('teacherConfirmNewPassword');
   if (teacherConfirmNewPasswordInput) {
      teacherConfirmNewPasswordInput.addEventListener('input', function() {
         const newPassword = document.getElementById('teacherNewPassword').value;
         const confirmPassword = this.value;
         const strengthDiv = document.getElementById('teacherConfirmNewPasswordStrength');
         
         if (strengthDiv) {
            if (confirmPassword.length > 0) {
               if (newPassword === confirmPassword) {
                  strengthDiv.textContent = 'Passwords match';
                  strengthDiv.className = 'password-strength strong';
               } else {
                  strengthDiv.textContent = 'Passwords do not match';
                  strengthDiv.className = 'password-strength weak';
               }
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Password strength indicator for admin update form new password
   const adminNewPasswordInput = document.getElementById('adminNewPassword');
   if (adminNewPasswordInput) {
      adminNewPasswordInput.addEventListener('input', function() {
         const password = this.value;
         const strengthDiv = document.getElementById('adminNewPasswordStrength');
         
         if (strengthDiv) {
            if (password.length > 0) {
               const result = checkPasswordStrength(password);
               strengthDiv.textContent = result.feedback;
               strengthDiv.className = 'password-strength ' + result.strength;
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Password confirmation check for admin update form
   const adminConfirmNewPasswordInput = document.getElementById('adminConfirmNewPassword');
   if (adminConfirmNewPasswordInput) {
      adminConfirmNewPasswordInput.addEventListener('input', function() {
         const newPassword = document.getElementById('adminNewPassword').value;
         const confirmPassword = this.value;
         const strengthDiv = document.getElementById('adminConfirmNewPasswordStrength');
         
         if (strengthDiv) {
            if (confirmPassword.length > 0) {
               if (newPassword === confirmPassword) {
                  strengthDiv.textContent = 'Passwords match';
                  strengthDiv.className = 'password-strength strong';
               } else {
                  strengthDiv.textContent = 'Passwords do not match';
                  strengthDiv.className = 'password-strength weak';
               }
            } else {
               strengthDiv.textContent = '';
               strengthDiv.className = 'password-strength';
            }
         }
      });
   }

   // Forgot password form submission
   const forgotPasswordForm = document.getElementById('forgotPasswordForm');
   if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', function(e) {
         e.preventDefault();
         const email = document.getElementById('resetEmail').value;
         
         // Here you would typically send the email to your backend
         alert('Password reset link has been sent to ' + email);
         closeForgotPassword();
      });
   }

   // Register form validation and user creation
   const registerForm = document.getElementById('registerForm');
   if (registerForm) {
      registerForm.addEventListener('submit', function(e) {
         e.preventDefault();
         
         const name = document.getElementById('name').value;
         const email = document.getElementById('email').value;
         const password = document.getElementById('password').value;
         const confirmPassword = document.getElementById('confirmPassword').value;
         const userType = document.querySelector('select[name="user_type"]').value;
         const terms = document.getElementById('terms').checked;
         
         // Roles enforcement: disallow registration into disabled/no-access roles
         try {
           if (!isRoleEnabled(userType)) {
             alert('This role is currently disabled. Please contact the administrator.');
             return;
           }
           if (!hasPermission(userType, 'canAccessSystem')) {
             alert('This role does not currently have access to the system. Please contact the administrator.');
             return;
           }
         } catch (_) { /* safe fallback if helpers not yet loaded */ }

         if (!name || !email || !password || !confirmPassword || !userType) {
            alert('Please fill in all required fields');
            return;
         }
         
         // Basic email validation
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
         }
         
         // Password validation
         if (password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
         }
         
         if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
         }
         
         if (!terms) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
         }
         
         // Check if user already exists
         const users = JSON.parse(localStorage.getItem('lms_users') || '[]');
         const existingUser = users.find(user => user.email === email);
         
         if (existingUser) {
            alert('A user with this email already exists. Please use a different email or login.');
            return;
         }
         
         // Create new user
         const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: password, // In a real app, this should be hashed
            userType: userType,
            createdAt: new Date().toISOString(),
            profile: {
               avatar: null,
               bio: '',
               phone: '',
               address: ''
            }
         };
         
         // Add user to storage
         users.push(newUser);
         localStorage.setItem('lms_users', JSON.stringify(users));
         
         // Set current user session
         localStorage.setItem('currentUser', JSON.stringify(newUser));
         
         alert('Account created successfully! Welcome to eduTechzam.');
         
         // Redirect based on user type
         if (userType === 'student') {
            window.location.href = 'home.html';
         } else if (userType === 'teacher') {
            window.location.href = 'teacher_home.html';
         }
      });
   }

       // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
       modal.addEventListener('click', function(e) {
          if (e.target === this) {
             this.classList.remove('show');
          }
       });
    });
}



// Initialize form enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
   initializeFormEnhancements();
   enforceGlobalAccess();
   initializeCourseSearch();
});

// Also initialize when script loads (for pages that don't wait for DOMContentLoaded)
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', function() {
      initializeFormEnhancements();
      initializeCourseSearch();
   });
} else {
   initializeFormEnhancements();
   initializeCourseSearch();
}

// =========================
// Theme/Dark Mode Toggle
// =========================
// Handles dark/light mode switching and persistence

let toggleBtn = document.getElementById('toggle-btn');
let body = document.body;
let darkMode = localStorage.getItem('dark-mode');

const enableDarkMode = () =>{
   toggleBtn.classList.replace('fa-sun', 'fa-moon');
   body.classList.add('dark');
   localStorage.setItem('dark-mode', 'enabled');
}

const disableDarkMode = () =>{
   toggleBtn.classList.replace('fa-moon', 'fa-sun');
   body.classList.remove('dark');
   localStorage.setItem('dark-mode', 'disabled');
}

if(darkMode === 'enabled'){
   enableDarkMode();
}

toggleBtn.onclick = (e) => {
   darkMode = localStorage.getItem('dark-mode');
   if(darkMode === 'disabled'){
      enableDarkMode();
   }else{
      disableDarkMode();
   }
}

let profile = document.querySelector('.header .flex .profile');

document.querySelector('#user-btn').onclick = () =>{
   profile.classList.toggle('active');
   search.classList.remove('active');
}

let search = document.querySelector('.header .flex .search-form');

document.querySelector('#search-btn').onclick = () =>{
   search.classList.toggle('active');
   profile.classList.remove('active');
}

let sideBar = document.querySelector('.side-bar');

document.querySelector('#menu-btn').onclick = () =>{
   sideBar.classList.toggle('active');
   body.classList.toggle('active');
}

document.querySelector('#close-btn').onclick = () =>{
   sideBar.classList.remove('active');
   body.classList.remove('active');
}

window.onscroll = () =>{
   profile.classList.remove('active');
   search.classList.remove('active');

   if(window.innerWidth < 1200){
      sideBar.classList.remove('active');
      body.classList.remove('active');
   }
}

// =========================
// Student Dashboard: Tests, Assignments, Announcements
// =========================

function showStudentTests() {
  const tests = JSON.parse(localStorage.getItem('allTests') || '[]');
  const container = document.getElementById('student-tests-list');
  if (!container) return;
  if (!tests.length) {
    container.innerHTML = '<p>No tests available yet.</p>';
    return;
  }
  container.innerHTML = tests.map(test => `
    <div class="box" style="margin-bottom:2rem; box-shadow:0 4px 24px rgba(0,0,0,0.10); background:var(--white); padding:2rem; border-radius:.5rem;">
      <h3>${test.title}</h3>
      <p>${test.description}</p>
      <p><strong>Date:</strong> ${test.date}</p>
      <button class="btn">Take Test</button>
    </div>
  `).join('');
}

function showStudentAssignments() {
  const assignments = JSON.parse(localStorage.getItem('allAssignments') || '[]');
  const container = document.getElementById('student-assignments-list');
  if (!container) return;
  if (!assignments.length) {
    container.innerHTML = '<p>No assignments available yet.</p>';
    return;
  }
  const studentId = localStorage.getItem('currentStudentId') || 'student';
  const submissions = JSON.parse(localStorage.getItem('assignmentSubmissions') || '{}');
  container.innerHTML = '';
  assignments.forEach((a, idx) => {
    const box = document.createElement('div');
    box.className = 'box';
    box.innerHTML = `
      <h3>${a.title}</h3>
      <p>${a.description}</p>
      <p><strong>Due:</strong> ${a.due}</p>
      <button class="btn view-details-btn" data-idx="${idx}">View Details</button>
      <button class="btn submit-assignment-btn" data-idx="${idx}">${submissions[studentId] && submissions[studentId][a.title] ? 'View Submission' : 'View & Submit'}</button>
      ${submissions[studentId] && submissions[studentId][a.title] ? '<span class="submitted-status">Submitted</span>' : ''}
    `;
    container.appendChild(box);
  });
  // Add click listeners for details
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = this.getAttribute('data-idx');
      openAssignmentDetailsModal(assignments[idx]);
    };
  });
  // Add click listeners for submission
  document.querySelectorAll('.submit-assignment-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = this.getAttribute('data-idx');
      openAssignmentSubmitModal(assignments[idx]);
    };
  });
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

function openAssignmentSubmitModal(assignment) {
  let modal = document.getElementById('assignment-submit-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'assignment-submit-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class='modal-content-scrollable'><button id='close-assignment-submit-modal' class='modal-close-btn'>&times;</button><div id='assignment-submit-modal-content'></div></div>`;
    document.body.appendChild(modal);
  }
  const content = document.getElementById('assignment-submit-modal-content');
  const studentId = localStorage.getItem('currentStudentId') || 'student';
  const submissions = JSON.parse(localStorage.getItem('assignmentSubmissions') || '{}');
  const alreadySubmitted = submissions[studentId] && submissions[studentId][assignment.title];
  let html = `<h2>${assignment.title}</h2><p>${assignment.description}</p><p><strong>Due:</strong> ${assignment.due}</p>`;
  if (alreadySubmitted) {
    html += `<p class='submitted-status'>You have already submitted this assignment.</p><a href='${alreadySubmitted.file}' target='_blank' class='btn'>View Submitted PDF</a>`;
  } else {
    html += `
      <form id='submit-assignment-form'>
        <label for='assignment-pdf'>Submit as PDF:</label><br>
        <input type='file' id='assignment-pdf' accept='application/pdf' required><br><br>
        <button type='submit' class='btn'>Submit PDF</button>
      </form>
      <div id='submit-assignment-msg'></div>
    `;
  }
  content.innerHTML = html;
  modal.style.display = 'flex';
  document.getElementById('close-assignment-submit-modal').onclick = function() {
    modal.style.display = 'none';
  };
  if (!alreadySubmitted) {
    const form = document.getElementById('submit-assignment-form');
    form.onsubmit = function(e) {
      e.preventDefault();
      const fileInput = document.getElementById('assignment-pdf');
      const file = fileInput.files[0];
      if (!file || file.type !== 'application/pdf') {
        document.getElementById('submit-assignment-msg').textContent = 'Please select a PDF file.';
        return;
      }
      const reader = new FileReader();
      reader.onload = function(ev) {
        const base64 = ev.target.result;
        let submissions = JSON.parse(localStorage.getItem('assignmentSubmissions') || '{}');
        if (!submissions[studentId]) submissions[studentId] = {};
        submissions[studentId][assignment.title] = { file: base64, date: new Date().toISOString() };
        localStorage.setItem('assignmentSubmissions', JSON.stringify(submissions));
        
        // Log assignment submission activity
        if (typeof logActivity === 'function') {
          logActivity('assignment', 'Assignment Submitted', `Submitted assignment: ${assignment.title}`, 'assignments.html');
        }
        
        document.getElementById('submit-assignment-msg').textContent = 'Assignment submitted!';
        showStudentAssignments();
        setTimeout(() => { document.getElementById('assignment-submit-modal').style.display = 'none'; }, 1200);
      };
      reader.readAsDataURL(file);
    };
  }
}

function showStudentAnnouncements() {
  const announcements = JSON.parse(localStorage.getItem('allAnnouncements') || '[]');
  const container = document.getElementById('student-announcements-list');
  if (!container) return;
  if (!announcements.length) {
    container.innerHTML = '<p>No announcements yet.</p>';
    return;
  }
  container.innerHTML = announcements.map(a => `
    <div class="box" style="margin-bottom:2rem; box-shadow:0 4px 24px rgba(0,0,0,0.10); background:var(--white); padding:2rem; border-radius:.5rem;">
      <h3>${a.title}</h3>
      <p>${a.message}</p>
      <p><strong>Date:</strong> ${a.date || ''}</p>
    </div>
  `).join('');
}

// =========================
// Course Search Functionality
// =========================

function searchCourses(searchTerm) {
  const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
  if (!searchTerm.trim()) {
    return courses; // Return all courses if search is empty
  }
  
  const term = searchTerm.toLowerCase().trim();
  return courses.filter(course => {
    return (
      (course.title && course.title.toLowerCase().includes(term)) ||
      (course.description && course.description.toLowerCase().includes(term)) ||
      (course.teacher && course.teacher.toLowerCase().includes(term)) ||
      (course.lessons && course.lessons.toString().toLowerCase().includes(term))
    );
  });
}

function displayCourses(courses, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!courses.length) {
    container.innerHTML = '<div class="no-results"><p>No courses found matching your search.</p></div>';
    return;
  }
  
  container.innerHTML = courses.map((c, idx) => {
    const hasMaterial = (c.image && c.image !== '') || (c.pdf && c.pdf !== '');
    return `
    <div class="box course-box">
      <div class="tutor">
        ${c.image ? `<img src="${c.image}" alt="" class="course-image">` : ''}
        <div class="info">
          <h3>${c.teacher || ''}</h3>
        </div>
      </div>
      <h3 class="title">${c.title}</h3>
      <p>${c.description}</p>
      <p><strong>Lessons:</strong> ${c.lessons}</p>
      <div class="course-btn-group">
        ${c.pdf ? `<a href="${c.pdf}" class="inline-option-btn" download target="_blank"><i class="fas fa-download"></i> Download</a>` : ''}
        ${c.video ? `<button class="inline-option-btn" onclick="openVideoModal('${c.video}')"><i class="fas fa-play"></i> Watch</button>` : ''}
        ${hasMaterial ? `<button class="inline-btn" onclick="openStudentCourseModal(${idx})"><i class="fas fa-eye"></i> View Materials</button>` : ''}
      </div>
    </div>
    `;
  }).join('');
}

function initializeCourseSearch() {
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('.search-form input[name="search_box"]');
  
  if (searchForm && searchInput) {
    // Handle form submission
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      performCourseSearch();
    });
    
    // Handle real-time search as user types
    searchInput.addEventListener('input', function() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        performCourseSearch();
      }, 300); // Debounce search by 300ms
    });
    
    // Clear search when input is cleared
    searchInput.addEventListener('keyup', function(e) {
      if (e.key === 'Escape' || this.value === '') {
        this.value = '';
        performCourseSearch();
      }
    });
  }
}

function performCourseSearch() {
  const searchInput = document.querySelector('.search-form input[name="search_box"]');
  if (!searchInput) return;
  
  const searchTerm = searchInput.value;
  const filteredCourses = searchCourses(searchTerm);
  
  // Update courses display based on current page
  if (document.getElementById('home-courses-list')) {
    displayCourses(filteredCourses, 'home-courses-list');
    // Handle no materials message
    const msg = document.getElementById('no-materials-msg');
    if (msg) {
      msg.style.display = filteredCourses.length ? 'none' : '';
    }
  }
  
  if (document.getElementById('student-courses-list')) {
    displayCourses(filteredCourses, 'student-courses-list');
  }
}

// =========================
// Home Page: Courses List
// =========================

function showHomeCourses() {
  const container = document.getElementById('home-courses-list');
  const msg = document.getElementById('no-materials-msg');
  if (!container) return;
  const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
  if (!courses.length) {
    if (msg) msg.style.display = '';
    return;
  }
  if (msg) msg.style.display = 'none';
  displayCourses(courses, 'home-courses-list');
}

let studentCourseModalCurrentIdx = null;
let studentCourseModalInterval = null;

function openStudentCourseModal(course, idx) {
  studentCourseModalCurrentIdx = idx;
  let html = `<h2>Materials for ${course.title}</h2>`;
  let hasMaterial = false;
  if (course.image && course.image !== '') {
    html += `<p><a href="${course.image}" target="_blank" class="btn">View Image</a></p>`;
    hasMaterial = true;
  }
  if (course.pdf && course.pdf !== '') {
    html += `<p><a href="${course.pdf}" target="_blank" class="btn">View PDF</a></p>`;
    hasMaterial = true;
  }
  if (!hasMaterial) {
    html += `<p>No materials available for this course.</p>`;
  }
  document.getElementById('student-course-modal-content').innerHTML = html;
  document.getElementById('student-course-modal').style.display = 'flex';
  // Start polling for real-time updates
  if (studentCourseModalInterval) clearInterval(studentCourseModalInterval);
  studentCourseModalInterval = setInterval(() => {
    const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
    if (!courses[studentCourseModalCurrentIdx]) {
      closeStudentCourseModal();
      return;
    }
    const updated = courses[studentCourseModalCurrentIdx];
    let newHtml = `<h2>Materials for ${updated.title}</h2>`;
    let hasMaterialUpdate = false;
    if (updated.image && updated.image !== '') {
      newHtml += `<p><a href="${updated.image}" target="_blank" class="btn">View Image</a></p>`;
      hasMaterialUpdate = true;
    }
    if (updated.pdf && updated.pdf !== '') {
      newHtml += `<p><a href="${updated.pdf}" target="_blank" class="btn">View PDF</a></p>`;
      hasMaterialUpdate = true;
    }
    if (!hasMaterialUpdate) {
      newHtml += `<p>No materials available for this course.</p>`;
    }
    if (document.getElementById('student-course-modal').style.display === 'flex') {
      let currentHtml = document.getElementById('student-course-modal-content').innerHTML;
      if (currentHtml !== newHtml) {
        document.getElementById('student-course-modal-content').innerHTML = newHtml;
      }
    }
  }, 1500);
}

function closeStudentCourseModal() {
  document.getElementById('student-course-modal').style.display = 'none';
  studentCourseModalCurrentIdx = null;
  if (studentCourseModalInterval) clearInterval(studentCourseModalInterval);
}

function showStudentCourses() {
  const container = document.getElementById('student-courses-list');
  if (!container) return;
  const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
  if (!courses.length) {
    container.innerHTML = '<p>No courses available yet.</p>';
    return;
  }
  displayCourses(courses, 'student-courses-list');
}

// Modal for student course view
if (!document.getElementById('student-course-modal')) {
  const modal = document.createElement('div');
  modal.id = 'student-course-modal';
  modal.style = 'display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:2000; align-items:center; justify-content:center;';
  modal.innerHTML = `<div style="position:relative; max-width:90vw; max-height:90vh; background:#fff; border-radius:.5rem; padding:2rem; overflow-y:auto;">
    <button onclick="closeStudentCourseModal()" style="position:absolute; top:1rem; right:1rem; background:#fff; border:none; border-radius:50%; width:2.5rem; height:2.5rem; font-size:2rem; cursor:pointer;">&times;</button>
    <div id="student-course-modal-content" class="course-modal-content"></div>
  </div>`;
  document.body.appendChild(modal);
}

window.openStudentCourseModal = function(idx) {
  const courses = JSON.parse(localStorage.getItem('lms_courses') || '[]');
  openStudentCourseModal(courses[idx], idx);
}

window.closeStudentCourseModal = closeStudentCourseModal;

document.addEventListener('DOMContentLoaded', function() {
  // Clear any existing sample tests from localStorage
  const existingTests = JSON.parse(localStorage.getItem('allTests')) || [];
  if (existingTests.length > 0) {
    // Remove sample tests (those with IDs starting with 'sample-')
    const filteredTests = existingTests.filter(test => !test.id.startsWith('sample-'));
    localStorage.setItem('allTests', JSON.stringify(filteredTests));
  }

  // --- Login/Register Logic ---
  const loginForm = document.getElementById('loginForm');
  console.log('Login form found:', loginForm);
  console.log('Current URL:', window.location.href);
  
  



  // --- Logout Logic ---
  const logoutBtn = document.querySelector('.header .flex .profile .flex-btn .option-btn');
  if(logoutBtn && logoutBtn.textContent.trim().toLowerCase() === 'logout') {
    logoutBtn.onclick = () => {
      logout();
    }
  }

  if (document.getElementById('courses-list')) {
    renderCourses();
    document.getElementById('courseForm').onsubmit = addOrEditCourse;
    handleCourseFileInputs && handleCourseFileInputs();
  }
  showHomeCourses();
  showStudentCourses();
  updateLatestTestPreview();
  updateLatestAssignmentPreview();
  updateLatestAnnouncementPreview();
  updateLatestMessagePreview();

  // --- test.html ---
  if (document.getElementById('student-tests-list')) {
    function showStudentTests() {
      const tests = JSON.parse(localStorage.getItem('lms_tests') || '[]');
      const container = document.getElementById('student-tests-list');
      if (!tests.length) {
        container.innerHTML = '<p>No tests available yet.</p>';
        return;
      }
      container.innerHTML = tests.map(test => {
        let html = `<h2>${test.title}</h2><p>${test.description}</p><form id='takeTestForm'>`;
        test.questions.forEach((q, i) => {
          html += `<div class='test-question'><strong>Q${i+1}: ${q.question}</strong><br>`;
          q.options.forEach((opt, j) => {
            if (opt && opt.trim() !== '') {
              html += `<label class='test-option'><input type='radio' name='q${i}' value='${opt}' required> ${opt}</label>`;
            }
          });
          html += '</div>';
        });
        html += `<button type='submit' class='btn'>Submit Test</button></form>`;
        return html;
      }).join('');
    }
    showStudentTests();
  }

  // --- teacher_messages.html ---
  if (document.getElementById('message-list')) {
    const messages = [
      {title: 'Student Question', body: 'Can you clarify the requirements for the next assignment?'},
      {title: 'Assignment Submission', body: 'A student has submitted their assignment for review.'},
      {title: 'Meeting Request', body: 'A student has requested a meeting to discuss their progress.'}
    ];
    const showMessage = function(idx) {
      document.getElementById('message-title').textContent = messages[idx].title;
      document.getElementById('message-body').textContent = messages[idx].body;
    }
    const messageList = document.getElementById('message-list');
    if (messageList) {
      const buttons = messageList.getElementsByTagName('button');
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', () => {
          showMessage(i);
        });
      }
    }
  }

  // --- teacher_assignments.html ---
  if (document.getElementById('assignmentForm')) {
    document.getElementById('assignmentForm').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const title = form.title.value;
      const description = form.description.value;
      const due = form.due.value;
      const assignments = getFromStorage('allAssignments');
      const editIndex = form.editIndex ? form.editIndex.value : '';

      if (editIndex) {
        assignments[editIndex] = { title, description, due };
        alert('Assignment updated! Students will now see it.');
      } else {
        assignments.push({ title, description, due });
        alert('Assignment created! Students will now see it.');
      }
      
      setInStorage('allAssignments', assignments);
      form.reset();
      if(form.editIndex) form.editIndex.remove();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.textContent = 'Create Assignment';
      // Refresh the assignments display
      if (typeof displayAssignments === 'function') {
        displayAssignments();
      }
    };
  }

  // --- teacher_announcements.html ---
  if (document.getElementById('announcement-list')) {
    const announcements = [
      {title: 'System Maintenance - May 10', body: 'The platform will be under maintenance from 2am to 4am on May 10.'},
      {title: 'New Assignment Posted', body: 'A new assignment has been posted for your class.'},
      {title: 'Parent-Teacher Meeting', body: 'A parent-teacher meeting is scheduled for next week.'}
    ];
    window.showAnnouncement = function(idx) {
      document.getElementById('announcement-title').textContent = announcements[idx].title;
      document.getElementById('announcement-body').textContent = announcements[idx].body;
    }
  }
  if (document.getElementById('announcementForm')) {
    document.getElementById('announcementForm').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const title = form.title.value;
      const message = form.message.value;
      const announcements = JSON.parse(localStorage.getItem('allAnnouncements') || '[]');
      announcements.push({ title, message, date: new Date().toLocaleDateString() });
      localStorage.setItem('allAnnouncements', JSON.stringify(announcements));
      alert('Announcement created! Students will now see it.');
      form.reset();
    };
  }

  // --- playlist.html & home.html video modal logic ---
  if (document.getElementById('video-modal')) {
    window.openVideoModal = function(videoUrl) {
      let modal = document.getElementById('video-modal');
      let video = document.getElementById('modal-video');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-modal';
        modal.style = 'display:flex; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:2000; align-items:center; justify-content:center;';
        modal.innerHTML = `<div style="position:relative; max-width:90vw; max-height:90vh; background:#fff; border-radius:.5rem; padding:2rem; overflow-y:auto;">
          <button onclick="closeVideoModal()" style="position:absolute; top:1rem; right:1rem; background:#fff; border:none; border-radius:50%; width:2.5rem; height:2.5rem; font-size:2rem; cursor:pointer;">&times;</button>
          <video id="modal-video" controls style="width:100%; max-height:70vh;"></video>
        </div>`;
        document.body.appendChild(modal);
        video = document.getElementById('modal-video');
      }
      video.src = videoUrl;
      modal.style.display = 'flex';
    }
    window.closeVideoModal = function() {
      let modal = document.getElementById('video-modal');
      let video = document.getElementById('modal-video');
      if (modal && video) {
        video.pause();
        video.src = '';
        modal.style.display = 'none';
      }
    }
  }

  if (document.getElementById('teacher-test-results-list')) {
    showTeacherTestResults();
  }


});

// =========================
// Admin: User Management
// =========================

const USERS_KEY = 'lms_users';
let currentUserSearchQuery = '';

function getAllUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function setAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function showUserNotification(message, type = 'success') {
  const el = document.getElementById('user-notification');
  if (!el) return;
  el.innerHTML = `<div style="padding:1rem; border-radius:.5rem; background:${type==='success'?'#e0ffe0':'#ffe0e0'}; color:${type==='success'?'#1a7f1a':'#a11'}; font-size:1.5rem; margin-bottom:1rem;">${message}</div>`;
  setTimeout(()=>{ el.innerHTML = ''; }, 2500);
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  let users = getAllUsers();
  if (currentUserSearchQuery) {
    const q = currentUserSearchQuery.toLowerCase();
    users = users.filter(u =>
      (u.name||'').toLowerCase().includes(q) ||
      (u.email||'').toLowerCase().includes(q) ||
      (u.userType||'').toLowerCase().includes(q)
    );
  }
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:1rem; text-align:center;">No users found.</td></tr>`;
    return;
  }
  tbody.innerHTML = users.map((u, idx) => {
    const created = u.createdAt ? new Date(u.createdAt).toLocaleString() : '';
    return `
      <tr>
        <td>${idx+1}</td>
        <td>${u.name||''}</td>
        <td>${u.email||''}</td>
        <td>${u.userType||''}</td>
        <td>${created}</td>
        <td>
          <button class="inline-btn edit-user-btn" data-id="${u.id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="inline-option-btn delete-user-btn" data-id="${u.id}"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>`;
  }).join('');

  // Bind actions
  tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.onclick = function() {
      const id = this.getAttribute('data-id');
      openUserEditForm(id);
    };
  });
  tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      await deleteUserById(id);
    };
  });
}

async function deleteUserById(userId) {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  
  const userName = user.name || 'User';
  const userEmail = user.email || '';
  
  const isConfirmed = await confirmDialog(`Are you sure you want to delete user: ${userName} (${userEmail})?`);
  
  if (isConfirmed) {
    const updatedUsers = users.filter(u => u.id !== userId);
    setAllUsers(updatedUsers);
    showUserNotification('User deleted successfully', 'success');
    renderUsersTable();
    
    // If user deletes their own account, log them out
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      logout();
    }
  }
}

function openUserEditForm(userId) {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  const f = document.getElementById('userForm');
  if (!f) return;
  f.editId.value = user.id;
  f.name.value = user.name || '';
  f.email.value = user.email || '';
  f.userType.value = user.userType || 'student';
  const passwordInput = document.getElementById('editPassword');
  if (passwordInput) passwordInput.value = '';
}

function initializeUserManagementUI() {
  const searchInputEl = document.getElementById('user-search');
  if (searchInputEl) {
    searchInputEl.addEventListener('input', function() {
      currentUserSearchQuery = this.value;
      renderUsersTable();
    });
  }

  // Wire the "Send Students to Teacher View" button
  const sendBtn = document.getElementById('send-students-to-teacher');
  if (sendBtn) {
    sendBtn.onclick = function() {
      try {
        const users = getAllUsers();
        const students = users
          .filter(u => (u.userType||'').toLowerCase() === 'student')
          .map(u => ({ id: u.id, name: u.name||'', email: u.email||'', phone: (u.profile&&u.profile.phone)||'', address: (u.profile&&u.profile.address)||'' }));
        localStorage.setItem('teacher_view_students', JSON.stringify(students));
        showUserNotification(`Sent ${students.length} student${students.length===1?'':'s'} to Teacher View.`,'success');
      } catch (e) {
        console.error(e);
        showUserNotification('Failed to send students.','error');
      }
    }
  }

  const f = document.getElementById('userForm');
  if (f) {
    f.onsubmit = function(e) {
      e.preventDefault();
      const editId = f.editId.value;
      if (!editId) {
        alert('Select a user to edit from the table.');
        return;
      }
      let users = getAllUsers();
      const idx = users.findIndex(u => u.id === editId);
      if (idx === -1) return;
      const name = f.name.value.trim();
      const email = f.email.value.trim();
      const userType = f.userType.value;
      const password = (document.getElementById('editPassword')||{value:''}).value;

      if (!name || !email || !userType) {
        showUserNotification('Please fill name, email and role.','error');
        return;
      }
      // email uniqueness
      const exists = users.some((u, i) => i !== idx && (u.email||'').toLowerCase() === email.toLowerCase());
      if (exists) {
        showUserNotification('Another user already uses this email.','error');
        return;
      }
      users[idx].name = name;
      users[idx].email = email;
      users[idx].userType = userType;
      if (password && password.trim().length >= 8) {
        users[idx].password = password.trim();
      }
      setAllUsers(users);
      showUserNotification('User updated.','success');
      renderUsersTable();
      // keep edit state but clear password
      const pwd = document.getElementById('editPassword');
      if (pwd) pwd.value = '';
    };

    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
      cancelBtn.onclick = function() {
        f.reset();
        f.editId.value = '';
      };
    }
  }

  renderUsersTable();
}

// Initialize user management when page has the users table
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('users-table-body')) {
    initializeUserManagementUI();
  }
});

// =========================
// Course Management for manage_courses.html
// =========================

// --- Constants ---
const COURSES_KEY = 'lms_courses';
const COURSES_PER_PAGE = 6;

// --- State ---
let currentCoursePage = 1;
let currentCourseSearch = '';
let currentCourseSort = 'date';

// --- Utility Functions ---
function getCourses() {
  return JSON.parse(localStorage.getItem(COURSES_KEY) || '[]');
}
function setCourses(courses) {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}
function showCourseNotification(msg, type = 'success') {
  const el = document.getElementById('course-notification');
  if (!el) return;
  el.innerHTML = `<div style="padding:1rem; border-radius:.5rem; background:${type==='success'?'#e0ffe0':'#ffe0e0'}; color:${type==='success'?'#1a7f1a':'#a11'}; font-size:1.5rem; margin-bottom:1rem;">${msg}</div>`;
  setTimeout(()=>{ el.innerHTML = ''; }, 3000);
}
function confirmDialog(msg, callback) {
  // Create confirmation UI
  const confirmationHtml = `
    <div class="confirmation-dialog">
      <div class="confirmation-content">
        <h3>Confirm Action</h3>
        <p>${msg}</p>
        <div class="confirmation-buttons">
          <button id="confirm-action" class="btn btn-danger">Confirm</button>
          <button id="cancel-action" class="btn btn-secondary">Cancel</button>
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
  
  // Return a promise that resolves with true/false based on user action
  return new Promise((resolve) => {
    document.getElementById('confirm-action').addEventListener('click', function() {
      const dialog = document.querySelector('.confirmation-dialog');
      if (dialog) dialog.remove();
      if (typeof callback === 'function') callback(true);
      resolve(true);
    });
    
    document.getElementById('cancel-action').addEventListener('click', function() {
      const dialog = document.querySelector('.confirmation-dialog');
      if (dialog) dialog.remove();
      if (typeof callback === 'function') callback(false);
      resolve(false);
    });
    
    // Close dialog when clicking outside
    document.querySelector('.confirmation-dialog').addEventListener('click', function(e) {
      if (e.target === this) {
        this.remove();
        if (typeof callback === 'function') callback(false);
        resolve(false);
      }
    });
  });
}

// --- Render Courses ---
function renderCourses() {
  const list = document.getElementById('courses-list');
  if (!list) return;
  let courses = getCourses();
  // Search
  if (currentCourseSearch) {
    const q = currentCourseSearch.toLowerCase();
    courses = courses.filter(c => c.title.toLowerCase().includes(q) || (c.teacher||'').toLowerCase().includes(q));
  }
  // Sort
  if (currentCourseSort === 'title') {
    courses.sort((a,b)=>a.title.localeCompare(b.title));
  } else if (currentCourseSort === 'teacher') {
    courses.sort((a,b)=>(a.teacher||'').localeCompare(b.teacher||''));
  } else {
    courses.sort((a,b)=> (b.dateAdded||0)-(a.dateAdded||0));
  }
  // Pagination
  const total = courses.length;
  const totalPages = Math.ceil(total/COURSES_PER_PAGE)||1;
  if (currentCoursePage > totalPages) currentCoursePage = totalPages;
  const start = (currentCoursePage-1)*COURSES_PER_PAGE;
  const paged = courses.slice(start, start+COURSES_PER_PAGE);
  // Render
  if (!courses.length) {
    list.innerHTML = '<p style="font-size:1.7rem;">No courses found.</p>';
  } else {
    list.innerHTML = paged.map((c,i) => `
      <div class="box" style="box-shadow:0 4px 24px rgba(0,0,0,0.10); position:relative;">
        <div style="display:flex; align-items:center; gap:1.5rem; margin-bottom:1rem;">
          ${c.image ? `<img src="${c.image}" alt="" class="course-image" style="height:5rem;width:5rem;border-radius:50%;object-fit:cover;">` : ''}
          <div class="info">
            <h3>${c.teacher||''}</h3>
          </div>
        </div>
        <h3 class="title">${c.title}</h3>
        <p>${c.description}</p>
        <p><strong>Lessons:</strong> ${c.lessons}</p>
        <div class="flex-btn" style="display:flex; gap:1rem; margin-top:1.5rem; flex-wrap:wrap; justify-content:center;">
          ${c.pdf ? `<a href="${c.pdf}" class="inline-option-btn" download target="_blank"><i class="fas fa-download"></i> Download</a>` : ''}
          ${c.video ? `<button class="inline-option-btn" onclick="openVideoModal('${c.video}')"><i class="fas fa-play"></i> Watch</button>` : ''}
          <button class="inline-btn" onclick="viewCourseDetails(${start+i})"><i class="fas fa-eye"></i> Details</button>
          <button class="inline-btn" onclick="editCourse(${start+i})"><i class="fas fa-edit"></i> Edit</button>
          <button class="inline-option-btn" onclick="deleteCourse(${start+i})"><i class="fas fa-trash"></i> Delete</button>
          <button class="inline-btn" onclick="duplicateCourse(${start+i})"><i class="fas fa-copy"></i> Duplicate</button>
        </div>
      </div>
    `).join('');
  }
  // Pagination controls
  const pag = document.getElementById('courses-pagination');
  if (pag) {
    pag.innerHTML = '';
    if (totalPages > 1) {
      for (let p=1; p<=totalPages; ++p) {
        pag.innerHTML += `<button class="option-btn" style="margin:0 .2rem;${p===currentCoursePage?'background:var(--main-color);color:#fff;':''}" onclick="gotoCoursePage(${p})">${p}</button>`;
      }
    }
  }
}
window.gotoCoursePage = function(p) {
  currentCoursePage = p;
  renderCourses();
}

// --- Search/Sort ---
const searchInput = document.getElementById('course-search');
if (searchInput) {
  searchInput.addEventListener('input', function() {
    currentCourseSearch = this.value;
    currentCoursePage = 1;
    renderCourses();
  });
}
const sortInput = document.getElementById('course-sort');
if (sortInput) {
  sortInput.addEventListener('change', function() {
    currentCourseSort = this.value;
    renderCourses();
  });
}

// --- Add/Edit Course ---
window.editCourse = function(idx) {
  const courses = getCourses();
  const c = courses[idx];
  if (!c) return;
  const f = document.getElementById('courseForm');
  f.title.value = c.title;
  f.description.value = c.description;
  f.lessons.value = c.lessons;
  f.teacher.value = c.teacher;
  f["editIndex"].value = idx;
  // Previews
  document.getElementById('image-preview').innerHTML = c.image ? `<img src="${c.image}" class="course-image" style="max-width:100px;max-height:100px;">` : '';
  document.getElementById('pdf-preview').innerHTML = c.pdf ? `<a href="${c.pdf}" target="_blank">PDF</a>` : '';
  document.getElementById('video-preview').innerHTML = c.video ? `<video src="${c.video}" controls class="course-video" style="max-width:120px;max-height:80px;"></video>` : '';
}
window.deleteCourse = async function(idx) {
  const courses = getCourses();
  const course = courses[idx];
  
  if (!course) return;
  
  const courseTitle = course.title || 'Untitled Course';
  const courseInstructor = course.teacher || 'Unknown Instructor';
  const courseStudents = course.students ? course.students.length : 0;
  
  const confirmationMessage = `
    <p>Are you sure you want to delete this course?</p>
    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
      <p><strong>Course:</strong> ${courseTitle}</p>
      <p><strong>Instructor:</strong> ${courseInstructor}</p>
      <p><strong>Students Enrolled:</strong> ${courseStudents}</p>
    </div>
    <p style="color: #dc3545; font-weight: bold;">This action cannot be undone.</p>
  `;
  
  const isConfirmed = await confirmDialog(confirmationMessage);
  
  if (isConfirmed) {
    courses.splice(idx, 1);
    setCourses(courses);
    showCourseNotification('Course deleted successfully', 'success');
    renderCourses();
  }
}
window.duplicateCourse = function(idx) {
  const courses = getCourses();
  const c = {...courses[idx]};
  c.title = c.title + ' (Copy)';
  c.dateAdded = Date.now();
  courses.push(c);
  setCourses(courses);
  showCourseNotification('Course duplicated.','success');
  renderCourses();
}
window.viewCourseDetails = function(idx) {
  const courses = getCourses();
  const c = courses[idx];
  if (!c) return;
  const modal = document.getElementById('course-details-modal');
  const content = document.getElementById('course-details-content');
  content.innerHTML = `
    <h2>${c.title}</h2>
    <p><strong>Teacher:</strong> ${c.teacher}</p>
    <p><strong>Description:</strong> ${c.description}</p>
    <p><strong>Lessons:</strong> ${c.lessons}</p>
    ${c.image ? `<img src="${c.image}" class="course-image" style="max-width:200px;max-height:200px;">` : ''}
    ${c.pdf ? `<p><a href="${c.pdf}" target="_blank">Download PDF</a></p>` : ''}
    ${c.video ? `<video src="${c.video}" controls class="course-video" style="max-width:300px;max-height:200px;"></video>` : ''}
  `;
  modal.style.display = 'flex';
}
window.closeCourseDetailsModal = function() {
  document.getElementById('course-details-modal').style.display = 'none';
}

function addOrEditCourse(e) {
  e.preventDefault();
  const f = e.target;
  const courses = getCourses();
  const idx = f["editIndex"].value;
  const title = f.title.value.trim();
  const description = f.description.value.trim();
  const lessons = f.lessons.value;
  const teacher = f.teacher.value.trim();
  let image = f.image._preview || '';
  let pdf = f.pdf._preview || '';
  let video = f.video._preview || '';
  if (!title || !description || !lessons || !teacher) {
    showCourseNotification('Please fill all required fields.','error');
    return;
  }
  const course = { title, description, lessons, teacher, image, pdf, video, dateAdded: Date.now() };
  if (idx !== '') {
    if (!confirmDialog('Overwrite this course?')) return;
    courses[idx] = course;
    showCourseNotification('Course updated.','success');
    
    // Log course update activity
    if (typeof logActivity === 'function') {
      logActivity('course', 'Course Updated', `Updated course: ${title}`, 'manage_courses.html');
    }
  } else {
    courses.push(course);
    showCourseNotification('Course added.','success');
    
    // Log course creation activity
    if (typeof logActivity === 'function') {
      logActivity('course', 'Course Created', `Created new course: ${title}`, 'manage_courses.html');
    }
  }
  setCourses(courses);
  f.reset();
  f["editIndex"].value = '';
  document.getElementById('image-preview').innerHTML = '';
  document.getElementById('pdf-preview').innerHTML = '';
  document.getElementById('video-preview').innerHTML = '';
  renderCourses();
}

// --- File Previews ---
function handleCourseFileInputs() {
  const f = document.getElementById('courseForm');
  if (!f) return;
  f.image.onchange = function(e) {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        f.image._preview = ev.target.result;
        document.getElementById('image-preview').innerHTML = `<img src="${ev.target.result}" class="course-image" style="max-width:100px;max-height:100px;">`;
      };
      reader.readAsDataURL(file);
    } else {
      f.image._preview = '';
      document.getElementById('image-preview').innerHTML = '';
    }
  };
  f.pdf.onchange = function(e) {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        f.pdf._preview = ev.target.result;
        document.getElementById('pdf-preview').innerHTML = `<a href="${ev.target.result}" target="_blank">PDF</a>`;
      };
      reader.readAsDataURL(file);
    } else {
      f.pdf._preview = '';
      document.getElementById('pdf-preview').innerHTML = '';
    }
  };
  f.video.onchange = function(e) {
    const file = this.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      f.video._preview = url;
      document.getElementById('video-preview').innerHTML = `<video src="${url}" controls class="course-video" style="max-width:120px;max-height:80px;"></video>`;
    } else {
      f.video._preview = '';
      document.getElementById('video-preview').innerHTML = '';
    }
  };
}

// --- Reset/Clear Form ---
const resetBtn = document.getElementById('reset-course-form');
if (resetBtn) {
  resetBtn.onclick = function() {
    const f = document.getElementById('courseForm');
    f.reset();
    f["editIndex"].value = '';
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('pdf-preview').innerHTML = '';
    document.getElementById('video-preview').innerHTML = '';
  };
}

// --- Modal Close on Outside Click ---
const modal = document.getElementById('course-details-modal');
if (modal) {
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeCourseDetailsModal();
  });
}

// --- Initial Render ---
if (document.getElementById('courses-list')) {
    renderCourses();
}

function updateLatestTestPreview() {
    const latestTestPreview = document.getElementById('latest-test-preview');
    if (latestTestPreview) {
        const allTests = JSON.parse(localStorage.getItem('allTests') || '[]');
        if (allTests.length > 0) {
            const latestTest = allTests[allTests.length - 1]; // Get the most recent test
            latestTestPreview.innerHTML = `
                <h4>${latestTest.title}</h4>
                <p>${latestTest.description}</p>
                <p><strong>Questions:</strong> ${latestTest.questions.length}</p>
                <p>Date: ${latestTest.date}</p>
            `;
        } else {
            latestTestPreview.innerHTML = '<p>No tests available yet.</p>';
        }
    }
}

function updateLatestAssignmentPreview() {
    const latestAssignmentPreview = document.getElementById('latest-assignment-preview');
    if (latestAssignmentPreview) {
        const allAssignments = JSON.parse(localStorage.getItem('allAssignments')) || [];
        if (allAssignments.length > 0) {
            const latestAssignment = allAssignments[allAssignments.length - 1];
            latestAssignmentPreview.innerHTML = `
                <h4>${latestAssignment.title}</h4>
                <p>${latestAssignment.description}</p>
                <p>Due: ${latestAssignment.due}</p>
            `;
        } else {
            latestAssignmentPreview.innerHTML = '<p>No assignments available yet.</p>';
        }
    }
}

function updateLatestAnnouncementPreview() {
    const latestAnnouncementPreview = document.getElementById('latest-announcement-preview');
    if (latestAnnouncementPreview) {
        const allAnnouncements = JSON.parse(localStorage.getItem('allAnnouncements')) || [];
        if (allAnnouncements.length > 0) {
            const latestAnn = allAnnouncements[allAnnouncements.length - 1];
            latestAnnouncementPreview.innerHTML = `
                <h4>${latestAnn.title}</h4>
                <p>${latestAnn.message}</p>
            `;
        } else {
            latestAnnouncementPreview.innerHTML = '<p>No announcements yet.</p>';
        }
    }
}

function updateLatestMessagePreview() {
    const latestMessagePreview = document.getElementById('latest-message-preview');
    if (latestMessagePreview) {
        const messages = JSON.parse(localStorage.getItem('lms_messages')) || [];
        const currentUserId = localStorage.getItem('currentStudentId') || 'student';
        
        // Filter messages for current student
        const studentMessages = messages.filter(msg => 
            msg.sender === currentUserId || msg.recipient === currentUserId
        );
        
        if (studentMessages.length > 0) {
            const latestMessage = studentMessages[studentMessages.length - 1];
            const senderName = latestMessage.sender === 'teacher' ? 'Teacher' : 
                             (latestMessage.sender === currentUserId ? 'You' : 'Student');
            latestMessagePreview.innerHTML = `
                <h4>Message from ${senderName}</h4>
                <p>${latestMessage.text}</p>
                <small>${new Date(latestMessage.timestamp).toLocaleString()}</small>
            `;
        } else {
            latestMessagePreview.innerHTML = '<p>No messages yet.</p>';
        }
    }
}

function showTeacherTestResults() {
  const container = document.getElementById('teacher-test-results-list');
  if (!container) return;
  const allResults = JSON.parse(localStorage.getItem('testResultsByStudent') || '{}');
  if (Object.keys(allResults).length === 0) {
    container.innerHTML = '<p>No test results available yet.</p>';
    return;
  }
  // Collect all test titles
  const testSet = new Set();
  for (const studentId in allResults) {
    allResults[studentId].forEach(result => testSet.add(result.testTitle));
  }
  const testTitles = Array.from(testSet);
  // Dropdown for filtering
  let html = '<label for="test-filter">Filter by Test:</label> <select id="test-filter"><option value="">All Tests</option>';
  testTitles.forEach(title => {
    html += `<option value="${title}">${title}</option>`;
  });
  html += '</select>';
  html += '<button id="print-teacher-results-btn" class="btn" style="margin-left:1rem;">Print Results</button>';
  html += '<div id="teacher-results-table"></div>';
  container.innerHTML = html;

  function renderTable(filterTitle) {
    let tableHtml = '';
    for (const studentId in allResults) {
      const filteredResults = allResults[studentId].filter(r => !filterTitle || r.testTitle === filterTitle);
      if (filteredResults.length === 0) continue;
      
      // Get student name from the first result (all results for this student should have the same name)
      const studentName = filteredResults[0].studentName || studentId;
      
      tableHtml += `<div class="box"><h3>Student: ${studentName}</h3>`;
      filteredResults.forEach((result, idx) => {
        tableHtml += `<div class="test-result">
          <p><strong>Test:</strong> ${result.testTitle}</p>
          <p><strong>Score:</strong> ${result.score} / ${result.total}</p>
          <p><strong>Percentage:</strong> ${result.percentage}%</p>
          <p><strong>Date:</strong> ${new Date(result.date).toLocaleString()}</p>
          <div class="test-result-actions">
            <button class="btn view-details-btn" data-student="${studentId}" data-idx="${idx}">View Details</button>
            <button class="btn delete-result-btn" data-student="${studentId}" data-idx="${idx}" style="background: #dc3545; margin-left: 0.5rem;">Delete Result</button>
          </div>
          <div class="details" style="display:none;"></div>
        </div>`;
      });
      tableHtml += '</div>';
    }
    if (!tableHtml) tableHtml = '<p>No results for this test.</p>';
    document.getElementById('teacher-results-table').innerHTML = tableHtml;

    // Add event listeners for details
    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.onclick = function() {
        const studentId = this.getAttribute('data-student');
        const idx = this.getAttribute('data-idx');
        const result = allResults[studentId][idx];
           // Try to get test definition from allTests
   const allTests = JSON.parse(localStorage.getItem('allTests') || '[]');
   const testDef = allTests.find(t => t.id === result.testId);
   
   // Update latest test preview on home page
   if (allTests.length > 0) {
     const latestTest = allTests[allTests.length - 1];
     const latestTestPreview = document.getElementById('latest-test-preview');
     if (latestTestPreview) {
       latestTestPreview.innerHTML = `
         <h4>${latestTest.title}</h4>
         <p>${latestTest.description}</p>
         <p><strong>Questions:</strong> ${latestTest.questions.length}</p>
         <p><strong>Date:</strong> ${latestTest.date}</p>
       `;
     }
   }
   
   // Initialize home page previews
   function initializeHomePreviews() {
     const allTests = JSON.parse(localStorage.getItem('allTests') || '[]');
     const latestTestPreview = document.getElementById('latest-test-preview');
     
     if (allTests.length > 0 && latestTestPreview) {
       const latestTest = allTests[allTests.length - 1];
       latestTestPreview.innerHTML = `
         <h4>${latestTest.title}</h4>
         <p>${latestTest.description}</p>
         <p><strong>Questions:</strong> ${latestTest.questions.length}</p>
         <p><strong>Date:</strong> ${latestTest.date}</p>
       `;
     }
   }
   
   // Call initialization functions
   initializeHomePreviews();
        let detailsHtml = '';
        if (testDef) {
          testDef.questions.forEach((q, i) => {
            const userAnswer = result.answers[i];
            const correctAnswer = parseInt(q.correct);
            const isCorrect = userAnswer === correctAnswer;
            detailsHtml += `<div class="question-result">
              <p><strong>Q${i+1}:</strong> ${q.text}</p>
              <p>Student answer: ${userAnswer !== null && userAnswer !== undefined ? q.options[userAnswer] : 'Not answered'} (${isCorrect ? 'Correct' : 'Incorrect'})</p>
              ${!isCorrect ? `<p>Correct answer: ${q.options[correctAnswer]}</p>` : ''}
            </div>`;
          });
        } else {
          detailsHtml = '<p>Test definition not found.</p>';
        }
        const detailsDiv = this.nextElementSibling;
        detailsDiv.innerHTML = detailsHtml;
        detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
        this.textContent = detailsDiv.style.display === 'block' ? 'Hide Details' : 'View Details';
      };
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-result-btn').forEach(btn => {
      btn.onclick = async function() {
        const studentId = this.getAttribute('data-student');
        const idx = this.getAttribute('data-idx');
        const result = allResults[studentId][idx];
        
        // Show inline confirmation dialog
        const studentName = result.studentName || studentId;
        const testTitle = result.testTitle || 'Test';
        const score = result.score || 0;
        const total = result.total || 0;
        const testDate = result.date ? new Date(result.date).toLocaleString() : 'Unknown date';
        
        const isConfirmed = await confirmDialog(
          `Are you sure you want to delete this test result?\n\n` +
          `<strong>Test:</strong> ${testTitle}\n` +
          `<strong>Student:</strong> ${studentName}\n` +
          `<strong>Score:</strong> ${score}/${total}\n` +
          `<strong>Date:</strong> ${testDate}`
        );
        
        if (isConfirmed) {
          // Remove the result from the array
          allResults[studentId].splice(idx, 1);
          
          // If this was the last result for this student, remove the student entry
          if (allResults[studentId].length === 0) {
            delete allResults[studentId];
          }
          
          // Update localStorage
          localStorage.setItem('testResultsByStudent', JSON.stringify(allResults));
          
          // Re-render the table
          renderTable(document.getElementById('test-filter').value);
          
          // Show success message
          showUserNotification('Test result deleted successfully!', 'success');
        }
      };
    });
  }

  // Initial render
  renderTable('');
  document.getElementById('test-filter').onchange = function() {
    renderTable(this.value);
  };
  document.getElementById('print-teacher-results-btn').onclick = function() {
    const printContent = document.getElementById('teacher-results-table').innerHTML;
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write('<html><head><title>Print Test Results</title>');
    printWindow.document.write('<link rel="stylesheet" href="css/style.css">');
    printWindow.document.write('</head><body >');
    printWindow.document.write('<div>' + printContent + '</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
}

// =========================
// Update Profile Functionality
// =========================

function handleUpdateProfile() {
   const updateForms = document.querySelectorAll('form[enctype="multipart/form-data"]');
   
   updateForms.forEach(form => {
      // Check if this is an update profile form
      const heading = form.querySelector('h3');
      if (heading && heading.textContent.toLowerCase().includes('update profile')) {
         form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentUser = getCurrentUser();
            if (!currentUser) {
               alert('Please log in to update your profile');
               window.location.href = 'login.html';
               return;
            }
            
            const formData = new FormData(form);
            const name = formData.get('name');
            const email = formData.get('email');
            const oldPass = formData.get('old_pass');
            const newPass = formData.get('new_pass');
            const confirmPass = formData.get('c_pass');
            const profilePic = formData.get('profile_pic') || form.querySelector('input[type="file"]')?.files[0];
            
            // Validation
            if (!name || !email) {
               alert('Name and email are required');
               return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
               alert('Please enter a valid email address');
               return;
            }
            
            // Password validation if changing password
            if (newPass || confirmPass || oldPass) {
               if (!oldPass) {
                  alert('Please enter your current password to change it');
                  return;
               }
               
               if (oldPass !== currentUser.password) {
                  alert('Current password is incorrect');
                  return;
               }
               
               if (!newPass || !confirmPass) {
                  alert('Please enter and confirm your new password');
                  return;
               }
               
               if (newPass !== confirmPass) {
                  alert('New passwords do not match');
                  return;
               }
               
               if (newPass.length < 8) {
                  alert('New password must be at least 8 characters long');
                  return;
               }
            }
            
            // Check if email is already taken by another user
            const allUsers = JSON.parse(localStorage.getItem('lms_users') || '[]');
            const emailExists = allUsers.find(user => user.email === email && user.id !== currentUser.id);
            if (emailExists) {
               alert('This email is already taken by another user');
               return;
            }
            
            // Update user data
            const updatedUser = { ...currentUser };
            updatedUser.name = name;
            updatedUser.email = email;
            
            if (newPass) {
               updatedUser.password = newPass;
            }
            
            // Handle profile picture
            if (profilePic && profilePic.size > 0) {
               // Validate file type
               if (!profilePic.type.startsWith('image/')) {
                  alert('Please select a valid image file');
                  return;
               }
               
               // Validate file size (max 5MB)
               if (profilePic.size > 5 * 1024 * 1024) {
                  alert('Image file size must be less than 5MB');
                  return;
               }
               
               const reader = new FileReader();
               reader.onload = function(e) {
                  updatedUser.profile = updatedUser.profile || {};
                  updatedUser.profile.avatar = e.target.result;
                  saveUpdatedProfile(updatedUser, allUsers);
               };
               reader.onerror = function() {
                  alert('Error reading the image file. Please try again.');
               };
               reader.readAsDataURL(profilePic);
            } else {
               saveUpdatedProfile(updatedUser, allUsers);
            }
         });
      }
   });
}

function saveUpdatedProfile(updatedUser, allUsers) {
   // Update in users array
   const userIndex = allUsers.findIndex(user => user.id === updatedUser.id);
   if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser;
      localStorage.setItem('lms_users', JSON.stringify(allUsers));
   }
   
   // Update current user session
   localStorage.setItem('currentUser', JSON.stringify(updatedUser));
   
   // Update displayed user info on current page
   const nameElements = document.querySelectorAll('.name');
   nameElements.forEach(element => {
      element.textContent = updatedUser.name;
   });
   
   // Update profile images if avatar was updated
   if (updatedUser.profile && updatedUser.profile.avatar) {
      const profileImages = document.querySelectorAll('.profile .image, .user img');
      profileImages.forEach(img => {
         img.src = updatedUser.profile.avatar;
      });
   }
   
   alert('Profile updated successfully!');
   
   // Redirect back to appropriate profile page
   if (updatedUser.userType === 'student') {
      window.location.href = 'profile.html';
   } else if (updatedUser.userType === 'teacher') {
      window.location.href = 'profile-teacher.html';
   } else if (updatedUser.userType === 'admin') {
      window.location.href = 'admin_profile.html';
   }
}

// Load and display user profile images
function loadUserProfileImage() {
   const currentUser = getCurrentUser();
   if (currentUser && currentUser.profile && currentUser.profile.avatar) {
      const profileImages = document.querySelectorAll('.profile .image, .user img');
      profileImages.forEach(img => {
         img.src = currentUser.profile.avatar;
      });
   }
}

// Initialize update profile functionality
document.addEventListener('DOMContentLoaded', function() {
   handleUpdateProfile();
   loadUserProfileImage();
});

document.title='eduTechzam LMS';