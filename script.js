document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const mainContentDiv = document.getElementById('main-content');
    const mainTitle = document.getElementById('main-title'); // <--- NEW: Get the main title element
    const categorySelection = document.querySelector('.category-selection');
    const subcategorySelection = document.getElementById('subcategory-selection');
    const quizContainer = document.getElementById('quiz-container');
    const quizResultPage = document.getElementById('quiz-result-page');
    const historyPage = document.getElementById('history-page');
    const revisionPage = document.getElementById('revision-page'); // Specific to last quiz
    const globalRevisionHistoryPage = document.getElementById('global-revision-history-page'); // New global page

    const networkCategory = document.getElementById('network-category');
    const securityCategory = document.getElementById('security-category');
    const cyberCategory = document.getElementById('cyber-category');

    const quizTitle = document.getElementById('quiz-title');
    const questionCountSpan = document.getElementById('question-count');
    const progressBar = document.getElementById('progressBar');
    const quizQuestionDiv = document.getElementById('quiz-question');
    const optionsList = document.getElementById('options-list');
    const feedbackDiv = document.getElementById('feedback');
    const explanationDiv = document.getElementById('explanation');
    const nextButton = document.getElementById('next-question-btn');
    const backFromQuizBtn = document.getElementById('back-from-quiz-btn');

    // Result Page Elements
    const finalScoreSpan = document.getElementById('final-score');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const scorePercentageSpan = document.getElementById('score-percentage');
    const resultToSubcategoriesBtn = document.getElementById('result-to-subcategories-btn');
    const viewRevisionBtn = document.getElementById('view-revision-btn');

    // History Page Elements
    const historyLink = document.getElementById('history-link');
    const historyContent = document.getElementById('history-content');
    const historyBackBtn = document.getElementById('history-back-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Revision Page (for current quiz) Elements
    const revisionTopicsContent = document.getElementById('revision-topics-content');
    const revisionBackBtn = document.getElementById('revision-back-btn');

    // Global Revision History Page Elements
    const revisionHistoryLink = document.getElementById('revision-history-link');
    const globalRevisionContent = document.getElementById('global-revision-content');
    const globalRevisionBackBtn = document.getElementById('global-revision-back-btn');
    const clearGlobalRevisionBtn = document.getElementById('clear-global-revision-btn');

    // Footer Element
    const footerText = document.getElementById('footer-text');

    // Navbar and Burger Menu
    const homeLink = document.getElementById('home-link');
    const burgerMenu = document.getElementById('burgerMenu');
    const navLinks = document.getElementById('navLinks');

    // --- Quiz Data and State Variables ---
    let quizData = null;
    let currentCategory = null;
    let currentSubcategory = null;
    let currentQuizIndex = 0;
    let quizzesForSubcategory = [];
    let correctAnswers = 0;
    let incorrectTopics = []; // To store topics for revision for the *current* quiz

    // --- Local Storage Keys ---
    const HISTORY_KEY = 'quizHistory';
    const GLOBAL_REVISION_KEY = 'globalRevisionTopics'; // New key for persistent revision topics

    // --- Page Management Functions ---
    // Controls which main section is visible
    function showPage(pageElement) {
        // First, hide all major 'parent' containers
        mainContentDiv.classList.add('page-hidden');
        historyPage.classList.add('page-hidden');
        revisionPage.classList.add('page-hidden'); // The 'last quiz' revision page
        globalRevisionHistoryPage.classList.add('page-hidden'); // The 'global' revision page

        // Now, determine which page was requested and show it appropriately
        if (pageElement === historyPage) {
            mainTitle.style.display = 'none'; // Hide main title for history page
            pageElement.classList.remove('page-hidden');
            pageElement.style.display = 'block';
        } else if (pageElement === globalRevisionHistoryPage) {
            mainTitle.style.display = 'none'; // Hide main title for global revision page
            pageElement.classList.remove('page-hidden');
            pageElement.style.display = 'block';
        } else if (pageElement === revisionPage) { // Specific revision page after quiz
            mainTitle.style.display = 'none'; // Hide main title for this specific revision page
            pageElement.classList.remove('page-hidden');
            pageElement.style.display = 'block';
        } else {
            // All other pages (category, subcategory, quiz, result) are within mainContentDiv
            mainContentDiv.classList.remove('page-hidden'); // Show the main content wrapper
            mainTitle.style.display = 'block'; // Ensure main title is visible for these pages

            // Hide all potential children of mainContentDiv
            const allQuizRelatedPages = [
                categorySelection,
                subcategorySelection,
                quizContainer,
                quizResultPage
            ];
            allQuizRelatedPages.forEach(page => page.classList.add('page-hidden'));

            // Show the specific requested page within mainContentDiv
            pageElement.classList.remove('page-hidden');
            // Special handling for category selection to restore flex
            if (pageElement === categorySelection) {
                pageElement.style.display = 'flex';
                mainTitle.textContent = 'Select a Category'; // Set title for initial category view
            } else if (pageElement === subcategorySelection) {
                pageElement.style.display = 'block';
                mainTitle.textContent = 'Select a Subcategory'; // Set title for subcategory view
            } else if (pageElement === quizContainer) {
                pageElement.style.display = 'block';
                mainTitle.textContent = `${currentSubcategory} Quiz`; // Title for active quiz
            } else if (pageElement === quizResultPage) {
                pageElement.style.display = 'block';
                mainTitle.textContent = 'Quiz Complete!'; // Title for quiz result
            } else {
                pageElement.style.display = 'block'; // Default for other pages
            }
        }
        // Close burger menu if open when navigating to a new page
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            burgerMenu.classList.remove('active'); // Also remove active class from burger icon
            burgerMenu.innerHTML = '&#9776;'; // Change icon back to burger
        }
    }

    // Resets current quiz progress but keeps category/subcategory selection for 'Back' actions
    function resetQuizState() {
        correctAnswers = 0;
        incorrectTopics = [];
        currentQuizIndex = 0;
        quizzesForSubcategory = []; // Clear quizzes for current subcategory
        quizTitle.textContent = '';
        questionCountSpan.textContent = '';
        progressBar.style.width = '0%';
        quizQuestionDiv.textContent = '';
        optionsList.innerHTML = '';
        feedbackDiv.textContent = '';
        explanationDiv.textContent = '';
        nextButton.disabled = false; // Enable next button for new quiz
    }

    // Resets the entire application to the initial category selection view
    function goToHomePage() {
        resetQuizState();
        currentCategory = null;
        currentSubcategory = null;
        showPage(categorySelection); // This will now correctly show the categories
    }

    // --- Navigation Bar and Burger Menu Logic ---
    burgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        burgerMenu.classList.toggle('active'); // Toggle active class on burger menu itself
        if (burgerMenu.classList.contains('active')) {
            burgerMenu.innerHTML = '&#10006;'; // Change to cross icon
        } else {
            burgerMenu.innerHTML = '&#9776;'; // Change back to burger icon
        }
    });

    homeLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior (full page reload)
        goToHomePage();
        // showPage function now handles closing the menu
    });

    historyLink.addEventListener('click', (event) => {
        event.preventDefault();
        displayHistory();
        // showPage function now handles closing the menu
    });

    revisionHistoryLink.addEventListener('click', (event) => {
        event.preventDefault();
        displayGlobalRevisionHistory();
        // showPage function now handles closing the menu
    });

    historyBackBtn.addEventListener('click', goToHomePage);
    revisionBackBtn.addEventListener('click', () => showPage(quizResultPage));
    globalRevisionBackBtn.addEventListener('click', goToHomePage); // Back from global revision to home
    viewRevisionBtn.addEventListener('click', displayRevisionTopics);

    // --- Clear History Event Listeners ---
    clearHistoryBtn.addEventListener('click', () => clearAllHistory('standard'));
    clearGlobalRevisionBtn.addEventListener('click', () => clearAllHistory('global'));

    // --- Fetch Quiz Data ---
    fetch('questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            quizData = data;
            goToHomePage(); // Start on the home page once data is loaded
        })
        .catch(error => {
            console.error('Error fetching quiz data:', error);
            alert('Could not load quiz data. Please try again later. Check console for details.');
        });

    // --- Event listeners for category selection ---
    networkCategory.addEventListener('click', () => {
        currentCategory = 'Network';
        displaySubcategories();
    });

    securityCategory.addEventListener('click', () => {
        currentCategory = 'Security';
        displaySubcategories();
    });

    cyberCategory.addEventListener('click', () => {
        currentCategory = 'Cybersecurity';
        displaySubcategories();
    });

    // --- Display Subcategories ---
    function displaySubcategories() {
        if (!quizData) {
            console.error("Quiz data not loaded yet.");
            return;
        }

        resetQuizState(); // Reset state when moving to subcategories list
        showPage(subcategorySelection);
        mainTitle.textContent = 'Select a Subcategory'; // <--- Set title for subcategory view
        backFromQuizBtn.style.display = 'none'; // Hide back button from quiz when showing subcategories

        subcategorySelection.innerHTML = ''; // Clear previous content

        const category = quizData.categories.find(cat => cat.name === currentCategory);

        if (category) {
            const subcategoryTitle = document.createElement('h2');
            subcategoryTitle.textContent = `Select a ${currentCategory} Subcategory`; // More specific subcategory title
            // subcategorySelection.appendChild(subcategoryTitle);

            category.subcategories.forEach(subcat => {
                const subcategoryItem = document.createElement('div');
                subcategoryItem.classList.add('subcategory-item');
                subcategoryItem.textContent = subcat.name;
                subcategoryItem.addEventListener('click', () => {
                    currentSubcategory = subcat.name;
                    quizzesForSubcategory = subcat.quizzes;
                    currentQuizIndex = 0; // Reset quiz index for new subcategory
                    correctAnswers = 0; // Reset score for new quiz
                    incorrectTopics = []; // Reset revision topics
                    displayQuiz();
                });
                subcategorySelection.appendChild(subcategoryItem);
            });
        }
    }

    // --- Display Quiz ---
    function displayQuiz() {
        // If no quizzes are available for the selected subcategory
        if (!quizzesForSubcategory || quizzesForSubcategory.length === 0) {
            displayQuizResult(); // Show a 0/0 result page
            return;
        }

        showPage(quizContainer);
        mainTitle.textContent = `Practice Quiz`; // <--- Set title for active quiz
        backFromQuizBtn.style.display = 'block'; // Always show back button in quiz view

        const quiz = quizzesForSubcategory[currentQuizIndex];

        // Update Quiz Header (Title, Question Count, Progress Bar)
        quizTitle.textContent = `${currentSubcategory}`;
        questionCountSpan.textContent = `Question ${currentQuizIndex + 1} of ${quizzesForSubcategory.length}`;
        const progressPercentage = ((currentQuizIndex + 1) / quizzesForSubcategory.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        // Update Question and Options
        quizQuestionDiv.textContent = `${currentQuizIndex + 1}. ${quiz.question}`;
        optionsList.innerHTML = ''; // Clear previous options
        quiz.options.forEach((option, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', index);
            li.textContent = option;
            optionsList.appendChild(li);
        });

        // Reset feedback and explanation for the new question
        feedbackDiv.textContent = '';
        explanationDiv.textContent = '';
        optionsList.style.pointerEvents = 'auto'; // Re-enable clicks for new question

        // Update navigation button states
        nextButton.textContent = (currentQuizIndex === quizzesForSubcategory.length - 1) ? 'Finish Quiz' : 'Next';

        // --- Option Click Listener for current quiz question ---
        optionsList.querySelectorAll('li').forEach(optionLi => {
            optionLi.addEventListener('click', (event) => {
                // Disable further clicks on options for this question after selection
                optionsList.style.pointerEvents = 'none';

                const selectedOption = event.target.textContent;
                const allOptions = optionsList.querySelectorAll('li');

                // Clear previous feedback and styling for all options
                allOptions.forEach(li => {
                    li.classList.remove('correct', 'incorrect');
                });
                feedbackDiv.textContent = '';
                explanationDiv.textContent = '';

                if (selectedOption === quiz.answer) {
                    event.target.classList.add('correct');
                    feedbackDiv.textContent = 'Correct!';
                    feedbackDiv.style.color = '#28a745';
                    correctAnswers++; // Increment score for correct answer
                } else {
                    event.target.classList.add('incorrect');
                    feedbackDiv.textContent = 'Incorrect.';
                    feedbackDiv.style.color = '#dc3545';
                    // Highlight the correct answer even if user got it wrong
                    allOptions.forEach(li => {
                        if (li.textContent === quiz.answer) {
                            li.classList.add('correct');
                        }
                    });
                    // Add topic for revision (use specific topic if available, otherwise subcategory name)
                    const topic = quiz.topic || currentSubcategory;
                    if (!incorrectTopics.includes(topic)) {
                        incorrectTopics.push(topic);
                    }
                }
                explanationDiv.textContent = quiz.explanation; // Display explanation for the answer
            });
        });
    }

    // --- Quiz Navigation Buttons ---
    nextButton.addEventListener('click', () => {
        // Ensure an answer was selected before moving next
        if (optionsList.style.pointerEvents !== 'none' && quizzesForSubcategory.length > 0) {
            // Only alert if there are questions to answer and no option is selected
            if (!optionsList.querySelector('.correct, .incorrect')) {
                alert('Please select an answer before proceeding!');
                return;
            }
        }

        currentQuizIndex++;
        if (currentQuizIndex < quizzesForSubcategory.length) {
            displayQuiz(); // Move to the next question
        } else {
            // Quiz is finished
            saveQuizResult(); // Save the score and details to history
            saveIncorrectTopicsToGlobalRevision(); // Save incorrect topics to global revision
            displayQuizResult(); // Show the quiz result page
        }
    });

    // Button to go back from the quiz to subcategories (aborts current quiz)
    backFromQuizBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to go back? Your current quiz progress will be lost.")) {
            resetQuizState();
            displaySubcategories();
        }
    });

    // --- Quiz Result Display ---
    function displayQuizResult() {
        showPage(quizResultPage); // Show the result page
        mainTitle.textContent = 'Quiz Complete!'; // <--- Set title for quiz result
        finalScoreSpan.textContent = correctAnswers;
        totalQuestionsSpan.textContent = quizzesForSubcategory.length;
        const percentage = quizzesForSubcategory.length > 0
            ? Math.round((correctAnswers / quizzesForSubcategory.length) * 100)
            : 0;
        scorePercentageSpan.textContent = `${percentage}%`;

        // Hide View Revision button if no incorrect topics were recorded for THIS quiz
        if (incorrectTopics.length === 0) {
            viewRevisionBtn.style.display = 'none';
        } else {
            viewRevisionBtn.style.display = 'inline-block'; // Show it
        }
    }

    // Button to go from result page back to subcategories
    resultToSubcategoriesBtn.addEventListener('click', () => {
        resetQuizState(); // Clear quiz state
        displaySubcategories(); // Show subcategories
    });

    // --- Save Quiz Result to Local Storage ---
    function saveQuizResult() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; // Get existing history or empty array
        const result = {
            category: currentCategory,
            subcategory: currentSubcategory,
            score: correctAnswers,
            total: quizzesForSubcategory.length,
            percentage: quizzesForSubcategory.length > 0 ? Math.round((correctAnswers / quizzesForSubcategory.length) * 100) : 0,
            date: new Date().toLocaleString(), // Current date and time
            incorrectTopics: incorrectTopics.slice() // Store a copy of topics for revision from *this* quiz
        };
        history.push(result); // Add current quiz result to history
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); // Save updated history
    }

    // --- Save Incorrect Topics to Global Revision History ---
    function saveIncorrectTopicsToGlobalRevision() {
        let globalRevision = JSON.parse(localStorage.getItem(GLOBAL_REVISION_KEY)) || {};
        incorrectTopics.forEach(topic => {
            if (globalRevision[currentCategory]) {
                if (globalRevision[currentCategory][topic]) {
                    globalRevision[currentCategory][topic]++; // Increment count
                } else {
                    globalRevision[currentCategory][topic] = 1; // First occurrence
                }
            } else {
                globalRevision[currentCategory] = { [topic]: 1 };
            }
        });
        localStorage.setItem(GLOBAL_REVISION_KEY, JSON.stringify(globalRevision));
    }

    // --- Display History (Quiz Runs) ---
    function displayHistory() {
        showPage(historyPage); // Show the history page
        historyContent.innerHTML = ''; // Clear previous content
        mainTitle.style.display = 'none'; // <--- Hide main title for history page
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; // Get history

        if (history.length === 0) {
            historyContent.innerHTML = '<p class="history-no-data">No quiz history yet. Complete a quiz to see your progress!</p>';
            return;
        }

        // Group history by category and subcategory for better organization
        const groupedHistory = {};
        history.forEach(item => {
            if (!groupedHistory[item.category]) {
                groupedHistory[item.category] = {};
            }
            if (!groupedHistory[item.category][item.subcategory]) {
                groupedHistory[item.category][item.subcategory] = [];
            }
            groupedHistory[item.category][item.subcategory].push(item);
        });

        for (const categoryName in groupedHistory) {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('history-category');
            categoryDiv.innerHTML = `<h3>${categoryName}</h3>`;
            historyContent.appendChild(categoryDiv);

            for (const subcategoryName in groupedHistory[categoryName]) {
                const subcategoryDiv = document.createElement('div');
                subcategoryDiv.classList.add('history-subcategory');
                subcategoryDiv.innerHTML = `<h4>${subcategoryName}</h4>`;
                const quizRuns = groupedHistory[categoryName][subcategoryName];

                // Sort quiz runs by date descending (most recent first)
                quizRuns.sort((a, b) => new Date(b.date) - new Date(a.date));

                quizRuns.forEach(run => {
                    subcategoryDiv.innerHTML += `<p>Date: ${run.date} | Score: ${run.score}/${run.total} (${run.percentage}%)</p>`;
                    if (run.incorrectTopics && run.incorrectTopics.length > 0) {
                        subcategoryDiv.innerHTML += `<p>Needs revision: <em>${run.incorrectTopics.join(', ')}</em></p>`;
                    }
                });
                categoryDiv.appendChild(subcategoryDiv);
            }
        }
    }

    // --- Display Revision Topics for Current Quiz (from last completed quiz) ---
    function displayRevisionTopics() {
        showPage(revisionPage); // Show the revision topics page for the *last quiz*
        revisionTopicsContent.innerHTML = ''; // Clear previous content
        mainTitle.style.display = 'none'; // <--- Hide main title for this revision page

        if (incorrectTopics.length === 0) {
            revisionTopicsContent.innerHTML = '<p>No revision topics identified for the last quiz. Great job!</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.classList.add('revision-topic-list');
        incorrectTopics.forEach(topic => {
            const li = document.createElement('li');
            li.classList.add('revision-topic-item');
            li.innerHTML = `<strong>${topic}</strong>`; // Display the topic
            ul.appendChild(li);
        });
        revisionTopicsContent.appendChild(ul);
    }

    // --- Display Global Revision History ---
    function displayGlobalRevisionHistory() {
        showPage(globalRevisionHistoryPage);
        globalRevisionContent.innerHTML = ''; // Clear previous content
        mainTitle.style.display = 'none'; // <--- Hide main title for global revision history
        const globalRevision = JSON.parse(localStorage.getItem(GLOBAL_REVISION_KEY)) || {};

        const hasTopics = Object.keys(globalRevision).length > 0 &&
                          Object.values(globalRevision).some(cat => Object.keys(cat).length > 0);

        if (!hasTopics) {
            globalRevisionContent.innerHTML = '<p class="history-no-data">No revision topics saved yet. Complete some quizzes to identify areas for review!</p>';
            return;
        }

        for (const categoryName in globalRevision) {
            if (Object.keys(globalRevision[categoryName]).length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('revision-category-block');
                categoryDiv.innerHTML = `<h3>${categoryName}</h3>`;
                globalRevisionContent.appendChild(categoryDiv);

                const ul = document.createElement('ul');
                ul.classList.add('revision-topic-list'); // Re-use list style
                // Sort topics by frequency (highest count first)
                const sortedTopics = Object.entries(globalRevision[categoryName]).sort(([, countA], [, countB]) => countB - countA);

                sortedTopics.forEach(([topic, count]) => {
                    const li = document.createElement('li');
                    li.classList.add('revision-topic-item'); // Re-use item style
                    li.innerHTML = `<strong>${topic}</strong> (Incorrect ${count} time${count > 1 ? 's' : ''})`;
                    ul.appendChild(li);
                });
                categoryDiv.appendChild(ul);
            }
        }
    }

    // --- Function to Clear History ---
    function clearAllHistory(type) {
        let confirmMessage = "";
        let storageKeyToClear = "";
        let displayFunction = null;

        if (type === 'standard') {
            confirmMessage = "Are you sure you want to clear ALL your quiz history?";
            storageKeyToClear = HISTORY_KEY;
            displayFunction = displayHistory; // Function to re-display after clearing
        } else if (type === 'global') {
            confirmMessage = "Are you sure you want to clear ALL your global revision topics?";
            storageKeyToClear = GLOBAL_REVISION_KEY;
            displayFunction = displayGlobalRevisionHistory; // Function to re-display after clearing
        } else {
            console.error("Invalid history type specified for clearing.");
            return;
        }

        if (confirm(confirmMessage)) {
            localStorage.removeItem(storageKeyToClear);
            alert("History cleared successfully!");
            if (displayFunction) {
                displayFunction(); // Refresh the display of the relevant history page
            }
        }
    }

    // --- Footer Year Update ---
    function updateFooterYear() {
        const currentYear = new Date().getFullYear();
        footerText.textContent = `© ${currentYear} CompTIA Network+ and Security+ Study Guide`;
    }

    // Call footer update on load
    updateFooterYear();
});