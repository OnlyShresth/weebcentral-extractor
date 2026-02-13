// Application State
const state = {
    subscriptions: [],
    isExtracting: false
};

// DOM Elements
const elements = {
    form: document.getElementById('extractForm'),
    urlInput: document.getElementById('profileUrl'),
    extractBtn: document.getElementById('extractBtn'),
    progressContainer: document.getElementById('progressContainer'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    resultsSection: document.getElementById('resultsSection'),
    totalCount: document.getElementById('totalCount'),
    subscriptionsList: document.getElementById('subscriptionsList')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('WeebCentral Extractor initialized');
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    elements.form.addEventListener('submit', handleExtract);
}

// Handle Extract Form Submission
async function handleExtract(e) {
    e.preventDefault();

    if (state.isExtracting) return;

    const profileUrl = elements.urlInput.value.trim();

    if (!profileUrl) {
        showNotification('Please enter a valid WeebCentral profile URL', 'error');
        return;
    }

    if (!profileUrl.includes('weebcentral.com/users/')) {
        showNotification('Invalid WeebCentral profile URL format', 'error');
        return;
    }

    try {
        state.isExtracting = true;
        updateUIState('extracting');

        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profileUrl })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Extraction failed');
        }

        if (data.warning) {
            showNotification(data.warning, 'warning');
        } else {
            handleExtractionSuccess(data);
        }

    } catch (error) {
        console.error('Extraction error:', error);
        showNotification(error.message, 'error');
        updateUIState('error');
    } finally {
        state.isExtracting = false;
    }
}

// Handle Successful Extraction
function handleExtractionSuccess(data) {
    console.log('Extraction success:', data);
    state.subscriptions = data.subscriptions;

    // Session ID is still returned but not used for exports anymore
    if (data.sessionId) {
        console.log('Session ID:', data.sessionId);
    }

    updateUIState('success');
    displayResults();
    showNotification(`Successfully extracted ${data.count} subscriptions`, 'success');
}

// Display Results
function displayResults() {
    elements.totalCount.textContent = state.subscriptions.length;

    elements.subscriptionsList.innerHTML = '';

    state.subscriptions.forEach((sub) => {
        const card = createSubscriptionCard(sub);
        elements.subscriptionsList.appendChild(card);
    });

    elements.resultsSection.classList.remove('hidden');

    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// Create Subscription Card Element
function createSubscriptionCard(subscription) {
    const card = document.createElement('div');
    card.className = 'subscription-card';

    // Create image element
    if (subscription.imageUrl) {
        const img = document.createElement('img');
        img.className = 'subscription-image';
        img.src = subscription.imageUrl;
        img.alt = subscription.title;
        img.loading = 'lazy';

        // Handle image load errors
        img.onerror = () => {
            img.style.display = 'none';
        };

        card.appendChild(img);
    }

    // Create info section
    const info = document.createElement('div');
    info.className = 'subscription-info';

    const title = document.createElement('div');
    title.className = 'subscription-title';
    title.textContent = subscription.title;

    info.appendChild(title);
    card.appendChild(info);

    // Add click handler if link exists
    if (subscription.link) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.open(subscription.link, '_blank');
        });
    }

    return card;
}

// Update UI State
function updateUIState(state) {
    switch (state) {
        case 'extracting':
            elements.extractBtn.disabled = true;
            elements.extractBtn.textContent = 'Extracting...';
            elements.progressContainer.classList.remove('hidden');
            animateProgress();
            break;

        case 'success':
            elements.extractBtn.disabled = false;
            elements.extractBtn.textContent = 'Extract';
            elements.progressContainer.classList.add('hidden');
            elements.progressFill.style.width = '100%';
            break;

        case 'error':
            elements.extractBtn.disabled = false;
            elements.extractBtn.textContent = 'Extract';
            elements.progressContainer.classList.add('hidden');
            break;

        default:
            elements.extractBtn.disabled = false;
    }
}

// Animate Progress Bar
function animateProgress() {
    const steps = [
        { percent: 20, text: 'Connecting to WeebCentral...' },
        { percent: 40, text: 'Loading profile...' },
        { percent: 60, text: 'Extracting subscriptions...' },
        { percent: 80, text: 'Finalizing...' },
        { percent: 95, text: 'Almost there...' }
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep >= steps.length) {
            clearInterval(interval);
            return;
        }

        const step = steps[currentStep];
        elements.progressFill.style.width = `${step.percent}%`;
        elements.progressText.textContent = step.text;

        currentStep++;
    }, 800);
}

// Show Notification Toast
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    const bgColor = type === 'success' ? '#ffffff' :
        type === 'error' ? '#ff4444' :
            type === 'warning' ? '#ffaa00' : '#ffffff';

    const textColor = type === 'success' || type === 'info' ? '#0a0a0a' : '#ffffff';

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        padding: '1rem 1.5rem',
        background: bgColor,
        color: textColor,
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: '500',
        zIndex: '1000',
        transform: 'translateY(100px)',
        opacity: '0',
        transition: 'all 0.3s ease',
        maxWidth: '400px'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
