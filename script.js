let poemHistory = JSON.parse(localStorage.getItem('poemHistory')) || [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('generateBtn').addEventListener('click', generatePoem);
    document.getElementById('surpriseBtn').addEventListener('click', fillRandomPrompt);
    document.getElementById('downloadBtn').addEventListener('click', downloadPoem);
    document.getElementById('copyBtn').addEventListener('click', copyPoem);
    document.getElementById('themeSelect').addEventListener('change', changeFontTheme);
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('toggleHistory').addEventListener('click', toggleHistory);
});

async function generatePoem() {
    const topic = document.getElementById('topic').value.trim();
    const keywords = document.getElementById('keywords').value.trim();
    const poemResult = document.getElementById('poemResult');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');

    poemResult.textContent = '';
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    if (!topic || !keywords) {
        showError('Please fill in both the theme and keywords fields');
        return;
    }

    if (topic.length > 50) {
        showError('Theme must be under 50 characters');
        return;
    }

    if (keywords.length > 200) {
        showError('Keywords must be under 200 characters');
        return;
    }

    try {
        loading.style.display = 'block';
        document.querySelector('.progress-bar').style.width = '100%';

        const API_KEY = 'AIzaSyBjuNHmiK0qloXuvenJHqN_0SCL_bSHj0Y';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Write a creative 4-stanza poem about "${topic}" incorporating these elements: ${keywords}.
                        Use vivid imagery, metaphors, and maintain a consistent rhyme scheme.
                        The poem should evoke emotion and paint a clear picture.`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error('Invalid response format from Gemini API');
        }

        poemResult.textContent = data.candidates[0].content.parts[0].text;
        
        poemHistory.unshift({
            poem: poemResult.textContent,
            date: new Date().toLocaleString()
        });
        localStorage.setItem('poemHistory', JSON.stringify(poemHistory));

    } catch (error) {
        console.error('API Error:', error);
        showError(`Failed to generate poem: ${error.message}`);

        const mockPoem = generateMockPoem(topic, keywords);
        poemResult.textContent = mockPoem;
        showError('API connection failed. Showing mock response.');
    } finally {
        document.querySelector('.progress-bar').style.width = '0%';
        loading.style.display = 'none';
    }
}

function generateMockPoem(topic, keywords) {
    const lines = [
        `On the theme of ${topic}, so bright and clear,`,
        `With elements of ${keywords.replace(/,/g, ' and')} drawing near.`,
        ``,
        `The whispers of wind through the trees,`,
        `Carry secrets on the gentle breeze.`,
        `Though the API could not connect,`,
        `These words I offer with respect.`,
        ``,
        `A temporary verse I've made,`,
        `To fill the space while systems fade.`,
        `Return again another day,`,
        `For richer poems on display.`
    ];
    return lines.join('\n');
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'flex';
}

function fillRandomPrompt() {
    const topics = ["Lost cities", "First love", "Midnight skies", "Ocean waves", "Whispers of winter"];
    const keywordsList = [
        "fog, ruins, mystery",
        "heartbeat, eyes, stars",
        "moon, silence, dreams",
        "salt, ship, freedom",
        "snow, silence, hope"
    ];

    const randomIndex = Math.floor(Math.random() * topics.length);
    document.getElementById('topic').value = topics[randomIndex];
    document.getElementById('keywords').value = keywordsList[randomIndex];
}

function downloadPoem() {
    const poem = document.getElementById('poemResult').textContent;
    if (!poem) {
        showError('No poem to download!');
        return;
    }

    const blob = new Blob([poem], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'poem.txt';
    link.click();
}

function copyPoem() {
    const poem = document.getElementById('poemResult').textContent;
    if (!poem) {
        showError('No poem to copy!');
        return;
    }

    navigator.clipboard.writeText(poem)
        .then(() => alert('Poem copied to clipboard!'))
        .catch(err => showError('Failed to copy poem: ' + err));
}

function changeFontTheme() {
    const poem = document.getElementById('poemResult');
    poem.className = 'poem-result';
    const selected = document.getElementById('themeSelect').value;
    poem.classList.add(`poem-${selected}`);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    panel.classList.toggle('visible');
    
    if (panel.classList.contains('visible')) {
        showHistory();
    }
}

function showHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = poemHistory.slice(0, 5).map((entry, index) => `
        <div class="history-item">
            <small>${entry.date}</small>
            <pre>${entry.poem.slice(0, 80)}...</pre>
            <button onclick="loadHistory(${index})">Load</button>
        </div>
    `).join('');
}

function loadHistory(index) {
    const poem = poemHistory[index].poem;
    document.getElementById('poemResult').textContent = poem;
    window.scrollTo(0, document.body.scrollHeight);
}