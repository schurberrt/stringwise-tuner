let audioContext = null;
let analyser = null;
let mediaStreamSource = null;
let isAudioInitialized = false;

// Frequenzen für die Tunings (Note: Frequenz in Hz)
const tuningPresets = {
    standard: [
        { note: "E2", freq: 82.41 },
        { note: "A2", freq: 110.00 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.00 },
        { note: "B3", freq: 246.94 },
        { note: "E4", freq: 329.63 }
    ],
    dropD: [
        { note: "D2", freq: 73.42 },
        { note: "A2", freq: 110.00 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.00 },
        { note: "B3", freq: 246.94 },
        { note: "E4", freq: 329.63 }
    ],
    dadgad: [
        { note: "D2", freq: 73.42 },
        { note: "A2", freq: 110.00 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.00 },
        { note: "A3", freq: 220.00 },
        { note: "D4", freq: 293.66 }
    ],
    openG: [
        { note: "D2", freq: 73.42 },
        { note: "G2", freq: 98.00 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.00 },
        { note: "B3", freq: 246.94 },
        { note: "D4", freq: 293.66 }
    ],
    halfStep: [
        { note: "D#2", freq: 77.78 },
        { note: "G#2", freq: 103.83 },
        { note: "C#3", freq: 138.59 },
        { note: "F#3", freq: 185.00 },
        { note: "A#3", freq: 233.08 },
        { note: "D#4", freq: 311.13 }
    ],
    openD: [
        { note: "D2", freq: 73.42 },
        { note: "A2", freq: 110.00 },
        { note: "D3", freq: 146.83 },
        { note: "F#3", freq: 174.61 },
        { note: "A3", freq: 220.00 },
        { note: "D4", freq: 293.66 }
    ],
    cStandard: [
        { note: "C2", freq: 65.41 },
        { note: "F2", freq: 87.31 },
        { note: "A#2", freq: 116.54 },
        { note: "D#3", freq: 155.56 },
        { note: "G3", freq: 196.00 },
        { note: "C4", freq: 261.63 }
    ]
};

let currentTuning = "standard";
let selectedStringIndex = null; // null = Auto-Modus

const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const tuningSelect = document.getElementById('tuning-select');
const stringsContainer = document.getElementById('strings-container');
const needle = document.getElementById('needle');
const centsDisplay = document.getElementById('cents-display');
const currentNoteDisplay = document.getElementById('current-note');

// Event-Listener für den Start-Button (Zwingend erforderlich für Browser-Sicherheit)
startBtn.addEventListener('click', async () => {
    await initAudio();
    startOverlay.style.display = 'none';
});

// Tuning-Auswahl wechseln
tuningSelect.addEventListener('change', (e) => {
    currentTuning = e.target.value;
    selectedStringIndex = null; // Zurücksetzen auf Auto-Modus
    renderStrings();
});

// Saiten-Anzeige generieren
function renderStrings() {
    stringsContainer.innerHTML = '';
    const strings = tuningPresets[currentTuning];
    
    // Von hoher Saite (E4) zu tiefer Saite (E2) anzeigen
    [...strings].reverse().forEach((str, revIndex) => {
        const actualIndex = strings.length - 1 - revIndex;
        const stringBtn = document.createElement('button');
        stringBtn.className = 'string-btn';
        if (selectedStringIndex === actualIndex) stringBtn.classList.add('active');
        stringBtn.innerHTML = `<span>${str.note}</span><small>${str.freq} Hz</small>`;
        
        stringBtn.addEventListener('click', () => {
            if (selectedStringIndex === actualIndex) {
                selectedStringIndex = null; // Erneut klicken schaltet Auto-Modus wieder an
                stringBtn.classList.remove('active');
            } else {
                selectedStringIndex = actualIndex;
                document.querySelectorAll('.string-btn').forEach(b => b.classList.remove('active'));
                stringBtn.classList.add('active');
            }
        });
        stringsContainer.appendChild(stringBtn);
    });
}

// Audio-Engine initialisieren
async function initAudio() {
    if (isAudioInitialized) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        mediaStreamSource = audioContext.createMediaStreamSource(stream);
        mediaStreamSource.connect(analyser);
        
        isAudioInitialized = true;
        renderStrings();
        updateTuner(); // Startet die Animations-Schleife für die Skala
    } catch (err) {
        alert("Mikrofon-Zugriff verweigert oder nicht unterstützt. Bitte lade die Seite über HTTPS (GitHub Pages) und erlaube das Mikrofon.");
        console.error(err);
    }
}

// Animations-Schleife für Tonhöhen-Erkennung und Skala-Ausschlag
function updateTuner() {
    if (!isAudioInitialized) return;
    
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);
    
    // Grundfrequenz mittels Autokorrelation bestimmen
    const frequency = autoCorrelate(dataArray, audioContext.sampleRate);
    
    if (frequency !== -1 && frequency > 50 && frequency < 500) {
        const strings = tuningPresets[currentTuning];
        let targetString = null;
        
        if (selectedStringIndex !== null) {
            targetString = strings[selectedStringIndex];
        } else {
            // Auto-Modus: Finde die Saite mit der geringsten Frequenz-Abweichung
            let minDiff = Infinity;
            strings.forEach((str, idx) => {
                let diff = Math.abs(frequency - str.freq);
                if (diff < minDiff) {
                    minDiff = diff;
                    targetString = str;
                }
            });
        }
        
        if (targetString) {
            // Berechnung der Abweichung in Cents
            const cents = 1200 * Math.log2(frequency / targetString.freq);
            
            // UI aktualisieren
            currentNoteDisplay.textContent = targetString.note;
            centsDisplay.textContent = (cents >= 0 ? "+" : "") + Math.round(cents) + " Cents";
            
            // Nadel bewegen (-50 Cents = -45 Grad, +50 Cents = 45 Grad)
            let angle = Math.max(-45, Math.min(45, cents * 0.9));
            needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            
            // Farb-Indikator setzen
            if (Math.abs(cents) <= 3) {
                needle.style.backgroundColor = "#2ecc71"; // Perfekt Grün
                centsDisplay.style.color = "#2ecc71";
            } else if (Math.abs(cents) <= 15) {
                needle.style.backgroundColor = "#f39c12"; // Leicht daneben Orange
                centsDisplay.style.color = "#f39c12";
            } else {
                needle.style.backgroundColor = "#e74c3c"; // Stark daneben Rot
                centsDisplay.style.color = "#e74c3c";
            }
        }
    }
    
    requestAnimationFrame(updateTuner);
}

// Autokorrelations-Algorithmus zur präzisen Frequenzbestimmung
function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        let val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Zu leises Signal / Rauschen ignorieren

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

    let d = 0; while (c[d] > c[d + 1]) d++;
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
