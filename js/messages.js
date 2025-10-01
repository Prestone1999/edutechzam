// Cross-platform messaging logic for students and teachers
// Message structure: { id, sender, recipient, text, reply, replySender, timestamp }

const MESSAGE_KEY = 'lms_messages';
const STUDENTS_KEY = 'lms_students';

// Track which message is being edited
let editingMessageIndex = null;

// Function to set up event listeners for edit functionality
function setupEditListeners() {
  // Edit button click handler
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      editingMessageIndex = this.getAttribute('data-idx');
      renderMessages();
    });
  });

  // Save edit button click handler
  document.querySelectorAll('.save-edit-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const idx = this.getAttribute('data-idx');
      const messageItem = this.closest('.message-item');
      const textarea = messageItem?.querySelector('.edit-message-input');
      
      if (textarea && textarea.value.trim()) {
        editMessage(idx, textarea.value);
      }
    });
  });

  // Cancel edit button click handler
  document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      editingMessageIndex = null;
      renderMessages();
    });
  });

  // Handle Enter key in edit textarea
  document.querySelectorAll('.edit-message-input').forEach(textarea => {
    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const btn = this.closest('.msg-edit-form')?.querySelector('.save-edit-btn');
        if (btn) btn.click();
      } else if (e.key === 'Escape') {
        renderMessages(); // Cancel on Escape
      }
    });
  });
}

// Function to register a student (can be called from registration/login)
function registerStudent(studentId, studentName) {
  const students = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
  const existingIndex = students.findIndex(s => s.id === studentId);
  
  if (existingIndex >= 0) {
    // Update existing student
    students[existingIndex].name = studentName;
  } else {
    // Add new student
    students.push({ id: studentId, name: studentName });
  }
  
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

// Get active students from localStorage (students who have logged in)
function getActiveStudents() {
  const students = [];
  const keys = Object.keys(localStorage);
  const seenIds = new Set();
  
  // Look for student IDs and names in localStorage
  keys.forEach(key => {
    if (key.includes('currentStudentId') || key.includes('studentId')) {
      const studentId = localStorage.getItem(key);
      if (studentId && studentId !== 'student' && !seenIds.has(studentId)) {
        seenIds.add(studentId);
        
        // Try to find corresponding name
        let studentName = 'Student';
        const nameKey = key.replace('Id', 'Name');
        if (localStorage.getItem(nameKey)) {
          studentName = localStorage.getItem(nameKey);
        } else if (localStorage.getItem('currentStudentName')) {
          studentName = localStorage.getItem('currentStudentName');
        }
        
        students.push({ id: studentId, name: studentName });
      }
    }
  });
  
  // Also check for any stored student data
  const storedStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
  storedStudents.forEach(student => {
    if (!seenIds.has(student.id)) {
      seenIds.add(student.id);
      students.push(student);
    }
  });
  
  // Include registered students from user store
  try {
    const users = JSON.parse(localStorage.getItem('lms_users') || '[]');
    users.filter(u => u && u.userType === 'student').forEach(u => {
      if (u.id && !seenIds.has(u.id)) {
        seenIds.add(u.id);
        students.push({ id: u.id, name: u.name || 'Student' });
      }
    });
  } catch (_) {}
  
  // If no active students found, create a default one for demo
  if (students.length === 0) {
    students.push({ id: 'student1', name: 'Student' });
  }
  
  return students;
}

function getMessages() {
  return JSON.parse(localStorage.getItem(MESSAGE_KEY) || '[]');
}

function saveMessages(messages) {
  localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));
}

function getCurrentUserRole() {
  // Prefer role from session user if available
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.userType) {
      return currentUser.userType;
    }
  } catch (_) {}
  // Fallback: role detection based on URL
  if (window.location.pathname.includes('teacher')) return 'teacher';
  return 'student';
}

function getCurrentUserId() {
  // Prefer id from session user if available
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.id) {
      return currentUser.id;
    }
  } catch (_) {}
  // Fallbacks for legacy/demo
  if (getCurrentUserRole() === 'student') {
    return localStorage.getItem('currentStudentId') || 'student';
  }
  return 'teacher';
}

function getStudents() {
  return getActiveStudents();
}

