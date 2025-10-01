document.addEventListener('DOMContentLoaded', function () {
    // Get tests from localStorage or initialize as empty array
    const tests = JSON.parse(localStorage.getItem('allTests')) || [];

    const testsList = document.getElementById('student-tests-list');
    const modal = document.getElementById('take-test-modal');
    const modalContent = document.getElementById('take-test-modal-content');
    const closeModalBtn = document.getElementById('close-test-modal');
    
    // Global timer variable
    window.globalTimer = null;

    // Function to convert option index to letter (A, B, C, D, etc.)
    function getOptionLetter(index) {
        return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
    }

    // Function to safely render HTML content
    function renderHTMLContent(content) {
        if (!content) return '';
        // Convert common symbols to HTML entities for proper display
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>')
            .replace(/\s{2,}/g, function(match) {
                return '&nbsp;'.repeat(match.length);
            });
    }

    function displayTests() {
        testsList.innerHTML = '';
        if (tests.length === 0) {
            testsList.innerHTML = '<p>No tests available at the moment.</p>';
            return;
        }

        tests.forEach(test => {
            const testElement = document.createElement('div');
            testElement.classList.add('box');
            testElement.innerHTML = `
                <h3>${test.title}</h3>
                <p>${test.description}</p>
                <p>Date: ${test.date}</p>
                <p>Questions: ${test.questions ? test.questions.length : 0}</p>
                ${test.timeLimit ? `<p class="test-info"><i class="fas fa-clock"></i> Time Limit: ${test.timeLimit} minutes</p>` : ''}
                <button class="btn take-test-btn" data-testid="${test.id}">Take Test</button>
            `;
            testsList.appendChild(testElement);
        });

        document.querySelectorAll('.take-test-btn').forEach(button => {
            button.addEventListener('click', () => {
                const testId = button.dataset.testid;
                const test = tests.find(t => t.id === testId);
                openTestModal(test);
            });
        });
    }

    function openTestModal(test) {
        let currentQuestionIndex = 0;
        const userAnswers = [];
        const totalQuestions = test.questions ? test.questions.length : 0;
        window.globalTimer = null;
        let timeRemaining = test.timeLimit ? test.timeLimit * 60 : null; // Convert to seconds

        function showQuestion(index) {
            const question = test.questions[index];
            const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F']; // Support up to 6 options
            
            // Create question navigation dots
            let questionDots = '';
            for (let i = 0; i < totalQuestions; i++) {
                const isAnswered = userAnswers[i] !== undefined && userAnswers[i] !== null;
                const isCurrent = i === index;
                questionDots += `<span class="question-dot ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}" data-question="${i}">${i + 1}</span>`;
            }
            
            modalContent.innerHTML = `
                <div class="test-header">
                    <div class="test-header-top">
                        <h2>${test.title}</h2>
                        <button class="test-close-btn" onclick="closeTestModal()">&times;</button>
                    </div>
                    <div class="test-progress">
                        <span>Question ${index + 1} of ${totalQuestions}</span>
                        ${test.timeLimit ? `<div class="timer-display" id="timer-display">Time Remaining: <span id="timer">${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}</span></div>` : ''}
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((index + 1) / totalQuestions) * 100}%"></div>
                        </div>
                    </div>

                    <div class="question-navigation-dots">
                        ${questionDots}
                    </div>
                </div>
                
                <div class="question-container">
                <div class="question">
                        <h3>Question ${index + 1}</h3>
                        <p class="question-text">${renderHTMLContent(question.text || question.question)}</p>
                        
                        <div class="options-container">
                        ${question.options.map((option, i) => `
                                <label class="option-item" data-option="${i}">
                                    <input type="radio" name="question${index}" value="${i}" class="option-input">
                                    <span class="option-letter">${optionLetters[i]}</span>
                                    <span class="option-text answer-content">${renderHTMLContent(option)}</span>
                            </label>
                        `).join('')}
                        </div>
                    </div>
                    
                    <div class="question-navigation">
                        ${index > 0 ? `<button id="prev-question-btn" class="btn option-btn">Previous</button>` : ''}
                        <button id="next-question-btn" class="btn">
                            ${index === totalQuestions - 1 ? 'Submit Test' : 'Next Question'}
                        </button>
                    </div>
                </div>
            `;

            // Add event listeners for navigation
            const nextBtn = document.getElementById('next-question-btn');
            const prevBtn = document.getElementById('prev-question-btn');

            nextBtn.addEventListener('click', () => {
                const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
                userAnswers[index] = selectedOption ? parseInt(selectedOption.value) : null;
                
                if (currentQuestionIndex < totalQuestions - 1) {
                    currentQuestionIndex++;
                    showQuestion(currentQuestionIndex);
                } else {
                    // Check if all questions are answered
                    const answeredCount = userAnswers.filter(answer => answer !== null && answer !== undefined).length;
                    const unansweredCount = totalQuestions - answeredCount;
                    
                    if (unansweredCount > 0) {
                        const confirmationHtml = `
                            <div class="confirmation-dialog">
                                <div class="confirmation-content">
                                    <h3>Unanswered Questions</h3>
                                    <p>You have ${unansweredCount} unanswered question(s).</p>
                                    <p>Are you sure you want to submit the test?</p>
                                    <div class="confirmation-buttons">
                                        <button id="confirm-submit-test" class="btn btn-danger">Submit Anyway</button>
                                        <button id="cancel-submit-test" class="btn btn-secondary">Keep Working</button>
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
                        document.getElementById('confirm-submit-test').addEventListener('click', function() {
                            const dialog = document.querySelector('.confirmation-dialog');
                            if (dialog) dialog.remove();
                            showResults(test, userAnswers);
                        });
                        
                        document.getElementById('cancel-submit-test').addEventListener('click', function() {
                            const dialog = document.querySelector('.confirmation-dialog');
                            if (dialog) dialog.remove();
                        });
                        
                        // Close dialog when clicking outside
                        document.querySelector('.confirmation-dialog').addEventListener('click', function(e) {
                            if (e.target === this) {
                                this.remove();
                            }
                        });
                    } else {
                        if (window.globalTimer) {
                            clearInterval(window.globalTimer);
                        }
                        showResults(test, userAnswers);
                    }
                }
            });

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
                    userAnswers[index] = selectedOption ? parseInt(selectedOption.value) : null;
                    
                    if (currentQuestionIndex > 0) {
                        currentQuestionIndex--;
                        showQuestion(currentQuestionIndex);
                    }
                });
            }



            // Add keyboard navigation
            document.addEventListener('keydown', handleKeyPress);

            // Add click handlers for question dots
            document.querySelectorAll('.question-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
                    userAnswers[index] = selectedOption ? parseInt(selectedOption.value) : null;
                    
                    const targetQuestion = parseInt(dot.dataset.question);
                    currentQuestionIndex = targetQuestion;
                    showQuestion(currentQuestionIndex);
                });
            });

            // Pre-select previously answered question
            if (userAnswers[index] !== undefined && userAnswers[index] !== null) {
                const radioButton = document.querySelector(`input[name="question${index}"][value="${userAnswers[index]}"]`);
                if (radioButton) {
                    radioButton.checked = true;
                }
            }
        }

        function startTimer() {
            if (!test.timeLimit) return;
            
            window.globalTimer = setInterval(() => {
                timeRemaining--;
                
                if (timeRemaining <= 0) {
                    clearInterval(window.globalTimer);
                    alert('Time is up! Your test will be submitted automatically.');
                    showResults(test, userAnswers);
                    return;
                }
                
                const minutes = Math.floor(timeRemaining / 60);
                const seconds = timeRemaining % 60;
                const timerElement = document.getElementById('timer');
                if (timerElement) {
                    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                
                // Change color when time is running low (less than 5 minutes)
                if (timeRemaining <= 300 && timerElement) {
                    timerElement.style.color = '#e74c3c';
                    timerElement.style.fontWeight = 'bold';
                }
            }, 1000);
        }

        function handleKeyPress(event) {
            const currentQuestion = test.questions[currentQuestionIndex];
            const numOptions = currentQuestion.options.length;
            
            // Number keys 1-6 for options A-F
            if (event.key >= '1' && event.key <= '6') {
                const optionIndex = parseInt(event.key) - 1;
                if (optionIndex < numOptions) {
                    const radioButton = document.querySelector(`input[name="question${currentQuestionIndex}"][value="${optionIndex}"]`);
                    if (radioButton) {
                        radioButton.checked = true;
                    }
                }
            }
            
            // Arrow keys for navigation
            if (event.key === 'ArrowRight' || event.key === 'Enter') {
                const nextBtn = document.getElementById('next-question-btn');
                if (nextBtn) {
                    nextBtn.click();
                }
            }
            
            if (event.key === 'ArrowLeft') {
                const prevBtn = document.getElementById('prev-question-btn');
                if (prevBtn) {
                    prevBtn.click();
                }
            }
        }

        showQuestion(currentQuestionIndex);
        startTimer();
        modal.style.display = 'flex';
    }

    function showReviewModal(test, userAnswers) {
        const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        let reviewHTML = `
            <div class="test-review">
                <h2>Review All Questions - ${test.title}</h2>
                <div class="review-summary">
                    <p>Review your answers before submitting the test.</p>
                </div>
        `;

        test.questions.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            const userAnswerText = userAnswer !== null && userAnswer !== undefined 
                ? `${optionLetters[userAnswer]}. ${q.options[userAnswer]}` 
                : 'Not answered';
            
            reviewHTML += `
                <div class="review-question">
                    <h4>Question ${i + 1}</h4>
                    <p class="question-text">${renderHTMLContent(q.text || q.question)}</p>
                    <p class="your-answer-review">
                        <strong>Your answer:</strong> <span class="answer-content">${renderHTMLContent(userAnswerText)}</span>
                    </p>
                    <button class="btn option-btn review-edit-btn" data-question="${i}">Edit Answer</button>
                </div>
            `;
        });

        reviewHTML += `
                <div class="review-actions">
                    <button id="submit-from-review-btn" class="btn">Submit Test</button>
                    <button id="back-to-test-btn" class="btn option-btn">Back to Test</button>
                </div>
            </div>
        `;
        
        modalContent.innerHTML = reviewHTML;

        // Add event listeners for review actions
        document.getElementById('submit-from-review-btn').onclick = function() {
            if (window.globalTimer) {
                clearInterval(window.globalTimer);
            }
            showResults(test, userAnswers);
        };

        document.getElementById('back-to-test-btn').onclick = function() {
            showQuestion(currentQuestionIndex);
        };

        // Add event listeners for edit buttons
        document.querySelectorAll('.review-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const questionIndex = parseInt(btn.dataset.question);
                currentQuestionIndex = questionIndex;
                showQuestion(currentQuestionIndex);
            });
        });
    }

    function showResults(test, userAnswers) {
        let score = 0;
        const totalQuestions = test.questions.length;
        const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        let resultsHTML = `
            <div class="test-results">
                <h2>${test.title} - Test Results</h2>
                <div class="score-summary">
                    <h3>Your Score: ${score}/${totalQuestions}</h3>
                    <div class="score-percentage">
                        <span>${Math.round((score / totalQuestions) * 100)}%</span>
                    </div>
                </div>
        `;

        test.questions.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            const correctAnswer = q.correct;
            const isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) {
                score++;
            }
            
            const userAnswerText = userAnswer !== null && userAnswer !== undefined 
                ? `${optionLetters[userAnswer]}. ${q.options[userAnswer]}` 
                : 'Not answered';
            const correctAnswerText = `${optionLetters[correctAnswer]}. ${q.options[correctAnswer]}`;
            
            resultsHTML += `
                <div class="question-result ${isCorrect ? 'correct' : 'incorrect'}">
                    <h4>Question ${i + 1}</h4>
                    <p class="question-text">${renderHTMLContent(q.text || q.question)}</p>
                    <div class="answer-details">
                        <p class="your-answer">
                            <strong>Your answer:</strong> <span class="answer-content">${renderHTMLContent(userAnswerText)}</span>
                            <span class="result-icon">${isCorrect ? '✓' : '✗'}</span>
                        </p>
                        ${!isCorrect ? `<p class="correct-answer"><strong>Correct answer:</strong> <span class="answer-content">${renderHTMLContent(correctAnswerText)}</span></p>` : ''}
                    </div>
                </div>
            `;
        });

        // Update the score in the summary
        resultsHTML = resultsHTML.replace('Your Score: 0/', `Your Score: ${score}/`);
        resultsHTML = resultsHTML.replace('0%', `${Math.round((score / totalQuestions) * 100)}%`);

        resultsHTML += `
                <div class="result-actions">
                    <button id="print-result-btn" class="btn">Print Result</button>
                    <button id="close-result-btn" class="btn option-btn">Close</button>
                </div>
            </div>
        `;
        
        modalContent.innerHTML = resultsHTML;

        // Store result in localStorage by student
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const studentName = currentUser.name || 'Unknown Student';
        const studentId = currentUser.email || currentUser.id || 'student';
        
        let allResults = JSON.parse(localStorage.getItem('testResultsByStudent') || '{}');
        if (!allResults[studentId]) allResults[studentId] = [];
        allResults[studentId].push({
            testId: test.id,
            testTitle: test.title,
            studentName: studentName,
            studentEmail: studentId,
            score: score,
            total: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            date: new Date().toISOString(),
            answers: userAnswers
        });
        localStorage.setItem('testResultsByStudent', JSON.stringify(allResults));
        
        // Log activity
        if (typeof logActivity === 'function') {
            logActivity('test', 'Completed Test', `Completed test: ${test.title} - Score: ${score}/${test.questions.length}`, 'test.html');
        }

        // Event listeners for result actions
        document.getElementById('print-result-btn').onclick = function() {
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write('<html><head><title>Test Result - ' + test.title + '</title>');
            printWindow.document.write('<link rel="stylesheet" href="css/style.css">');
            printWindow.document.write('<style>');
            printWindow.document.write('.test-results { padding: 20px; }');
            printWindow.document.write('.question-result { margin: 15px 0; padding: 10px; border: 1px solid #ddd; }');
            printWindow.document.write('.correct { background-color: #d4edda; }');
            printWindow.document.write('.incorrect { background-color: #f8d7da; }');
            printWindow.document.write('.result-actions { display: none; }');
            printWindow.document.write('</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<div>' + modalContent.innerHTML + '</div>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };

        document.getElementById('close-result-btn').onclick = function() {
            if (window.globalTimer) {
                clearInterval(window.globalTimer);
            }
            modal.style.display = 'none';
        };
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            if (window.globalTimer) {
                clearInterval(window.globalTimer);
            }
            modal.style.display = 'none';
        });
    } else {
        console.error('Close button not found');
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            // Create confirmation UI
            const confirmationHtml = `
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Exit Test</h3>
                        <p>Are you sure you want to exit the test?</p>
                        <p>Your progress will be lost if you haven't submitted your answers.</p>
                        <div class="confirmation-buttons">
                            <button id="confirm-exit-test" class="btn btn-danger">Exit</button>
                            <button id="cancel-exit-test" class="btn btn-secondary">Cancel</button>
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
            document.getElementById('confirm-exit-test').addEventListener('click', function() {
                if (window.globalTimer) {
                    clearInterval(window.globalTimer);
                }
                modal.style.display = 'none';
                const dialog = document.querySelector('.confirmation-dialog');
                if (dialog) dialog.remove();
            });
            
            document.getElementById('cancel-exit-test').addEventListener('click', function() {
                const dialog = document.querySelector('.confirmation-dialog');
                if (dialog) dialog.remove();
            });
        }
    });

    displayTests();
});

// Global function to close test modal
function closeTestModal() {
    console.log('closeTestModal function called');
    const modal = document.getElementById('take-test-modal');
    
    // Create confirmation UI
    const confirmationHtml = `
        <div class="confirmation-dialog">
            <div class="confirmation-content">
                <h3>Exit Test</h3>
                <p>Are you sure you want to exit the test?</p>
                <p>Your progress will be lost if you haven't submitted your answers.</p>
                <div class="confirmation-buttons">
                    <button id="confirm-close-test" class="btn btn-danger">Exit</button>
                    <button id="cancel-close-test" class="btn btn-secondary">Cancel</button>
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
    document.getElementById('confirm-close-test').addEventListener('click', function() {
        if (window.globalTimer) {
            clearInterval(window.globalTimer);
        }
        if (modal) {
            modal.style.display = 'none';
        }
        const dialog = document.querySelector('.confirmation-dialog');
        if (dialog) dialog.remove();
    });
    
    document.getElementById('cancel-close-test').addEventListener('click', function() {
        const dialog = document.querySelector('.confirmation-dialog');
        if (dialog) dialog.remove();
    });
} 