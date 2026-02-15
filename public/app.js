// Application State
const state = {
    subscriptions: [],
    isExtracting: false,
    progressTimeouts: []
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

    // Setup export button listeners
    document.querySelectorAll('.btn-export').forEach(btn => {
        btn.addEventListener('click', handleDownload);
    });
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

    const profileRegex = /^https?:\/\/(www\.)?weebcentral\.com\/users\/[A-Za-z0-9]+\/profiles\/?$/;
    if (!profileRegex.test(profileUrl)) {
        showNotification('Invalid URL. Expected format: https://weebcentral.com/users/{id}/profiles', 'error');
        return;
    }

    try {
        state.isExtracting = true;
        updateUIState('extracting');

        // Start Job
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

        const jobId = data.jobId;
        console.log(`Job queued: ${jobId}`);

        // Poll for completion
        const poll = setInterval(async () => {
            try {
                const jobRes = await fetch(`/api/job/${jobId}`);
                if (!jobRes.ok) return; // Keep waiting on 404/error occasionally

                const jobData = await jobRes.json();

                if (jobData.state === 'completed') {
                    clearInterval(poll);
                    handleExtractionSuccess(jobData);
                } else if (jobData.state === 'failed') {
                    clearInterval(poll);
                    throw new Error(jobData.error || 'Job failed');
                } else {
                    // Still running/delayed/active
                    console.log(`Job status: ${jobData.state}`);
                }
            } catch (err) {
                console.error('Polling error:', err);
                // Don't restart polling loop on transient error
                clearInterval(poll);
                showNotification('Error checking job status', 'error');
                updateUIState('error');
                state.isExtracting = false;
            }
        }, 1000);

    } catch (error) {
        console.error('Extraction error:', error);
        showNotification(error.message, 'error');
        updateUIState('error');
        state.isExtracting = false;
    }
    // Note: 'finally' block removed because we need to stay in extracting state during polling
}

// Handle Successful Extraction
function handleExtractionSuccess(data) {
    console.log('Extraction success:', data);

    // Stop extraction state
    state.isExtracting = false;

    // Use the returned session ID
    if (data.sessionId) {
        state.subscriptions = data.subscriptions || []; // subscriptions strictly only if session created?
        // Wait, the job completion returns { state, sessionId, count }
        // We might need to fetch the session to get subscriptions array if it wasn't returned?
        // The server code returning subscription count but not array in the simplified view?
        // Let's re-verify backend
        // Backend: returns { state, sessionId, count } (NO subscriptions array in result to save bandwidth?)
        // Let's just fetch the session details to get the full list

        state.sessionId = data.sessionId;
        fetchSessionDetails(data.sessionId);
    } else {
        updateUIState('error');
        showNotification('No session ID returned', 'error');
    }
}

async function fetchSessionDetails(sessionId) {
    try {
        const res = await fetch(`/api/session/${sessionId}`);
        const sessionData = await res.json();

        if (sessionData.subscriptions) {
            state.subscriptions = sessionData.subscriptions;
            updateUIState('success');
            displayResults();
            showNotification(`Successfully extracted ${state.subscriptions.length} subscriptions`, 'success');
        }
    } catch (err) {
        console.error('Error fetching session:', err);
        showNotification('Failed to load results', 'error');
        updateUIState('error');
    }
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

    // Reset Export Flow
    document.getElementById('step1Group').classList.remove('hidden');
    document.getElementById('step2Group').classList.add('hidden');

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

// Handle Download Button Click
async function handleDownload(e) {
    const fileFormat = e.currentTarget.dataset.file;

    if (!state.subscriptions || state.subscriptions.length === 0) {
        showNotification('No subscriptions to export.', 'error');
        return;
    }

    // Step 1: Verification (Enrichment)
    if (fileFormat === 'enrichment') {
        const status = await checkEnrichmentStatus('mangaupdates');
        if (status === 'complete') {
            // Already complete, just show buttons
            document.getElementById('step1Group').classList.add('hidden');
            document.getElementById('step2Group').classList.remove('hidden');
            showNotification('Verification already complete!', 'success');
        } else {
            startEnrichment('mangaupdates', null);
        }
        return;
    }

    // Step 2: Downloads (Direct)
    triggerDownload(fileFormat);
}

// Helper to check enrichment status
async function checkEnrichmentStatus(target) {
    try {
        // We need the sessionId. In the new flow, we might need to store it better.
        // The server returns it in /api/extract. 
        // We stored it in state.sessionId in handleExtractionSuccess (if we added that line back).
        // Let's make sure handleExtractionSuccess stores it.
        if (!state.sessionId) return 'idle';

        const res = await fetch(`/api/session/${state.sessionId}`);
        const data = await res.json();
        return data.enrichment && data.enrichment[target] ? data.enrichment[target].status : 'idle';
    } catch (err) {
        console.error('Error checking status:', err);
        return 'error';
    }
}

// Trigger Actual Download
function triggerDownload(format) {
    if (!state.sessionId) {
        showNotification('Session expired. Please extract again.', 'error');
        return;
    }
    const downloadUrl = `/api/download/${state.sessionId}/${format}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Download started`, 'success');
}

