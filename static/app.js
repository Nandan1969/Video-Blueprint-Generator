let currentBlueprint = null;
let currentPrompt = "";

// History State
let history = JSON.parse(localStorage.getItem('blueprintHistory')) || [];

// UI Elements
const form = document.getElementById('blueprintForm');
const generateBtn = document.getElementById('generateBtn');
const btnText = generateBtn.querySelector('.btn-text');
const loadingState = generateBtn.querySelector('.loading-state');
const errorBox = document.getElementById('errorBox');
const resultSection = document.getElementById('resultSection');

// Modals & Sidebars
const promptModal = document.getElementById('promptModal');
const historySidebar = document.getElementById('historySidebar');

// Motivation Quotes
const quotes = [
    "Your story deserves to be told. Keep creating!",
    "The world is waiting for your masterpiece.",
    "Every great video starts with a simple plan.",
    "Let your creativity flow from mind to lens.",
    "Action is the foundational key to all success.",
    "Bring your vision to life, one scene at a time.",
    "The camera is an instrument that teaches people how to see without a camera."
];

// Background Floating Stickers Generator
function createFloatingStickers() {
    const container = document.createElement('div');
    container.className = 'floating-stickers-container';
    document.body.appendChild(container);

    const icons = ['🎥', '🎞️', '📸', '✏️', '📜', '💡', '🎬', '🍿', '📝', '✨'];
    
    for (let i = 0; i < 20; i++) {
        const span = document.createElement('span');
        span.className = 'floating-sticker';
        span.textContent = icons[Math.floor(Math.random() * icons.length)];
        
        span.style.left = `${Math.random() * 100}vw`;
        span.style.top = `${Math.random() * 100}vh`;
        
        const size = Math.random() * 30 + 20; // 20px to 50px
        span.style.fontSize = `${size}px`;
        
        // Increased opacity slightly (0.15 to 0.3)
        span.style.opacity = Math.random() * 0.15 + 0.15; 
        
        // Increased speed (decreased duration) from 20-40s to 12-22s
        const duration = Math.random() * 10 + 12;
        const delay = -Math.random() * 20;
        span.style.animation = `floatSticker ${duration}s ease-in-out ${delay}s infinite alternate`;
        
        container.appendChild(span);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    createFloatingStickers();
    renderHistory();
});

// Event Listeners for UI
document.getElementById('viewPromptBtn').addEventListener('click', () => {
    document.getElementById('promptText').textContent = currentPrompt;
    promptModal.classList.remove('hidden');
});
document.getElementById('closePromptBtn').addEventListener('click', () => promptModal.classList.add('hidden'));
document.getElementById('historyToggleBtn').addEventListener('click', () => historySidebar.classList.remove('hidden'));
document.getElementById('closeHistoryBtn').addEventListener('click', () => historySidebar.classList.add('hidden'));

// Main Generation Logic
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const theme = document.getElementById('theme').value;
    const stylePreset = document.getElementById('stylePreset').value;
    const platform = document.getElementById('platform').value;
    const story = document.getElementById('story').value.trim();

    // 1. Validation Logic
    if (!story) {
        showError("Story text cannot be empty.");
        return;
    }

    // Reset UI
    errorBox.classList.add('hidden');
    document.getElementById('motivationalQuote').classList.add('hidden');
    generateBtn.disabled = true;
    btnText.classList.add('hidden');
    loadingState.classList.remove('hidden');

    // Show skeletons immediately
    renderSkeleton();

    const logos = ['🎥', '📜', '📸', '🖋️', '🗓️'];
    let logoIdx = 0;
    const logoFlipper = document.getElementById('logoFlipper');
    logoFlipper.textContent = logos[logoIdx];
    const flipInterval = setInterval(() => {
        logoIdx = (logoIdx + 1) % logos.length;
        logoFlipper.textContent = logos[logoIdx];
    }, 400);

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                story, theme, style_preset: stylePreset, platform 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate blueprint. Please try again.');
        }

        currentBlueprint = data.blueprint;
        currentPrompt = data.prompt_used;

        // Save to History
        saveToHistory({
            id: Date.now(),
            date: new Date().toLocaleString(),
            theme,
            platform,
            blueprint: currentBlueprint,
            prompt: currentPrompt
        });

        // Set Motivational Quote
        const quoteEl = document.getElementById('motivationalQuote');
        quoteEl.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
        quoteEl.classList.remove('hidden');

        renderBlueprint(currentBlueprint);

    } catch (err) {
        showError(err.message);
        resultSection.classList.add('hidden');
    } finally {
        clearInterval(flipInterval);
        generateBtn.disabled = false;
        btnText.classList.remove('hidden');
        loadingState.classList.add('hidden');
    }
});

function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
}