function getCurrentUserName() {
  // Prefer name from session user if available
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.name) {
      return currentUser.name;
    }
  } catch (_) {}
  const role = getCurrentUserRole();
  if (role === 'student') {
    // Try to get student name from localStorage, fallback to 'Student'
    return localStorage.getItem('currentStudentName') || 'Student';
  }
  return 'Teacher';
}

function getNameById(id) {
  // Special handling for generic teacher id
  if (id === 'teacher') {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.userType === 'teacher' && currentUser.name) {
        return currentUser.name;
      }
    } catch (_) {}
    return 'Teacher';
  }

  // If it's the current user, return their name
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser && currentUser.id === id && currentUser.name) {
      return currentUser.name;
    }
  } catch (_) {}

  // Lookup in global users store (students or teachers)
  try {
    const users = JSON.parse(localStorage.getItem('lms_users') || '[]');
    const user = users.find(u => u && u.id === id);
    if (user && user.name) return user.name;
  } catch (_) {}
  
  // Try to get student name by id from active students
  const students = getStudents();
  const student = students.find(s => s.id === id);
  if (student) return student.name;
  
  // Fallback to localStorage
  if (localStorage.getItem('currentStudentId') === id) {
    return localStorage.getItem('currentStudentName') || 'Student';
  }
  
  // If still not found, try to get from any student-related localStorage keys
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.includes('StudentName') || key.includes('studentName')) {
      const name = localStorage.getItem(key);
      if (name && name !== 'Student') {
        return name;
      }
    }
  }
  
  return 'Student';
}

function renderMessages(selectedIdx = null) {
  const messages = getMessages();
  const userId = getCurrentUserId();
  const role = getCurrentUserRole();
  const list = document.getElementById('message-list');
  if (!list) return;
  
  // Store scroll position
  const isScrolledToBottom = list.scrollHeight - list.clientHeight <= list.scrollTop + 1;
  
  list.innerHTML = '';
  
  messages.forEach((msg, idx) => {
    let shouldShow = false;
    
    if (role === 'student') {
      // Students see messages they sent or received
      shouldShow = (msg.sender === userId || msg.recipient === userId);
    } else if (role === 'teacher') {
      // Teachers see their messages plus any sent to generic 'teacher'
      shouldShow = (msg.recipient === userId || msg.sender === userId || msg.recipient === 'teacher');
    }
    
    if (shouldShow) {
      const li = document.createElement('li');
      li.className = 'message-item';
      li.setAttribute('data-idx', idx);
      
      // Check if this message is being edited
      const isEditing = editingMessageIndex === String(idx);
      if (isEditing) {
        li.classList.add('editing');
      }
      
      let html = `<div class='msg-sender' style='font-weight:700; color:#8e44ad; margin-bottom:0.2rem;'>${getNameById(msg.sender)}</div>`;
      
      if (isEditing) {
        // Show edit form
        html += `
          <div class='msg-edit-form'>
            <textarea class='edit-message-input' rows='2'>${msg.text}</textarea>
            <div class='edit-actions'>
              <button class='save-edit-btn' data-idx='${idx}'>Save</button>
              <button class='cancel-edit-btn' data-idx='${idx}'>Cancel</button>
            </div>
          </div>
        `;
      } else {
        // Show regular message
        html += `<div class='msg-main'><span class='msg-text'>${msg.text}</span>`;
        if (msg.reply) {
          html += `<div class='msg-reply'><b>Reply (${msg.replySender ? msg.replySender : 'Unknown'}):</b> ${msg.reply}</div>`;
        }
        html += `<div class='msg-meta'>${new Date(msg.timestamp).toLocaleString()}</div>`;
        if (msg.sender === userId) {
          html += `<button class='edit-btn' data-idx='${idx}'>Edit</button>`;
          html += `<button class='delete-btn' data-idx='${idx}'>Delete</button>`;
        }
        html += '</div>';
      }
      
      li.innerHTML = html;
      list.appendChild(li);
      
      // If this was the message being edited, focus the textarea
      if (isEditing) {
        const textarea = li.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          // Move cursor to end of text
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        }
      }
    }
  });
  
  // Add event listeners for edit functionality
  setupEditListeners();
  
  // Scroll to bottom for chat effect
  list.scrollTop = list.scrollHeight;
}



