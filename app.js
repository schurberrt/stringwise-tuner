// Define Tuning Presets with Scientific Pitch Notation Frequencies
const TUNINGS = {
    standard: [
        { note: 'E', octave: 2, freq: 82.41 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'B', octave: 3, freq: 246.94 },
        { note: 'E', octave: 4, freq: 329.63 }
    ],
    drop_d: [
        { note: 'D', octave: 2, freq: 73.42 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'B', octave: 3, freq: 246.94 },
        { note: 'E', octave: 4, freq: 329.63 }
    ],
    dadgad: [
        { note: 'D', octave: 2, freq: 73.42 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'D', octave: 3, stroke: 3, freq: 146.83 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'A', octave: 3, freq: 220.00 },
        { note: 'D', octave: 4, freq: 293.66 }
    ],
    open_g: [
        { note: 'D', octave: 2, freq: 73.42 },
        { note: 'G', octave: 2, freq: 98.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'B', octave: 3, freq: 246.94 },
        { note: 'D', octave: 4, freq: 293.66 }
    ],
    half_step: [
        { note: 'D#', octave: 2, freq: 77.78 },
        { note: 'G#', octave: 2, freq: 103.83 },
        { note: 'C#', octave: 3, freq: 138.59 },
        { note: 'F#', octave: 3, freq: 185.00 },
        { note: 'A#', octave: 3, freq: 233.08 },
        { note: 'D#', octave: 4, freq: 311.13 }
    ],
    open_d: [
        { note: 'D', octave: 2, freq: 73.42 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'F#', octave: 3, freq: 185.00 },
        { note: 'A', octave: 3, freq: 220.00 },
        { note: 'D', octave: 4, freq: 293.66 }
    ],
    c_standard: [
        { note: 'C', octave: 2, freq: 65.41 },
        { note: 'F', octave: 2, freq: 87.31 },
        { note: 'A#', octave: 2, freq: 116.54 },
        { note: 'D#', octave: 3, freq: 155.56 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'C', octave: 4, freq: 261.63 }
    ]
};

// Global audio & state fields
let audioContext = null;
let analyser = null;
let scriptProcessor = null;
let currentTuningKey = 'standard';
let lockedStringIndex = null; // null = Auto-Mode; Number = locked index

// Cache UI Elements
const btnStart = document.getElementById('btn-start');
const startOverlay = document.getElementById('start-overlay');
const tuningSelect = document.getElementById('tuning-select');
const stringsContainer = document.getElementById('strings-container');
const needle = document.getElementById('tuner-needle');
const centsDisplay = document.getElementById('cents-display');
const currentNoteDisplay = document.getElementById('current-note');
const statusText = document.getElementById('status-text');
const freqDisplay = document.getElementById('freq-display');
const modeBadge = document.getElementById('mode-badge');
const btnResetMode = document.getElementById('btn-reset-mode');

// Audio Processing Buffers & Configuration
const BUFFER_SIZE = 2048;
let audioBuffer = new Float32Array(BUFFER_SIZE);

// Event Listeners Initialization
btnStart.addEventListener('click', initAudioEngine);
tuningSelect.addEventListener('change', (e) => {
    currentTuningKey = e.target.value;
    lockedStringIndex = null;
    updateStringsUI();
    updateModeIndicator();
});
btnResetMode.addEventListener('click', () => {
    lockedStringIndex = null;
    updateStringsUI();
    updateModeIndicator();
});

// Setup & Initialize Web Audio Node graph upon interaction
async function initAudioEngine() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Hide permissions view layout cleanly
        startOverlay.style.opacity = '0';
        setTimeout(() => startOverlay.style.display = 'none', 300);

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = BUFFER_SIZE;

        const source = audioContext.createMediaStreamSource(stream);
        
        // Setup raw time-domain processing connection structure
        scriptProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
        scriptProcessor.onaudioprocess = processAudioFrame;

        source.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        // Initial setup for interface targets
        updateStringsUI();
    } catch (err) {
        console.error("Microphone activation failed:", err);
        alert("Mikrofon konnte nicht aktiviert werden. Bitte überprüfe deine Browsereinstellungen und lade die Seite über HTTPS.");
    }
}

// Generate the visual interactive interactive panels representing the instrument strings
function updateStringsUI() {
    stringsContainer.innerHTML = '';
    const strings = TUNINGS[currentTuningKey];
    
    strings.forEach((str, index) => {
        const btn = document.createElement('div');
        btn.className = 'string-btn';
        if (index === lockedStringIndex) btn.classList.add('user-locked');
        
        btn.innerHTML = `
            <span class="str-name">${str.note}</span>
            <span class="str-oct">${str.octave}</span>
        `;
        
        btn.addEventListener('click', () => {
            if (lockedStringIndex === index) {
                lockedStringIndex = null; // toggle off lock
            } else {
                lockedStringIndex = index;
            }
            updateStringsUI();
            updateModeIndicator();
        });
        
        stringsContainer.appendChild(btn);
    });
}

function updateModeIndicator() {
    if (lockedStringIndex !== null) {
        modeBadge.textContent = "Manueller Modus";
        modeBadge.className = "badge manual";
        btnResetMode.style.display = "inline-block";
    } else {
        modeBadge.textContent = "Auto-Modus";
        modeBadge.className = "badge";
        btnResetMode.style.display = "none";
    }
}

