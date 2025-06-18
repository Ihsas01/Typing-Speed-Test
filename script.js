// DOM Elements
const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const timeDisplay = document.getElementById('time');
const cpmDisplay = document.getElementById('cpm');
const restartBtn = document.getElementById('restart-btn');
const newTextBtn = document.getElementById('new-text-btn');
const historyBtn = document.getElementById('history-btn');
const difficultySelect = document.getElementById('difficulty');
const durationSelect = document.getElementById('duration');
const soundSelect = document.getElementById('sound');
const themeToggle = document.getElementById('theme-toggle');
const historyModal = document.getElementById('history-modal');
const closeModalBtn = document.querySelector('.close-btn');
const historyList = document.getElementById('history-list');
const historyDifficulty = document.getElementById('history-difficulty');
const historyTime = document.getElementById('history-time');
const bestWpmDisplay = document.getElementById('best-wpm');
const avgWpmDisplay = document.getElementById('avg-wpm');
const testsCompletedDisplay = document.getElementById('tests-completed');
const bestAccuracyDisplay = document.getElementById('best-accuracy');
const avgAccuracyDisplay = document.getElementById('avg-accuracy');
const totalCharsDisplay = document.getElementById('total-chars');
const totalWordsDisplay = document.getElementById('total-words');

// Variables
let currentSentence = '';
let timeLeft = 60;
let timer = null;
let isTestActive = false;
let startTime = null;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let testHistory = [];
let currentDifficulty = 'medium';
let wpmChart = null;

// Sound effects
const sounds = {
    keypress: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    error: new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'),
    complete: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3')
};

// Load settings from localStorage
function loadSettings() {
    const savedTheme = localStorage.getItem('theme');
    const savedSound = localStorage.getItem('sound');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }
    
    if (savedSound === 'off') {
        soundSelect.value = 'off';
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
    localStorage.setItem('sound', soundSelect.value);
}

// Play sound effect
function playSound(soundName) {
    if (soundSelect.value === 'on') {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
    }
}

// Load test history from localStorage
function loadTestHistory() {
    const savedHistory = localStorage.getItem('typingTestHistory');
    if (savedHistory) {
        testHistory = JSON.parse(savedHistory);
        updateResults();
    }
}

// Save test history to localStorage
function saveTestHistory() {
    localStorage.setItem('typingTestHistory', JSON.stringify(testHistory));
}

// Initialize the test
function initTest() {
    // Reset variables
    timeLeft = parseInt(durationSelect.value);
    isTestActive = false;
    totalKeystrokes = 0;
    correctKeystrokes = 0;
    currentDifficulty = difficultySelect.value;
    
    // Clear any existing timer
    if (timer) clearInterval(timer);
    
    // Get random sentence based on difficulty
    const difficultySentences = sentences[currentDifficulty];
    currentSentence = difficultySentences[Math.floor(Math.random() * difficultySentences.length)];
    
    // Display the sentence
    displaySentence();
    
    // Reset displays
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100%';
    timeDisplay.textContent = timeLeft;
    cpmDisplay.textContent = '0';
    
    // Clear input and enable
    textInput.value = '';
    textInput.disabled = false;
    textInput.focus();
}

// Display the sentence with spans for each character
function displaySentence() {
    textDisplay.innerHTML = currentSentence
        .split('')
        .map(char => `<span>${char}</span>`)
        .join('');
}

// Start the test
function startTest() {
    if (!isTestActive) {
        isTestActive = true;
        startTime = new Date();
        timer = setInterval(updateTimer, 1000);
    }
}

// Update the timer
function updateTimer() {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        endTest();
    }
}

// End the test
function endTest() {
    clearInterval(timer);
    isTestActive = false;
    textInput.disabled = true;
    
    // Calculate final stats
    const finalWpm = calculateWPM();
    const finalAccuracy = calculateAccuracy();
    const finalCpm = calculateCPM();
    
    // Add to test history
    const testResult = {
        wpm: finalWpm,
        accuracy: finalAccuracy,
        cpm: finalCpm,
        difficulty: currentDifficulty,
        date: new Date().toISOString(),
        characters: textInput.value.length,
        words: textInput.value.trim().split(/\s+/).length
    };
    
    testHistory.push(testResult);
    
    // Update results display
    updateResults();
    
    // Save to localStorage
    saveTestHistory();
    
    // Play completion sound
    playSound('complete');
}

// Calculate WPM
function calculateWPM() {
    const timeElapsed = (new Date() - startTime) / 60000; // in minutes
    const words = textInput.value.trim().split(/\s+/).length;
    return Math.round(words / timeElapsed);
}

// Calculate CPM
function calculateCPM() {
    const timeElapsed = (new Date() - startTime) / 60000; // in minutes
    const characters = textInput.value.length;
    return Math.round(characters / timeElapsed);
}

// Calculate accuracy
function calculateAccuracy() {
    if (totalKeystrokes === 0) return 100;
    return Math.round((correctKeystrokes / totalKeystrokes) * 100);
}

