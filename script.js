document.addEventListener('DOMContentLoaded', async () => {
    // Config
    const DATA_SOURCE = 'questions.json';

    // 1. State Management
    let quizData = [];
    let originalData = [];
    let isShuffleActive = false;
    let score = 0;
    let selectedOption = null;
    let isSubmitted = false;

    let currentIndex = 0;
    const flashcard = document.getElementById('flashcard');
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');
    const counter = document.getElementById('counter');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const mainNav = document.getElementById('mainNav');
    const startQuizBtn = document.getElementById('startQuizBtn');

    // Modal Elements - Generic
    const modalOverlay = document.getElementById('modalOverlay');
    const adminModal = document.getElementById('adminModal');
    const quizModal = document.getElementById('quizModal');
    const flashcardModal = document.getElementById('flashcardModal');
    
    // Modal Elements - Quiz Specific
    const quizActiveArea = document.getElementById('quizActiveArea');
    const modalCounter = document.getElementById('modalCounter');
    const endSessionBtn = document.getElementById('endSessionBtn');
    const submitBtn = document.getElementById('submitBtn');
    const modalFlipBtn = document.getElementById('modalFlipBtn');
    const flipBtn = document.getElementById('flipBtn');

    const openAdminBtn = document.getElementById('openAdminBtn');
    const openFlashcardBtn = document.getElementById('openFlashcardBtn');
    const closeButtons = document.querySelectorAll('.close-modal');

    // 2. Modal Logic
    const openModal = (modalId) => {
        modalOverlay.classList.add('active');
        document.querySelectorAll('.modal-container').forEach(m => m.style.display = 'none');
        document.getElementById(modalId).style.display = 'flex';
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        document.body.classList.remove('modal-open');
    };

    // 2. Core Functions
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const updateDisplay = () => {
        // Remove flipped state before updating content
        flashcard.classList.remove('flipped');

        // Reset quiz state
        selectedOption = null;
        isSubmitted = false;
        modalFlipBtn.classList.add('hidden');
        submitBtn.classList.add('hidden');
        submitBtn.disabled = true;
        
        // Wait for half the transition time to change text for a smoother feel
        setTimeout(() => {
            // Reset scroll position to top when changing cards
            cardFront.scrollTop = 0;
            cardBack.scrollTop = 0;

            const currentCard = quizData[currentIndex];
            if (!currentCard) return;

            // Find the full text of the correct answer and strip the identifying prefix
            let answerText = currentCard.answer || "N/A";
            if (currentCard.options && Array.isArray(currentCard.options)) {
                const answerIndex = currentCard.answer.trim().toUpperCase().charCodeAt(0) - 65;
                if (currentCard.options[answerIndex]) {
                    answerText = currentCard.options[answerIndex].replace(/^[A-Z][\.\s]\s*/, '').trim();
                }
            }

            // Construct Question and Options
            let frontContent = `<div class="q-container"><p class="q-text">${currentCard.question || "Question missing"}</p>`;
            
            // Add attachment if exists
            if (currentCard.attachment) {
                frontContent += `<div class="q-attachment" style="margin-bottom: 1.5rem;"><img src="${'attachments/' + currentCard.attachment}" alt="Question Diagram" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0;"></div>`;
            }

            if (currentCard.options && Array.isArray(currentCard.options)) {
                const processedOptions = currentCard.options.map((opt, idx) => ({
                    text: opt.replace(/^[A-Z][\.\s]\s*/, '').trim(),
                    letter: String.fromCharCode(65 + idx)
                }));

                shuffleArray(processedOptions);

                frontContent += `<ul class="options-list">`;
                processedOptions.forEach((optObj) => {
                    frontContent += `<li data-letter="${optObj.letter}">${optObj.text}</li>`;
                });
                frontContent += `</ul>`;
            }
            frontContent += `</div>`;
            
            // Build Answer content for Quiz Modal (hidden initially)
            let quizAnswerContent = `
                <div id="quizExplanation" class="hidden quiz-explanation-container">
                    <p class="quiz-answer-header">Answer: ${answerText}</p>
                    <div class="a-explanation" style="color: var(--text-main);">${currentCard.explanation || ""}</div>
                </div>
            `;

            cardFront.innerHTML = frontContent;
            
            if (isShuffleActive) {
                quizActiveArea.innerHTML = frontContent + quizAnswerContent;
                // Re-setup option listeners for modal
                setupQuizOptionListeners();
                // Reset Quiz Modal scroll
                document.getElementById('quizModalBody').scrollTop = 0;
            }

            // Construct Answer and Explanation
            let backContent = `<div class="a-container">`;
            backContent += `<p class="a-label"><strong>Answer:</strong> ${answerText}</p>`;
            if (currentCard.explanation) {
                backContent += `<hr><p class="a-explanation"><br>${currentCard.explanation}</p>`;
            }
            backContent += `</div>`;
            cardBack.innerHTML = backContent;

            // Add click listeners for main page options
            const mainOptions = cardFront.querySelectorAll('li');
            mainOptions.forEach(li => {
                li.addEventListener('click', (e) => {
                    if (isSubmitted) return;
                    e.stopPropagation(); // Prevent the card from flipping when selecting an option
                    mainOptions.forEach(item => item.classList.remove('selected'));
                    li.classList.add('selected');
                    selectedOption = li;

                    // Show answer immediately on main page
                    const currentCard = quizData[currentIndex];
                    mainOptions.forEach(optLi => {
                        const isCorrect = optLi.dataset.letter === currentCard.answer.trim().toUpperCase();
                        if (isCorrect) optLi.classList.add('correct');
                        else if (optLi === li) optLi.classList.add('incorrect');
                        optLi.classList.add('disabled');
                    });
                    isSubmitted = true;
                });
            });

            counter.textContent = `Card ${currentIndex + 1} of ${quizData.length}`;
            if (isShuffleActive) {
                modalCounter.textContent = `Card ${currentIndex + 1} of ${quizData.length} | Score: ${score}`;
            } else {
                modalCounter.textContent = `Card ${currentIndex + 1} of ${quizData.length}`;
            }
        }, 150);
    };

    const setupQuizOptionListeners = () => {
        const modalOptions = quizActiveArea.querySelectorAll('.options-list li');
        modalOptions.forEach(li => {
            li.addEventListener('click', () => {
                if (isSubmitted) return;
                modalOptions.forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');
                selectedOption = li;
                checkAnswer(); 
            });
        });
    };

    const flipCard = () => {
        if (isShuffleActive) {
            const explanation = document.getElementById('quizExplanation');
            if (explanation) {
                explanation.classList.toggle('hidden');
                modalFlipBtn.textContent = explanation.classList.contains('hidden') ? 'View Explanation' : 'Hide Explanation';
            }
        } else {
            flashcard.classList.toggle('flipped');
        }
    };

    const showResults = () => {
        isSubmitted = true; // Prevent further interaction
        const percentage = Math.round((score / quizData.length) * 100);
        
        let scoreColor = '#dc2626'; // Default red for < 75%
        if (percentage >= 75 && percentage <= 80) {
            scoreColor = '#ca8a04'; // Yellow for 75-80%
        } else if (percentage > 80) {
            scoreColor = '#16a34a'; // Green for > 80%
        }

        quizActiveArea.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <h2 class="quiz-result-title">Quiz Completed!</h2>
                <p class="quiz-result-label">Your Final Score:</p>
                <div class="quiz-result-score" style="color: ${scoreColor}">${score} / ${quizData.length}</div>
                <p class="quiz-result-percentage" style="color: ${scoreColor}">${percentage}% Correct</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="restartQuizBtn" class="btn primary">Restart Quiz</button>
                    <button id="exitQuizBtn" class="btn secondary">Exit Focus Mode</button>
                </div>
            </div>
        `;
        
        submitBtn.classList.add('hidden');
        modalFlipBtn.classList.add('hidden');

        document.getElementById('restartQuizBtn').onclick = () => toggleShuffle(true, quizData.length);
        document.getElementById('exitQuizBtn').onclick = () => toggleShuffle(false);
    };

    const checkAnswer = () => {
        if (!selectedOption || isSubmitted) return;
        
        isSubmitted = true;
        const currentCard = quizData[currentIndex];
        const modalOptions = quizActiveArea.querySelectorAll('.options-list li');
        
        modalOptions.forEach(li => {
            li.classList.add('disabled');
            
            // Logical check: Does this option match the answer?
            const isCorrect = li.dataset.letter === currentCard.answer.trim().toUpperCase();

            if (isCorrect) {
                li.classList.add('correct');
                if (li === selectedOption) {
                    score++;
                    modalCounter.textContent = `Card ${currentIndex + 1} of ${quizData.length} | Score: ${score}`;
                }
            } else if (li === selectedOption) {
                li.classList.add('incorrect');
            }
        });

        // Reveal the back of the card after a short delay
        if (currentIndex + 1 >= quizData.length) {
            submitBtn.textContent = 'View Results';
            submitBtn.onclick = showResults;
        } else {
            submitBtn.textContent = 'Next Question';
            submitBtn.onclick = nextCard;
        }
        
        submitBtn.classList.remove('hidden');
        submitBtn.disabled = false;
        
        // Auto-show explanation in the flat list
        const explanation = document.getElementById('quizExplanation');
        if (explanation) {
            modalFlipBtn.textContent = 'View Explanation';
            modalFlipBtn.classList.remove('hidden');
        }
    };

    const nextCard = () => {
        currentIndex = (currentIndex + 1) % quizData.length;
        updateDisplay();
    };

    const prevCard = () => {
        currentIndex = (currentIndex - 1 + quizData.length) % quizData.length;
        updateDisplay();
    };

    // 3. Event Listeners
    document.getElementById('cardContainer').addEventListener('click', flipCard);
    nextBtn.addEventListener('click', nextCard);
    prevBtn.addEventListener('click', prevCard);
    flipBtn.addEventListener('click', flipCard);
    
    // Modal Listeners
    endSessionBtn.addEventListener('click', () => toggleShuffle(false));
    modalFlipBtn.addEventListener('click', flipCard);

    // Quiz Session Logic
    startQuizBtn.addEventListener('click', () => {
        if (originalData.length === 0) return;
        const countInput = document.getElementById('quizItemCount');
        countInput.max = originalData.length;
        countInput.value = originalData.length; // Default to all items
        document.getElementById('itemCountError').style.display = 'none'; // Clear previous errors
        openModal('shuffleModal');
    });

    document.getElementById('confirmShuffle').addEventListener('click', () => {
        const countInput = document.getElementById('quizItemCount');
        const countError = document.getElementById('itemCountError');
        const count = parseInt(countInput.value);
        
        if (isNaN(count) || count < 1 || count > originalData.length) {
            countError.textContent = `Please enter a valid number (1 to ${originalData.length})`;
            countError.style.display = 'block';
            countInput.style.borderColor = '#dc2626';
            return;
        }
        toggleShuffle(true, count);
    });

    document.getElementById('cancelShuffle').addEventListener('click', closeModal);

    const toggleShuffle = (active, count) => {
        isShuffleActive = active;
        
        if (active) {
            score = 0;
            mainNav.style.display = 'none';
            let tempArray = [...originalData];
            shuffleArray(tempArray);
            quizData = tempArray.slice(0, count);
            openModal('quizModal');
        } else {
            mainNav.style.display = 'flex';
            quizData = [...originalData];
            closeModal();
        }
        currentIndex = 0;
        updateDisplay();
    };

    // Flashcard Modal Logic
    openFlashcardBtn.addEventListener('click', () => {
        openModal('flashcardModal');
    });

    // Admin Modal Logic
    openAdminBtn.addEventListener('click', () => openModal('adminModal'));
    closeButtons.forEach(btn => btn.addEventListener('click', closeModal));

    const optionsContainer = document.getElementById('optionsContainer');
    document.getElementById('addOptBtn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'opt-input';
        input.placeholder = `Next Option`;
        optionsContainer.appendChild(input);
    });

    document.getElementById('generateBtn').addEventListener('click', () => {
        const qVal = document.getElementById('qInput').value.trim();
        const aVal = document.getElementById('aInput').value.trim();
        if (!qVal || !aVal) {
            alert("Question and Answer are required.");
            return;
        }

        const options = Array.from(document.querySelectorAll('.opt-input'))
                             .map(i => i.value)
                             .filter(v => v.trim() !== "");
                             
        const newEntry = {
            question: qVal,
            options: options,
            answer: aVal,
            explanation: document.getElementById('eInput').value.replace(/\n/g, '<br>')
        };

        // Show the snippet as before
        document.getElementById('jsonResult').textContent = JSON.stringify(newEntry, null, 4) + ",";
        document.getElementById('outputArea').style.display = 'block';

        // Prepare the Download Full File button
        const downloadBtn = document.getElementById('downloadFullBtn');
        downloadBtn.style.display = 'inline-block';
        downloadBtn.onclick = () => {
            const updatedData = [...originalData, newEntry];
            const blob = new Blob([JSON.stringify(updatedData, null, 4)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'questions.json';
            a.click();
            URL.revokeObjectURL(url);
        };
    });

    // 4. Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case ' ':
                e.preventDefault(); // Prevent scrolling
                if (isShuffleActive) {
                    if (isSubmitted) flipCard();
                } else {
                    flipCard();
                }
                break;
            case 'ArrowRight':
                if (isShuffleActive) {
                    if (isSubmitted) {
                        if (currentIndex + 1 >= quizData.length) {
                            if (submitBtn.textContent === 'View Results') showResults();
                        } else nextCard();
                    }
                } else {
                    nextCard();
                }
                break;
            case 'ArrowLeft':
                prevCard();
                break;
        }
    });

    // Load data and Initialize
    try {
        const response = await fetch(DATA_SOURCE);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        quizData = await response.json();
        originalData = [...quizData];
        
        if (quizData && quizData.length > 0) {
            updateDisplay();
        } else {
            throw new Error("The questions.json file is empty or invalid.");
        }
    } catch (error) {
        console.error('Failed to load questions:', error);
        counter.textContent = "Error: Use a local server to view cards (CORS restriction).";
        cardFront.innerHTML = "<p style='color:red;'>Could not load questions.json.<br><br>Please ensure you are using a web server (like Live Server) and that the file exists in this folder.</p>";
    }
});