function renderSkeleton() {
    resultSection.classList.remove('hidden');
    
    document.getElementById('bpTime').innerHTML = '<div class="skeleton skeleton-text" style="width: 40%"></div>';
    document.getElementById('bpFormat').innerHTML = '<div class="skeleton skeleton-text" style="width: 60%"></div>';
    document.getElementById('bpVisual').innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width: 80%"></div>';
    document.getElementById('bpNarration').innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width: 60%"></div>';

    const scenesContainer = document.getElementById('bpScenes');
    scenesContainer.innerHTML = '';
    
    const storyboardDiv = document.createElement('div');
    storyboardDiv.className = 'storyboard-preview';
    scenesContainer.appendChild(storyboardDiv);
    
    for (let i = 0; i < 3; i++) {
        const sbBox = document.createElement('div');
        sbBox.className = 'storyboard-box';
        sbBox.innerHTML = `
            <div class="skeleton storyboard-img-placeholder" style="border:none;"></div>
            <div class="skeleton skeleton-text" style="width:50%; margin:8px auto"></div>
        `;
        storyboardDiv.appendChild(sbBox);
    }
    
    for(let i = 0; i < 3; i++) {
        const card = document.createElement('div');
        card.className = 'scene-card';
        card.innerHTML = `
            <div class="scene-card-header">
                <div class="scene-title-wrap" style="width:100%">
                    <div class="scene-number">${i + 1}</div>
                    <div class="skeleton skeleton-title"></div>
                </div>
            </div>
            <div class="scene-card-body">
                <div class="scene-section">
                    <div class="skeleton skeleton-block"></div>
                </div>
                <div class="scene-section">
                    <div class="skeleton skeleton-block"></div>
                </div>
            </div>
        `;
        scenesContainer.appendChild(card);
    }
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBlueprint(bp) {
    document.getElementById('bpTime').textContent = bp.total_estimated_time || "N/A";
    document.getElementById('bpFormat').textContent = bp.publishing_format || "N/A";
    document.getElementById('bpVisual').textContent = bp.visual_direction || "N/A";
    document.getElementById('bpNarration').textContent = bp.narration_tone || "N/A";

    const scenesContainer = document.getElementById('bpScenes');
    scenesContainer.innerHTML = '';
    
    // Storyboard Container
    const storyboardDiv = document.createElement('div');
    storyboardDiv.className = 'storyboard-preview';
    scenesContainer.appendChild(storyboardDiv);

    bp.scene_breakdown.forEach((scene, idx) => {
        // Build Storyboard Item
        const sbBox = document.createElement('div');
        sbBox.className = 'storyboard-box';
        sbBox.innerHTML = `
            <div class="storyboard-img-placeholder"><span>🎬</span></div>
            <div style="font-size:0.8rem; font-weight:600; color:var(--text-secondary)">Scene ${idx+1}</div>
            <div style="font-size:0.9rem">${scene.title}</div>
        `;
        storyboardDiv.appendChild(sbBox);

        // Build Scene Card
        const card = document.createElement('div');
        card.className = 'scene-card';
        card.innerHTML = `
            <div class="scene-card-header">
                <div class="scene-title-wrap">
                    <div class="scene-number">${idx + 1}</div>
                    <strong class="scene-title-text">${scene.title}</strong>
                    <span class="scene-duration">${scene.duration}</span>
                </div>
                <div class="scene-actions">
                    <button class="secondary-btn edit-scene-btn" data-index="${idx}">Edit</button>
                </div>
            </div>
            <div class="scene-card-body">
                <div class="scene-section">
                    <h4>Visual</h4>
                    <p class="scene-visual-text">${scene.visual}</p>
                    <textarea class="scene-visual-input hidden">${scene.visual}</textarea>
                </div>
                <div class="scene-section">
                    <h4>Narration</h4>
                    <p class="scene-narration-text">${scene.narration}</p>
                    <textarea class="scene-narration-input hidden">${scene.narration}</textarea>
                </div>
            </div>
        `;
        scenesContainer.appendChild(card);

        // Editable Logic
        const editBtn = card.querySelector('.edit-scene-btn');
        const visualText = card.querySelector('.scene-visual-text');
        const visualInput = card.querySelector('.scene-visual-input');
        const narrText = card.querySelector('.scene-narration-text');
        const narrInput = card.querySelector('.scene-narration-input');

        editBtn.addEventListener('click', () => {
            const isEditing = editBtn.textContent === "Save";
            if (isEditing) {
                // Save logic
                scene.visual = visualInput.value;
                scene.narration = narrInput.value;
                
                visualText.textContent = scene.visual;
                narrText.textContent = scene.narration;

                visualText.classList.remove('hidden');
                visualInput.classList.add('hidden');
                narrText.classList.remove('hidden');
                narrInput.classList.add('hidden');
                
                editBtn.textContent = "Edit";
                editBtn.style.background = "";
                editBtn.style.color = "";
            } else {
                // To Edit mode
                visualText.classList.add('hidden');
                visualInput.classList.remove('hidden');
                narrText.classList.add('hidden');
                narrInput.classList.remove('hidden');

                editBtn.textContent = "Save";
                editBtn.style.background = "var(--accent)";
                editBtn.style.color = "white";
            }
        });
    });
}

// History & LocalStorage Logic
function saveToHistory(item) {
    history.unshift(item); // Add to beginning
    if (history.length > 20) history.pop(); // Keep only last 20
    localStorage.setItem('blueprintHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:20px;">No blueprints yet.</p>';
        return;
    }

    history.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-item-title">${item.theme} - ${item.platform}</div>
            <div class="history-item-date">${item.date}</div>
        `;
        div.addEventListener('click', () => {
            currentBlueprint = item.blueprint;
            currentPrompt = item.prompt;
            renderBlueprint(currentBlueprint);
            resultSection.classList.remove('hidden');
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            historySidebar.classList.add('hidden');
        });
        list.appendChild(div);
    });
}

// PDF Download
document.getElementById('saveBtn').addEventListener('click', () => {
    if (!currentBlueprint) return;
    
    (async () => {
        const response = await fetch('/api/blueprint/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentBlueprint),
        });

        if (!response.ok) {
            let detail = 'Failed to generate PDF.';
            try {
                const data = await response.json();
                detail = data.detail || detail;
            } catch (_) {}
            throw new Error(detail);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        downloadAnchor.download = 'video_blueprint.pdf';
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
    })().catch((err) => {
        showError(err.message);
    });
});
