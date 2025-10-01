let questionCount = 0;

function addQuestion() {
    questionCount++;
    const questionsDiv = document.getElementById('questions');
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question', 'mb-2');
    questionDiv.innerHTML = `
        <div class="box">
            <label class="font-lg">Question ${questionCount}</label>
            <input type="text" name="questions[${questionCount - 1}][text]" class="box" required>
            <label class="font-md">Options</label>
            <input type="text" name="questions[${questionCount - 1}][options][0]" class="box" placeholder="Option 1" required>
            <input type="text" name="questions[${questionCount - 1}][options][1]" class="box" placeholder="Option 2" required>
            <input type="text" name="questions[${questionCount - 1}][options][2]" class="box" placeholder="Option 3">
            <input type="text" name="questions[${questionCount - 1}][options][3]" class="box" placeholder="Option 4">
            <label class="font-md">Correct Answer</label>
            <select name="questions[${questionCount - 1}][correct]" class="box" required>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
            </select>
        </div>
    `;
    questionsDiv.appendChild(questionDiv);
}

document.getElementById('testForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const testData = {
        id: 't' + new Date().getTime(),
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        timeLimit: formData.get('timeLimit') ? parseInt(formData.get('timeLimit')) : null,
        questions: []
    };

    const questions = {};
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('questions')) {
            const match = key.match(/\[(\d+)\]\[(text|options|correct)\](\[(\d+)\])?/);
            if (match) {
                const index = match[1];
                const type = match[2];
                if (!questions[index]) {
                    questions[index] = { text: '', options: [], correct: '' };
                }
                if (type === 'text') {
                    questions[index].text = value;
                } else if (type === 'correct') {
                    questions[index].correct = parseInt(value);
                } else if (type === 'options') {
                    const optionIndex = match[4];
                    questions[index].options[optionIndex] = value;
                }
            }
        }
    }
    testData.questions = Object.values(questions);

    // Add creation timestamp
    testData.dateCreated = new Date().toISOString();

    const existingTests = JSON.parse(localStorage.getItem('allTests')) || [];
    existingTests.push(testData);
    localStorage.setItem('allTests', JSON.stringify(existingTests));

    // Log activity
    if (typeof logActivity === 'function') {
        logActivity('test', 'Created Test', `Created test: ${testData.title}`, 'create_test.html');
    }

    // Create notifications for test creation
    createTestNotifications(testData);

    alert('Test created successfully!');
    this.reset();
    document.getElementById('questions').innerHTML = '';
    questionCount = 0;
}); 

// Function to create notifications when test is created
function createTestNotifications(testData) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Create notifications for all students
    const allUsers = JSON.parse(localStorage.getItem('lms_users') || '[]');
    const students = allUsers.filter(user => user.userType === 'student');
    
    students.forEach(student => {
        const studentStorageKey = `notifications_${student.email}`;
        let studentNotifications = JSON.parse(localStorage.getItem(studentStorageKey) || '[]');
        
        const testDate = new Date(testData.date);
        const daysDiff = Math.ceil((testDate - new Date()) / (1000 * 60 * 60 * 24));
        
        const notification = {
            id: `test_${testData.id}_${student.email}`,
            title: 'New Test Available',
            message: `${testData.title} is scheduled for ${testDate.toLocaleDateString()}${testData.description ? ' - ' + testData.description.substring(0, 50) + '...' : ''}`,
            type: 'tests',
            category: 'test',
            timestamp: new Date(testData.dateCreated),
            isRead: false,
            targetUrl: 'test.html',
            icon: 'fas fa-file-alt',
            priority: daysDiff <= 1 ? 'high' : 'medium'
        };
        
        studentNotifications.unshift(notification);
        localStorage.setItem(studentStorageKey, JSON.stringify(studentNotifications));
    });
    
    // Create admin notification about test creation
    const adminStorageKey = 'notifications_admin';
    let adminNotifications = JSON.parse(localStorage.getItem(adminStorageKey) || '[]');
    
    const adminNotification = {
        id: `admin_test_${testData.id}`,
        title: 'Test Activity',
        message: `New test "${testData.title}" created by ${currentUser.name || 'Teacher'}`,
        type: 'courses',
        category: 'activity',
        timestamp: new Date(testData.dateCreated),
        isRead: false,
        targetUrl: 'admin_manage_courses.html',
        icon: 'fas fa-file-alt',
        priority: 'low'
    };
    
    adminNotifications.unshift(adminNotification);
    localStorage.setItem(adminStorageKey, JSON.stringify(adminNotifications));
    
    // Update global notification count
    if (typeof updateNotificationCount === 'function') {
        updateNotificationCount();
    }
    
    console.log('Test notifications created for', students.length, 'students');
}