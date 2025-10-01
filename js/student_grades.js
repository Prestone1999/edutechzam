// Student Grades Manager
class StudentGradesManager {
    constructor() {
        this.gradesKey = 'eduTech_grades';
        this.studentsKey = 'eduTech_students';
        this.coursesKey = 'eduTech_courses';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilters = {
            term: 'all',
            course: 'all',
            grade: 'all'
        };
        
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeEventListeners();
            this.loadStudentGrades();
            this.initializeChart();
        });
    }

    // Get grades from localStorage
    getGrades() {
        return JSON.parse(localStorage.getItem(this.gradesKey)) || [];
    }

    // Get courses from localStorage
    getCourses() {
        return JSON.parse(localStorage.getItem(this.coursesKey)) || [];
    }

    // Get current student ID from the active session
    getCurrentStudentId() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) {
            console.error('No user is currently logged in');
            return null;
        }
        return currentUser.id;
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Filter controls
        document.getElementById('term-filter')?.addEventListener('change', (e) => {
            this.currentFilters.term = e.target.value;
            this.loadStudentGrades();
        });

        document.getElementById('course-filter')?.addEventListener('change', (e) => {
            this.currentFilters.course = e.target.value;
            this.loadStudentGrades();
        });

        document.getElementById('grade-filter')?.addEventListener('change', (e) => {
            this.currentFilters.grade = e.target.value;
            this.loadStudentGrades();
        });

        // Apply filters button
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            this.loadStudentGrades();
        });

        // Reset filters button
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Print grades button
        document.getElementById('print-grades')?.addEventListener('click', () => {
            // populate print header details just before printing
            try {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                const nameEl = document.getElementById('print-student-name');
                if (nameEl && currentUser) {
                    nameEl.textContent = currentUser.name || currentUser.email || 'Student';
                }
                const dateEl = document.getElementById('print-date');
                if (dateEl) {
                    const now = new Date();
                    dateEl.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
                }
            } catch (e) {}
            window.print();
        });

        // Pagination
        document.getElementById('prev-page')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadStudentGrades();
            }
        });

        document.getElementById('next-page')?.addEventListener('click', () => {
            const totalPages = Math.ceil(this.getFilteredGrades().length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.loadStudentGrades();
            }
        });

        // Close modal
        document.getElementById('close-grade-detail')?.addEventListener('click', () => {
            document.getElementById('grade-detail-modal').classList.remove('active');
        });
    }

    // Reset all filters
    resetFilters() {
        this.currentFilters = {
            term: 'all',
            course: 'all',
            grade: 'all'
        };
        
        // Reset UI
        document.getElementById('term-filter').value = 'all';
        document.getElementById('course-filter').value = 'all';
        document.getElementById('grade-filter').value = 'all';
        
        this.loadStudentGrades();
    }

    // Get filtered grades based on current filters
    getFilteredGrades() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) return [];
        
        const allGrades = this.getGrades();
        
        // Find grades that match either studentId or studentEmail (for backward compatibility)
        const studentGrades = allGrades.filter(grade => {
            return grade.studentId === currentUser.id || 
                   grade.studentEmail === currentUser.email;
        });
        
        console.log('Student grades found:', studentGrades);
        
        return studentGrades.filter(grade => {
            // Filter by term
            if (this.currentFilters.term !== 'all' && grade.term !== this.currentFilters.term) {
                return false;
            }
            
            // Filter by course
            if (this.currentFilters.course !== 'all' && grade.courseId !== this.currentFilters.course) {
                return false;
            }
            
            // Filter by grade
            if (this.currentFilters.grade !== 'all') {
                const gradeLetter = this.getLetterGrade(grade.grade);
                if (gradeLetter !== this.currentFilters.grade) {
                    return false;
                }
            }
            
            return true;
        });
    }

    // Convert numeric grade to letter grade
    getLetterGrade(grade) {
        if (typeof grade === 'string' && /^[A-F][+-]?$/.test(grade.toUpperCase())) {
            return grade.toUpperCase().charAt(0);
        }
        
        const numGrade = parseFloat(grade);
        if (isNaN(numGrade)) return 'N/A';
        
        if (numGrade >= 90) return 'A';
        if (numGrade >= 80) return 'B';
        if (numGrade >= 70) return 'C';
        if (numGrade >= 60) return 'D';
        return 'F';
    }

    // Load and display student grades
    loadStudentGrades() {
        const filteredGrades = this.getFilteredGrades();
        const totalPages = Math.ceil(filteredGrades.length / this.itemsPerPage);
        
        // Update pagination
        this.updatePagination(filteredGrades.length);
        
        // Get current page grades
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageGrades = filteredGrades.slice(startIndex, endIndex);
        
        // Populate grades table
        this.populateGradesTable(currentPageGrades);
        
        // Update summary stats
        this.updateSummaryStats(filteredGrades);
        
        // Update chart
        this.updateGradeDistributionChart(filteredGrades);
    }

    // Populate grades table with data
    populateGradesTable(grades) {
        const tbody = document.getElementById('grades-table-body');
        if (!tbody) return;
        
        if (grades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No grades found matching your filters.</td></tr>';
            return;
        }
        
        const courses = this.getCourses();
        let html = '';
        
        grades.forEach(grade => {
            // Try to find course by ID first, then by name
            let course = courses.find(c => c.id === grade.courseId || c.id === grade.courseName);
            
            // If not found by ID, try to find by name
            if (!course && grade.courseName) {
                course = courses.find(c => c.name === grade.courseName);
            }
            
            // If still not found, use the course name from the grade or 'Unknown Course'
            const courseName = course ? course.name : (grade.courseName || 'Unknown Course');
            const gradeLetter = this.getLetterGrade(grade.grade);
            const gradeClass = `grade-${gradeLetter}`;
            const date = new Date(grade.date).toLocaleDateString();
            
            html += `
                <tr>
                    <td>${courseName}</td>
                    <td>${grade.assignment || 'N/A'}</td>
                    <td>${grade.type || 'Assignment'}</td>
                    <td>${date}</td>
                    <td class="${gradeClass}">${grade.grade}</td>
                    <td><span class="status-badge ${grade.status || 'graded'}">${grade.status || 'Graded'}</span></td>
                    <td>
                        <button class="btn-icon view-grade" data-grade-id="${grade.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Add event listeners to view grade buttons
        document.querySelectorAll('.view-grade').forEach(button => {
            button.addEventListener('click', (e) => {
                const gradeId = e.currentTarget.dataset.gradeId;
                this.showGradeDetails(gradeId);
            });
        });
    }

    // Update pagination controls
    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const currentPageEl = document.getElementById('current-page');
        const totalPagesEl = document.getElementById('total-pages');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (currentPageEl) currentPageEl.textContent = this.currentPage;
        if (totalPagesEl) totalPagesEl.textContent = totalPages || 1;
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    // Update summary statistics
    updateSummaryStats(grades) {
        if (grades.length === 0) return;
        
        // Calculate GPA (simple average for demo)
        const numericGrades = grades
            .filter(g => !isNaN(parseFloat(g.grade)))
            .map(g => parseFloat(g.grade));
        
        const averageGrade = numericGrades.length > 0 
            ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(2)
            : 'N/A';
        
        // Update UI
        document.getElementById('gpa').textContent = averageGrade;
        document.getElementById('credits-earned').textContent = grades.length * 3; // Assuming 3 credits per course
        document.getElementById('courses-taken').textContent = new Set(grades.map(g => g.courseId)).size;
    }

    // Initialize the grade distribution chart
    initializeChart() {
        const ctx = document.getElementById('grade-distribution-chart');
        if (!ctx) return;
        
        this.gradeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C', 'D', 'F'],
                datasets: [{
                    label: 'Grade Distribution',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Your Grade Distribution',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }

    // Update the grade distribution chart
    updateGradeDistributionChart(grades) {
        if (!this.gradeChart) return;
        
        // Count grades by letter
        const gradeCounts = {
            'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0
        };
        
        grades.forEach(grade => {
            const letterGrade = this.getLetterGrade(grade.grade);
            if (gradeCounts.hasOwnProperty(letterGrade)) {
                gradeCounts[letterGrade]++;
            }
        });
        
        // Update chart data
        this.gradeChart.data.datasets[0].data = [
            gradeCounts['A'],
            gradeCounts['B'],
            gradeCounts['C'],
            gradeCounts['D'],
            gradeCounts['F']
        ];
        
        this.gradeChart.update();
    }

    // Show grade details in modal
    showGradeDetails(gradeId) {
        const grade = this.getGrades().find(g => g.id === gradeId);
        if (!grade) return;
        
        const courses = this.getCourses();
        const course = courses.find(c => c.id === grade.courseId) || { name: 'Unknown Course' };
        const date = new Date(grade.date).toLocaleString();
        const gradeLetter = this.getLetterGrade(grade.grade);
        
        // Create modal content
        const modalContent = `
            <div class="grade-detail">
                <div class="detail-row">
                    <span class="detail-label">Course:</span>
                    <span class="detail-value">${course.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Assignment:</span>
                    <span class="detail-value">${grade.assignment || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${grade.type || 'Assignment'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date Graded:</span>
                    <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Grade:</span>
                    <span class="detail-value grade-${gradeLetter}">${grade.grade} (${gradeLetter})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge ${grade.status || 'graded'}">${grade.status || 'Graded'}</span>
                </div>
                <div class="detail-row full-width">
                    <span class="detail-label">Feedback:</span>
                    <div class="feedback-content">${grade.feedback || 'No feedback provided.'}</div>
                </div>
                ${grade.rubric ? `
                <div class="detail-row full-width">
                    <span class="detail-label">Rubric:</span>
                    <div class="rubric-container">
                        ${this.formatRubric(grade.rubric)}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Update modal and show it
        document.getElementById('grade-detail-content').innerHTML = modalContent;
        document.getElementById('grade-detail-modal').classList.add('active');
    }
    
    // Format rubric data for display
    formatRubric(rubric) {
        if (!rubric || !rubric.criteria || !Array.isArray(rubric.criteria)) {
            return '<p>No rubric data available.</p>';
        }
        
        let html = '<div class="rubric">';
        
        rubric.criteria.forEach(criterion => {
            html += `
                <div class="rubric-criterion">
                    <div class="criterion-name">${criterion.name} (${criterion.score || 0}/${criterion.maxScore || 0})</div>
                    <div class="criterion-feedback">${criterion.feedback || 'No specific feedback.'}</div>
                </div>
            `;
        });
        
        if (rubric.comments) {
            html += `
                <div class="rubric-comments">
                    <strong>Additional Comments:</strong>
                    <p>${rubric.comments}</p>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
}

// Initialize the StudentGradesManager when the page loads
window.studentGradesManager = new StudentGradesManager();