// Frame analysis hook calling autocorrelation algorithm 
function processAudioFrame(e) {
    analyser.getFloatTimeDomainData(audioBuffer);
    const sampleRate = audioContext.sampleRate;
    
    const frequency = autoCorrelate(audioBuffer, sampleRate);
    
    if (frequency === -1) {
        // No stable periodic wave structure detected (Silence/Noise)
        return; 
    }

    // Direct numerical mapping against active preset frequencies target list
    const currentTuning = TUNINGS[currentTuningKey];
    let targetIndex = 0;

    if (lockedStringIndex !== null) {
        targetIndex = lockedStringIndex;
    } else {
        // Dynamic search closest target frequency
        let minDiff = Infinity;
        currentTuning.forEach((str, idx) => {
            const diff = Math.abs(frequency - str.freq);
            if (diff < minDiff) {
                minDiff = diff;
                targetIndex = idx;
            }
        });
    }

    const targetNote = currentTuning[targetIndex];
    
    // Calculate cent error divergence formula: 1200 * log2(f1 / f2)
    const cents = 1200 * Math.log2(frequency / targetNote.freq);
    
    // Refresh GUI states matching calculation results
    renderTunerState(frequency, targetNote, cents, targetIndex);
}

// Autocorrelation pitch detection algorithm implementation
function autoCorrelate(buffer, sampleRate) {
    // Check root mean square (RMS) energy threshold to drop silent samples
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) return -1;

    // Clip buffer bounds search
    let r1 = 0, r2 = buffer.length - 1;
    const thres = 0.2;
    for (let i = 0; i < buffer.length / 2; i++) {
        if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = buffer.length - 1; i >= buffer.length / 2; i--) {
        if (Math.abs(buffer[i]) < thres) { r2 = i; break; }
    }
    const slicedBuffer = buffer.subarray(r1, r2);
    
    // Cross-correlation lag profile array allocation
    const c = new Float32Array(slicedBuffer.length);
    for (let i = 0; i < slicedBuffer.length; i++) {
        for (let j = 0; j < slicedBuffer.length - i; j++) {
            c[i] += slicedBuffer[j] * slicedBuffer[j + i];
        }
    }

    // Look for first descending edge slope
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    
    // Find absolute dominant period correlation peak matching base structural pattern
    let maxVal = -1, maxLag = -1;
    for (let i = d; i < c.length; i++) {
        if (c[i] > maxVal) {
            maxVal = c[i];
            maxLag = i;
        }
    }
    
    let T0 = maxLag;
    
    // Parabolic interpolation refinement step
    if (T0 > 0 && T0 < c.length - 1) {
        const alpha = c[T0 - 1];
        const beta = c[T0];
        const gamma = c[T0 + 1];
        const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
        T0 = T0 + p;
    }

    return sampleRate / T0;
}

// Paint UI updates mapping physical instrument feedback
function renderTunerState(frequency, targetNote, cents, activeIdx) {
    // Visually toggle active states matching current processed string matrix
    const buttons = stringsContainer.children;
    for (let i = 0; i < buttons.length; i++) {
        if (i === activeIdx) {
            buttons[i].classList.add('active-target');
        } else {
            buttons[i].classList.remove('active-target');
        }
    }

    // Refresh alphanumeric readout nodes 
    currentNoteDisplay.textContent = targetNote.note;
    freqDisplay.textContent = `${frequency.toFixed(1)} Hz / Ziel: ${targetNote.freq.toFixed(1)} Hz`;

    // Cap values inside standard visual bounds [-50, +50] cents
    const clampedCents = Math.max(-50, Math.min(50, cents));
    
    // Dynamic mapping gauge layout width translates: pixel position transforms
    // Container width is 100% inside a 400px wide area approx, center is 0px translation.
    const maxPixelOffset = 180; 
    const translateAmount = (clampedCents / 50) * maxPixelOffset;
    needle.style.transform = `translateX(-50%) translateX(${translateAmount}px)`;

    // Process conditional alert labels and feedback coloring profiles
    if (Math.abs(cents) <= 2) {
        statusText.textContent = "Perfekt gestimmt!";
        statusText.style.color = varColor('--accent');
        needle.style.backgroundColor = varColor('--accent');
        centsDisplay.textContent = "✔ 0 Cents";
        centsDisplay.style.color = varColor('--accent');
    } else if (cents < 0) {
        statusText.textContent = "Zu tief (Flat)";
        statusText.style.color = varColor('--flat-red');
        needle.style.backgroundColor = varColor('--flat-red');
        centsDisplay.textContent = `${Math.round(cents)} Cents`;
        centsDisplay.style.color = varColor('--flat-red');
    } else {
        statusText.textContent = "Zu hoch (Sharp)";
        statusText.style.color = varColor('--sharp-orange');
        needle.style.backgroundColor = varColor('--sharp-orange');
        centsDisplay.textContent = `+${Math.round(cents)} Cents`;
        centsDisplay.style.color = varColor('--sharp-orange');
    }
}

// Utility CSS property fetching shortcut helper
function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
