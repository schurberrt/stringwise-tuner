// Preset Definitionen mit Saitenbelegung und Frequenzen
const presets = {
    standard: [
        { note: 'E', octave: 4, freq: 329.63 },
        { note: 'B', octave: 3, freq: 246.94 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'E', octave: 2, freq: 82.41 }
    ],
    dropD: [
        { note: 'E', octave: 4, freq: 329.63 },
        { note: 'B', octave: 3, freq: 246.94 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'D', octave: 2, freq: 73.42 }
    ],
    dadgad: [
        { note: 'D', octave: 4, freq: 293.66 },
        { note: 'A', octave: 3, freq: 220.00 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'D', octave: 2, freq: 73.42 }
    ],
    openG: [
        { note: 'D', octave: 4, freq: 293.66 },
        { note: 'B', octave: 3, freq: 246.94 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'G', octave: 2, freq: 98.00 },
        { note: 'D', octave: 2, freq: 73.42 }
    ],
    halfStepDown: [
        { note: 'D#', octave: 4, freq: 311.13 },
        { note: 'A#', octave: 3, freq: 233.08 },
        { note: 'F#', octave: 3, freq: 185.00 },
        { note: 'C#', octave: 3, freq: 138.59 },
        { note: 'G#', octave: 2, freq: 103.83 },
        { note: 'D#', octave: 2, freq: 77.78 }
    ],
    openD: [
        { note: 'D', octave: 4, freq: 293.66 },
        { note: 'A', octave: 3, freq: 220.00 },
        { note: 'F#', octave: 3, freq: 185.00 },
        { note: 'D', octave: 3, freq: 146.83 },
        { note: 'A', octave: 2, freq: 110.00 },
        { note: 'D', octave: 2, freq: 73.42 }
    ],
    cStandard: [
        { note: 'C', octave: 4, freq: 261.63 },
        { note: 'G', octave: 3, freq: 196.00 },
        { note: 'D#', octave: 3, freq: 155.56 },
        { note: 'A#', octave: 2, freq: 116.54 },
        { note: 'F', octave: 2, freq: 87.31 },
        { note: 'C', octave: 2, freq: 65.41 }
    ]
};

// DOM Elemente
const tuningPresetSelect = document.getElementById('tuningPreset');
const stringsContainer = document.getElementById('stringsContainer');
const micButton = document.getElementById('micButton');
const autoModeToggle = document.getElementById('autoModeToggle');
const currentNoteEl = document.getElementById('currentNote');
const targetFrequencyEl = document.getElementById('targetFrequency');
const centsValueEl = document.getElementById('centsValue');
const needleEl = document.getElementById('needle');
const statusMessageEl = document.getElementById('statusMessage');

let audioCtx = null;
let analyzer = null;
let microphone = null;
let isAudioRunning = false;
let currentSelectedStringIndex = 0; // Für manuellen Modus
let currentTuningStrings = [];

// Initialisiere die Saitenanzeige basierend auf Auswahl
function updateTuningLayout() {
    const selectedPreset = tuningPresetSelect.value;
    currentTuningStrings = [...presets[selectedPreset]]; // Erzeuge Kopie (E4 ist index 0, E2 ist index 5)
    
    stringsContainer.innerHTML = '';
    // Iteriere rückwärts für korrekte visuelle Reihenfolge der Saiten am Interface (6. bis 1. Saite)
    for (let i = currentTuningStrings.length - 1; i >= 0; i--) {
        const stringData = currentTuningStrings[i];
        const stringDiv = document.createElement('div');
        stringDiv.className = 'guitar-string';
        stringDiv.dataset.index = i;
        stringDiv.innerHTML = `
            <span class="string-name">${stringData.note}</span>
            <span class="string-octave">${stringData.octave}</span>
        `;
        
        stringDiv.addEventListener('click', () => {
            autoModeToggle.checked = false;
            selectString(i);
        });
        
        stringsContainer.appendChild(stringDiv);
    }
    
    selectString(currentSelectedStringIndex >= currentTuningStrings.length ? 0 : currentSelectedStringIndex);
}