function addMessage(text) {
  const userId = getCurrentUserId();
  const role = getCurrentUserRole();
  const messages = getMessages();
  
  if (role === 'teacher') {
    // Broadcast teacher message to all known students
    const students = getStudents();
    const recipients = students && students.length ? students : [];
    if (recipients.length === 0) {
      alert('No students available to send message to.');
      return;
    }
    const now = Date.now();
    recipients.forEach((student, index) => {
      messages.push({
        id: `${now}-${student.id}-${index}`,
        sender: userId,
        recipient: student.id,
        text,
        reply: '',
        timestamp: now + index
      });
    });
    
    // Log activity for teacher
    if (typeof logActivity === 'function') {
      logActivity('message', 'Sent Message', `Sent message to ${recipients.length} students: ${text.substring(0, 50)}...`, 'teacher_messages.html');
    }
  } else {
    // Student -> teacher
    messages.push({
      id: Date.now(),
      sender: userId,
      recipient: 'teacher',
      text,
      reply: '',
      timestamp: Date.now()
    });
    
    // Log activity for student
    if (typeof logActivity === 'function') {
      logActivity('message', 'Sent Message', `Sent message to teacher: ${text.substring(0, 50)}...`, 'messages.html');
    }
  }
  saveMessages(messages);
  renderMessages();
  
  // Create notifications for new messages
  if (messages.length > 0) {
    createMessageNotifications(messages[messages.length - 1]);
  }
  
  // Update global notification count
  if (typeof updateNotificationCount === 'function') {
    updateNotificationCount();
  }
  
  // Update home page message preview if on home page
  if (typeof updateLatestMessagePreview === 'function') {
    updateLatestMessagePreview();
  }
}

function editMessage(idx, newText) {
  if (!newText || !newText.trim()) return; // Don't save empty messages
  const messages = getMessages();
  if (messages[idx]) {
    messages[idx].text = newText.trim();
    messages[idx].timestamp = Date.now(); // Update timestamp when edited
    messages[idx].edited = true; // Mark as edited
    editingMessageIndex = null; // Clear editing state
    saveMessages(messages);
    renderMessages();
  }
}