// Update the display with current character status
function updateDisplay() {
    const inputValue = textInput.value;
    const spans = textDisplay.getElementsByTagName('span');
    
    // Reset counters
    totalKeystrokes = 0;
    correctKeystrokes = 0;
    
    // Reset all spans
    Array.from(spans).forEach(span => {
        span.className = '';
    });
    
    // Update spans based on input
    for (let i = 0; i < spans.length; i++) {
        if (i < inputValue.length) {
            if (inputValue[i] === currentSentence[i]) {
                spans[i].className = 'correct';
                correctKeystrokes++;
                playSound('keypress');
            } else {
                spans[i].className = 'incorrect';
                playSound('error');
            }
            totalKeystrokes++;
        } else if (i === inputValue.length) {
            spans[i].className = 'current';
        }
    }
    
    // Update stats
    wpmDisplay.textContent = calculateWPM();
    accuracyDisplay.textContent = `${calculateAccuracy()}%`;
    cpmDisplay.textContent = calculateCPM();
}

// Update results display
function updateResults() {
    if (testHistory.length === 0) return;
    
    const bestWpm = Math.max(...testHistory.map(test => test.wpm));
    const avgWpm = Math.round(testHistory.reduce((sum, test) => sum + test.wpm, 0) / testHistory.length);
    const bestAccuracy = Math.max(...testHistory.map(test => test.accuracy));
    const avgAccuracy = Math.round(testHistory.reduce((sum, test) => sum + test.accuracy, 0) / testHistory.length);
    const totalChars = testHistory.reduce((sum, test) => sum + test.characters, 0);
    const totalWords = testHistory.reduce((sum, test) => sum + test.words, 0);
    
    bestWpmDisplay.textContent = bestWpm;
    avgWpmDisplay.textContent = avgWpm;
    testsCompletedDisplay.textContent = testHistory.length;
    bestAccuracyDisplay.textContent = `${bestAccuracy}%`;
    avgAccuracyDisplay.textContent = `${avgAccuracy}%`;
    totalCharsDisplay.textContent = totalChars;
    totalWordsDisplay.textContent = totalWords;
    
    updateChart();
}

// Update the WPM chart
function updateChart() {
    const ctx = document.getElementById('wpm-chart').getContext('2d');
    
    if (wpmChart) {
        wpmChart.destroy();
    }
    
    const labels = testHistory.map((_, index) => `Test ${index + 1}`);
    const data = testHistory.map(test => test.wpm);
    
    wpmChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'WPM',
                data: data,
                borderColor: 'rgb(79, 70, 229)',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'var(--chart-grid)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update history list
function updateHistoryList() {
    const difficulty = historyDifficulty.value;
    const time = historyTime.value;
    
    let filteredHistory = testHistory;
    
    if (difficulty !== 'all') {
        filteredHistory = filteredHistory.filter(test => test.difficulty === difficulty);
    }
    
    if (time !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        filteredHistory = filteredHistory.filter(test => {
            const testDate = new Date(test.date);
            switch (time) {
                case 'today':
                    return testDate >= today;
                case 'week':
                    return testDate >= weekAgo;
                case 'month':
                    return testDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    historyList.innerHTML = filteredHistory
        .map(test => `
            <div class="history-item">
                <div class="date">${new Date(test.date).toLocaleString()}</div>
                <div class="wpm">${test.wpm} WPM</div>
                <div class="accuracy">${test.accuracy}%</div>
                <div class="difficulty">${test.difficulty}</div>
            </div>
        `)
        .join('');
}

// Event Listeners
textInput.addEventListener('input', () => {
    if (!isTestActive) {
        startTest();
    }
    updateDisplay();
});

restartBtn.addEventListener('click', initTest);

newTextBtn.addEventListener('click', () => {
    const difficultySentences = sentences[currentDifficulty];
    currentSentence = difficultySentences[Math.floor(Math.random() * difficultySentences.length)];
    displaySentence();
    textInput.value = '';
    textInput.focus();
});

difficultySelect.addEventListener('change', initTest);
durationSelect.addEventListener('change', initTest);
soundSelect.addEventListener('change', saveSettings);

themeToggle.addEventListener('change', () => {
    document.documentElement.setAttribute('data-theme', themeToggle.checked ? 'dark' : 'light');
    saveSettings();
});

historyBtn.addEventListener('click', () => {
    historyModal.classList.add('active');
    updateHistoryList();
});

closeModalBtn.addEventListener('click', () => {
    historyModal.classList.remove('active');
});

historyDifficulty.addEventListener('change', updateHistoryList);
historyTime.addEventListener('change', updateHistoryList);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        initTest();
    } else if (e.key === ' ' && !isTestActive) {
        e.preventDefault();
        newTextBtn.click();
    } else if (e.key === 'Tab' && !isTestActive) {
        e.preventDefault();
        textInput.focus();
    }
});

// Load settings and initialize the test when the page loads
loadSettings();
loadTestHistory();
initTest(); 