// Start Enrichment Process
async function startEnrichment(target, finalFormat) {
    const modal = document.getElementById('enrichModal');
    const fill = document.getElementById('enrichmentFill');
    const count = document.getElementById('enrichmentCount');
    const eta = document.getElementById('enrichmentEta');

    // Reset Modal UI
    fill.style.width = '0%';
    count.textContent = 'Starting...';
    eta.textContent = 'Calculating...';
    modal.classList.remove('hidden');

    try {
        if (!state.sessionId) throw new Error("No active session");

        // Start process
        await fetch('/api/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: state.sessionId, target })
        });

        // Poll progress
        const poll = setInterval(async () => {
            try {
                const res = await fetch(`/api/session/${state.sessionId}`);
                const data = await res.json();

                if (!data.enrichment || !data.enrichment[target]) {
                    return;
                }

                const status = data.enrichment[target];

                if (status.status === 'complete') {
                    clearInterval(poll);
                    modal.classList.add('hidden');
                    checkReviewNeeded();
                }
                else if (status.status === 'error') {
                    clearInterval(poll);
                    modal.classList.add('hidden');
                    showNotification('Verification failed. Please try again.', 'error');
                }
                else {
                    const percent = (status.current / status.total) * 100;
                    fill.style.width = `${percent}%`;
                    count.textContent = `Processing ${status.current}/${status.total}`;
                    eta.textContent = 'Please wait...';
                }
            } catch (err) {
                console.error('Enrichment poll error:', err);
                clearInterval(poll);
                modal.classList.add('hidden');
                showNotification('Lost connection to server.', 'error');
            }
        }, 1000);

    } catch (err) {
        console.error('Enrichment error:', err);
        modal.classList.add('hidden');
        showNotification('Failed to start enrichment', 'error');
    }
}

// Update UI State
function updateUIState(uiState) {
    switch (uiState) {
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
        { percent: 10, text: 'Connecting to WeebCentral...', delay: 500 },
        { percent: 30, text: 'Loading profile...', delay: 2000 },
        { percent: 50, text: 'Extracting subscriptions...', delay: 4000 },
        { percent: 60, text: 'Still extracting (this may take a while)...', delay: 8000 },
        { percent: 70, text: 'Clicking "View More" buttons...', delay: 15000 },
        { percent: 80, text: 'Processing data...', delay: 25000 },
        { percent: 90, text: 'Finalizing...', delay: 35000 }
    ];

    let timeouts = [];

    // Clear any existing progress animation if restarts happen
    if (state.progressTimeouts) {
        state.progressTimeouts.forEach(clearTimeout);
    }
    state.progressTimeouts = timeouts;

    steps.forEach(step => {
        const t = setTimeout(() => {
            if (!state.isExtracting) return;
            elements.progressFill.style.width = `${step.percent}%`;
            elements.progressText.textContent = step.text;
        }, step.delay);
        timeouts.push(t);
    });
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

// Check if review is needed
async function checkReviewNeeded() {
    try {
        const res = await fetch(`/api/session/${state.sessionId}`);
        const data = await res.json();
        const subs = data.subscriptions;

        // Filter: Has a match (mu_id) but is Fuzzy and score < 0.9
        const lowConfidence = subs.map((sub, index) => ({ sub, index })).filter(item => {
            return item.sub.mu_id && item.sub.mu_match_type !== 'exact' && item.sub.mu_score < 0.9;
        });

        if (lowConfidence.length > 0) {
            showReviewModal(lowConfidence);
        } else {
            finalizeEnrichment();
        }

    } catch (err) {
        console.error("Error checking review:", err);
        finalizeEnrichment(); // Fail safe
    }
}

// Show Review Modal
function showReviewModal(items) {
    const modal = document.getElementById('reviewModal');
    const list = document.getElementById('reviewList');
    list.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'review-item';

        const scoreClass = item.sub.mu_score > 0.8 ? 'score-high' :
            (item.sub.mu_score > 0.6 ? 'score-med' : 'score-low');
        const scorePercent = Math.round(item.sub.mu_score * 100);

        div.innerHTML = `
            <input type="checkbox" class="review-checkbox" data-index="${item.index}" checked>
            
            <div class="title-cell" title="${item.sub.title}">
                ${item.sub.title}
            </div>

            <div class="arrow-cell">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </div>

            <div class="match-cell">
                <a href="${item.sub.mu_url}" target="_blank" class="match-title" title="${item.sub.mu_title}">
                    ${item.sub.mu_title}
                </a>
                <span class="match-meta">${item.sub.mu_year || '?'} • ${item.sub.mu_type || 'Manga'}</span>
            </div>

            <div class="score-cell">
                <span class="match-score ${scoreClass}">${scorePercent}%</span>
            </div>
        `;
        list.appendChild(div);
    });

    modal.classList.remove('hidden');

    // Bind Confirm Button
    const confirmBtn = document.getElementById('confirmReviewBtn');
    confirmBtn.onclick = async () => {
        // Collect unchecked items (msg: "add only those selected")
        // So unchecked = rejected
        const checkboxes = list.querySelectorAll('.review-checkbox');
        const rejectedIndices = [];

        checkboxes.forEach(cb => {
            if (!cb.checked) {
                rejectedIndices.push(parseInt(cb.dataset.index));
            }
        });

        // Send update
        try {
            confirmBtn.textContent = 'Updating...';
            confirmBtn.disabled = true;

            await fetch('/api/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: state.sessionId,
                    rejectedIndices
                })
            });

            modal.classList.add('hidden');
            finalizeEnrichment();

        } catch (err) {
            console.error(err);
            showNotification('Error updating selections', 'error');
        } finally {
            confirmBtn.textContent = 'Confirm & Continue';
            confirmBtn.disabled = false;
        }
    };
}

// Finalize
function finalizeEnrichment() {
    // Switch to Export Step
    document.getElementById('step1Group').classList.add('hidden');
    document.getElementById('step2Group').classList.remove('hidden');
    showNotification('Verification complete! You can now download exports.', 'success');
}