function selectString(index) {
    currentSelectedStringIndex = index;
    const stringDivs = document.querySelectorAll('.guitar-string');
    stringDivs.forEach(div => {
        div.classList.remove('active');
        if (parseInt(div.dataset.index) === index) {
            div.classList.add('active');
        }
    });
    
    const activeString = currentTuningStrings[index];
    currentNoteEl.textContent = activeString.note + activeString.octave;
    targetFrequencyEl.textContent = `${activeString.freq.toFixed(2)} Hz`;
}

tuningPresetSelect.addEventListener('change', updateTuningLayout);

// Audio Setup & Algorithmus
micButton.addEventListener('click', async () => {
    if (isAudioRunning) {
        audioCtx.close();
        isAudioRunning = false;
        micButton.textContent = 'Mikrofon starten';
        micButton.classList.remove('active');
        statusMessageEl.textContent = 'Mikrofon gestoppt.';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 2048;
        microphone = audioCtx.createMediaStreamSource(stream);
        microphone.connect(analyzer);
        
        isAudioRunning = true;
        micButton.textContent = 'Stimmgerät läuft';
        statusMessageEl.textContent = 'Spiele eine Saite an...';
        
        processAudio();
    } catch (err) {
        statusMessageEl.textContent = 'Mikrofon-Zugriff verweigert!';
        console.error(err);
    }
});

function processAudio() {
    if (!isAudioRunning) return;
    
    const buffer = new Float32Array(analyzer.fftSize);
    analyzer.getFloatTimeDomainData(buffer);
    
    const pitch = autoCorrelate(buffer, audioCtx.sampleRate);
    
    if (pitch !== -1 && pitch > 50 && pitch < 500) {
        handlePitchDetected(pitch);
    }
    
    requestAnimationFrame(processAudio);
}

// Autokorrelations-Algorithmus zur Pitch-Erkennung
function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        let val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Zu leise

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = SIZE - 1; i >= SIZE / 2; i--) {
        if (Math.abs(buffer[i]) < thres) { r2 = i; break; }
    }

    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] = c[i] + buffer[j] * buffer[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }

    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
}

function handlePitchDetected(frequency) {
    let targetIndex = currentSelectedStringIndex;
    
    // Auto-Modus: Finde die Saite im Preset mit der geringsten Frequenz-Abweichung
    if (autoModeToggle.checked) {
        let minDiff = Infinity;
        for (let i = 0; i < currentTuningStrings.length; i++) {
            let diff = Math.abs(frequency - currentTuningStrings[i].freq);
            if (diff < minDiff) {
                minDiff = diff;
                targetIndex = i;
            }
        }
        if (targetIndex !== currentSelectedStringIndex) {
            selectString(targetIndex);
        }
    }
    
    const targetString = currentTuningStrings[targetIndex];
    
    // Berechne Abweichung in Cents
    const cents = 1200 * Math.log2(frequency / targetString.freq);
    centsValueEl.textContent = (cents >= 0 ? '+' : '') + Math.round(cents);
    
    // Nadel-Ausschlag begrenzen (-50 bis +50 Cents map auf -45deg bis +45deg)
    const constrainedCents = Math.max(-50, Math.min(50, cents));
    needleEl.style.left = `${50 + (constrainedCents * 0.8)}%`;
    
    // Visuelles Feedback
    const stringDivs = document.querySelectorAll('.guitar-string');
    stringDivs.forEach(div => div.classList.remove('target-match'));
    const activeDiv = document.querySelector(`.guitar-string[data-index="${targetIndex}"]`);
    
    if (Math.abs(cents) < 3) {
        statusMessageEl.textContent = 'Perfekt gestimmt!';
        statusMessageEl.style.color = '#00e676';
        currentNoteEl.style.color = '#00e676';
        if (activeDiv) activeDiv.classList.add('target-match');
    } else if (cents < 0) {
        statusMessageEl.textContent = 'Zu tief...';
        statusMessageEl.style.color = '#ffb300';
        currentNoteEl.style.color = '#ffb300';
    } else {
        statusMessageEl.textContent = 'Zu hoch!';
        statusMessageEl.style.color = '#f44336';
        currentNoteEl.style.color = '#f44336';
    }
}

// Initialisierung
updateTuningLayout();