function deleteMessage(idx) {
  const messages = getMessages();
  const messageToDelete = messages[idx];
  
  if (!messageToDelete) return;
  
  // Create confirmation UI
  const confirmationHtml = `
    <div class="confirmation-dialog">
      <div class="confirmation-content">
        <h3>Delete Message</h3>
        <p>Are you sure you want to delete this message?</p>
        <div class="message-preview">
          <p><strong>From:</strong> ${messageToDelete.sender || 'Unknown Sender'}</p>
          <p><strong>Date:</strong> ${new Date(messageToDelete.timestamp).toLocaleString()}</p>
          <p>"${messageToDelete.text ? (messageToDelete.text.length > 50 ? messageToDelete.text.substring(0, 50) + '...' : messageToDelete.text) : ''}"</p>
        </div>
        <p class="text-danger">This action cannot be undone.</p>
        <div class="confirmation-buttons">
          <button id="confirm-delete-message" class="btn btn-danger" data-idx="${idx}">
            <i class="fas fa-trash"></i> Delete
          </button>
          <button id="cancel-delete-message" class="btn btn-secondary">
            <i class="fas fa-times"></i> Cancel
          </button>
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
  const confirmBtn = document.getElementById('confirm-delete-message');
  const cancelBtn = document.getElementById('cancel-delete-message');
  const dialog = document.querySelector('.confirmation-dialog');
  
  if (confirmBtn && cancelBtn && dialog) {
    const handleConfirm = function() {
      const idxToDelete = this.getAttribute('data-idx');
      if (idxToDelete !== null) {
        const updatedMessages = getMessages();
        updatedMessages.splice(parseInt(idxToDelete), 1);
        saveMessages(updatedMessages);
        renderMessages();
      }
      dialog.remove();
      // Clean up event listeners
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      dialog.removeEventListener('click', handleOutsideClick);
    };
    
    const handleCancel = function() {
      dialog.remove();
      // Clean up event listeners
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      dialog.removeEventListener('click', handleOutsideClick);
    };
    
    const handleOutsideClick = function(e) {
      if (e.target === this) {
        handleCancel();
      }
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    dialog.addEventListener('click', handleOutsideClick);
  }
}

function replyToMessage(idx, replyText) {
  const messages = getMessages();
  messages[idx].reply = replyText;
  messages[idx].replySender = getCurrentUserName();
  saveMessages(messages);
  renderMessages();
  
  // Log reply activity
  if (typeof logActivity === 'function') {
    const originalMessage = messages[idx];
    logActivity('message', 'Replied to Message', `Replied to message from ${getNameById(originalMessage.sender)}`, 'messages.html');
  }
}

// --- Notification Badge Logic ---
function getUnreadCount() {
  const messages = getMessages();
  const userId = getCurrentUserId();
  const role = getCurrentUserRole();
  if (role === 'teacher') {
    // Unread = messages sent to this teacher (by id) or to generic 'teacher' with no reply
    return messages.filter(m => (m.recipient === userId || m.recipient === 'teacher') && !m.reply).length;
  } else {
    // Unread = messages sent to this student OR messages with replies not yet viewed
    return messages.filter(m => 
      (m.recipient === userId && !m.read) || 
      (m.sender === userId && m.reply && !m.read)
    ).length;
  }
}

function markMessagesRead() {
  const messages = getMessages();
  const userId = getCurrentUserId();
  let changed = false;
  messages.forEach(m => {
    if (getCurrentUserRole() === 'student') {
      // Mark messages sent to this student as read
      if (m.recipient === userId && !m.read) {
        m.read = true;
        changed = true;
      }
      // Mark replies to messages sent by this student as read
      if (m.sender === userId && m.reply && !m.read) {
        m.read = true;
        changed = true;
      }
    }
  });
  if (changed) saveMessages(messages);
}

function updateMessageBadge() {
  // Don't show badge on messages page
  if (window.location.pathname.includes('messages.html')) {
    const badge = document.querySelector('.badge');
    if (badge) {
      badge.style.display = 'none';
    }
    return;
  }
  
  const count = getUnreadCount();
  const badge = document.querySelector('.badge');
  if (badge) {
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('send-message-form');
  const input = document.getElementById('message-input');
  const list = document.getElementById('message-list');
  const replyForm = document.getElementById('reply-form');
  const replyInput = document.getElementById('reply-input');
  const replySendBtn = document.getElementById('reply-send-btn');
  const role = getCurrentUserRole();
  
  // Initial render
  renderMessages();
  
  // Set up edit functionality
  setupEditListeners();
  
  // Add badge to sidebar
  addBadgeToSidebar();
  updateMessageBadge();
  
  // Mark messages as read when viewing the page (for students)
  if (role === 'student') {
    markMessagesRead();
    updateMessageBadge();
    // Update home page message preview if on home page
    if (typeof updateLatestMessagePreview === 'function') {
      updateLatestMessagePreview();
    }
    
    // Add click handlers to message links to mark as read
    const messageLinks = document.querySelectorAll('a[href*="messages"]');
    messageLinks.forEach(link => {
      link.addEventListener('click', function() {
        markMessagesRead();
        updateMessageBadge();
      });
    });
  }

  if (form && input) {
    form.onsubmit = function(e) {
      e.preventDefault();
      if (input.value.trim()) {
        addMessage(input.value.trim());
        input.value = '';
        input.blur();
      }
    };
  }

  if (list) {
    list.addEventListener('click', function(e) {
      const target = e.target;
      if (target.classList.contains('delete-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const idx = target.getAttribute('data-idx');
        deleteMessage(idx);
      } else if (target.classList.contains('reply-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const idx = target.getAttribute('data-idx');
        const message = getMessages()[idx];
        if (message) {
          replyForm.style.display = 'block';
          replyForm.setAttribute('data-reply-to', idx);
          replyInput.focus();
        }
      }
      // Edit button handling is now in setupEditListeners
    });
  }

  if (replyForm && replySendBtn && replyInput) {
    replySendBtn.onclick = function() {
      if (replyForm.getAttribute('data-reply-to') && replyInput.value.trim()) {
        replyToMessage(replyForm.getAttribute('data-reply-to'), replyInput.value.trim());
        replyForm.style.display = 'none';
        replyInput.value = '';
        replyInput.blur();
        renderMessages();
      }
    };
  }

  // Hide reply form if clicking outside
  document.addEventListener('click', function(e) {
    if (replyForm && !replyForm.contains(e.target) && !e.target.classList.contains('reply-btn')) {
      replyForm.style.display = 'none';
      if (replyInput) replyInput.value = '';
      replyIdx = null;
    }
  });

  // Add badge to sidebar and quick option
  function addBadgeToSidebar() {
    // Sidebar
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
      if (link.textContent.includes('Messages') && !link.querySelector('.msg-badge')) {
        const badge = document.createElement('span');
        badge.className = 'msg-badge';
        badge.style.display = 'none';
        link.appendChild(badge);
      }
    });
    // Quick option
    const quickOptions = document.querySelectorAll('.box .flex a');
    quickOptions.forEach(link => {
      if (link.textContent.includes('Messages') && !link.querySelector('.msg-badge')) {
        const badge = document.createElement('span');
        badge.className = 'msg-badge';
        badge.style.display = 'none';
        link.appendChild(badge);
      }
    });
  }
  addBadgeToSidebar();
  updateMessageBadge();

  // Mark messages as read when viewing the page (for students)
  if (role === 'student') {
    markMessagesRead();
    updateMessageBadge();
    // Update home page message preview if on home page
    if (typeof updateLatestMessagePreview === 'function') {
      updateLatestMessagePreview();
    }
    
    // Add click handlers to message links to mark as read
    const messageLinks = document.querySelectorAll('a[href*="messages"]');
    messageLinks.forEach(link => {
      link.addEventListener('click', function() {
        markMessagesRead();
        updateMessageBadge();
      });
    });
  }

  // Patch message actions to update badge
  const origAddMessage = window.addMessage;
  window.addMessage = function(text) {
    origAddMessage(text);
    updateMessageBadge();
  };
  const origReplyToMessage = window.replyToMessage;
  window.replyToMessage = function(idx, replyText) {
    origReplyToMessage(idx, replyText);
    updateMessageBadge();
  };
  const origEditMessage = window.editMessage;
  window.editMessage = function(idx, newText) {
    origEditMessage(idx, newText);
    updateMessageBadge();
  };
  const origDeleteMessage = window.deleteMessage;
  window.deleteMessage = function(idx) {
    origDeleteMessage(idx);
    updateMessageBadge();
  };
}); 

// Function to create notifications when messages are sent
function createMessageNotifications(message) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (message.recipient === 'teacher') {
        // Create notification for all teachers
        const allUsers = JSON.parse(localStorage.getItem('lms_users') || '[]');
        const teachers = allUsers.filter(user => user.userType === 'teacher');
        
        // If no teachers found in users, create for current user if they're a teacher
        if (teachers.length === 0 && currentUser.userType === 'teacher') {
            teachers.push(currentUser);
        }
        
        teachers.forEach(teacher => {
            const teacherStorageKey = `notifications_${teacher.email}`;
            let teacherNotifications = JSON.parse(localStorage.getItem(teacherStorageKey) || '[]');
            
            const notification = {
                id: `message_${message.id}_${teacher.email}`,
                title: 'Student Message',
                message: `${getNameById(message.sender)} sent: ${message.text.substring(0, 50)}...`,
                type: 'messages',
                category: 'message',
                timestamp: new Date(message.timestamp),
                isRead: false,
                targetUrl: 'teacher_messages.html',
                icon: 'fas fa-envelope',
                priority: 'medium'
            };
            
            teacherNotifications.unshift(notification);
            localStorage.setItem(teacherStorageKey, JSON.stringify(teacherNotifications));
        });
    } else {
        // Create notification for specific recipient
        // Check if recipient exists in users
        const allUsers = JSON.parse(localStorage.getItem('lms_users') || '[]');
        let recipient = allUsers.find(user => user.id === message.recipient || user.email === message.recipient);
        
        // If not found, try to find by current user
        if (!recipient && currentUser.id === message.recipient) {
            recipient = currentUser;
        }
        
        if (recipient) {
            const recipientStorageKey = `notifications_${recipient.email}`;
            let recipientNotifications = JSON.parse(localStorage.getItem(recipientStorageKey) || '[]');
            
            const notification = {
                id: `message_${message.id}`,
                title: 'New Message',
                message: `Message from ${getNameById(message.sender)}: ${message.text.substring(0, 50)}...`,
                type: 'messages',
                category: 'message',
                timestamp: new Date(message.timestamp),
                isRead: false,
                targetUrl: 'messages.html',
                icon: 'fas fa-envelope',
                priority: 'medium'
            };
            
            recipientNotifications.unshift(notification);
            localStorage.setItem(recipientStorageKey, JSON.stringify(recipientNotifications));
        }
    }
    
    console.log('Message notification created for:', message.recipient);
}