// main.js (module)
const {
  createWorker
} = Tesseract;

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const startOcrBtn = document.getElementById('startOcrBtn');
const progressEl = document.getElementById('progress');
const statusEl = document.getElementById('status');
const imageCanvas = document.getElementById('imageCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const resultText = document.getElementById('resultText');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const logArea = document.getElementById('logArea');
const langSelect = document.getElementById('langSelect');
const drawBoxesCheckbox = document.getElementById('drawBoxes');
const saveLangCheckbox = document.getElementById('saveLang');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const videoEl = document.getElementById('video');
const downloadImageBtn = document.getElementById('downloadImageBtn');

let currentImage = null; // Image or data URL
let worker = null;
let stream = null;

function log(...args) {
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  console.log(msg);
  logArea.textContent += msg + '\n';
  logArea.scrollTop = logArea.scrollHeight;
}

// restore saved language
try {
  const saved = localStorage.getItem('ocr_lang');
  if (saved) langSelect.value = saved;
  const saveLang = localStorage.getItem('ocr_saveLang') === '1';
  saveLangCheckbox.checked = saveLang;
} catch (e) {
  // ignore
}

fileInput.addEventListener('change', async (e) => {
  if (!e.target.files || !e.target.files[0]) return;
  const file = e.target.files[0];
  await loadFileAsImage(file);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', (e) => {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    await loadFileAsImage(e.dataTransfer.files[0]);
  }
});

async function loadFileAsImage(file) {
  if (!file.type.startsWith('image/')) {
    alert('Seleziona un file immagine.');
    return;
  }
  const url = URL.createObjectURL(file);
  await setImageFromUrl(url);
  downloadImageBtn.disabled = false;
  startOcrBtn.disabled = false;
  log('Immagine caricata:', file.name);
}

async function setImageFromUrl(url) {
  // create image and draw to canvas
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  currentImage = img;
  drawImageToCanvas(img);
}

function drawImageToCanvas(img) {
  const canvas = imageCanvas;
  const ctx = canvas.getContext('2d');
  // fit canvas to container width while preserving aspect
  const containerWidth = canvas.parentElement.clientWidth;
  const scale = Math.min(1, containerWidth / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  canvas.width = w;
  canvas.height = h;
  overlayCanvas.width = w;
  overlayCanvas.height = h;
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(img,0,0,w,h);
  clearOverlay();
}

function clearOverlay() {
  const oc = overlayCanvas;
  const ctx = oc.getContext('2d');
  ctx.clearRect(0,0,oc.width,oc.height);
}

function enableButtonsForResult(bool) {
  copyBtn.disabled = !bool;
  downloadBtn.disabled = !bool;
}

startOcrBtn.addEventListener('click', async () => {
  if (!currentImage) {
    alert('Nessuna immagine selezionata.');
    return;
  }
  startOcrBtn.disabled = true;
  statusEl.textContent = 'Preparazione worker...';
  const lang = langSelect.value || 'eng';
  if (saveLangCheckbox.checked) {
    try { localStorage.setItem('ocr_lang', lang); localStorage.setItem('ocr_saveLang','1') } catch(e){}
  } else {
    try { localStorage.removeItem('ocr_lang'); localStorage.setItem('ocr_saveLang','0') } catch(e){}
  }

  if (!worker) {
    worker = createWorker({
      // optional: set logger here; we also attach progress below
      logger: m => {
        // m = {status, progress}
        if (m && typeof m.progress === 'number') {
          progressEl.value = m.progress;
        }
        if (m && m.status) {
          statusEl.textContent = m.status;
        }
        log('worker:', JSON.stringify(m));
      }
    });
    await worker.load();
  }

  try {
    statusEl.textContent = 'Caricamento lingua...';
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    // optionally set parameters
    await worker.setParameters({
      tessjs_create_hocr: '1',
      tessjs_create_tsv: '1'
    });

    statusEl.textContent = 'Esecuzione OCR...';
    const canvas = document.createElement('canvas');
    // use displayed canvas to reduce size (speed)
    canvas.width = imageCanvas.width;
    canvas.height = imageCanvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageCanvas, 0, 0);

    const { data } = await worker.recognize(canvas);

    resultText.value = data.text || '';
    enableButtonsForResult(!!data.text);

    // draw boxes if requested
    clearOverlay();
    if (drawBoxesCheckbox.checked && data.words) {
      drawWordBoxes(data.words, canvas.width / currentImage.width, canvas.height / currentImage.height);
    }
    statusEl.textContent = 'Completato';
    progressEl.value = 1;
    log('OCR completato. Parole rilevate:', data.words ? data.words.length : 0);
  } catch (err) {
    console.error(err);
    alert('Errore durante OCR: ' + (err.message || err));
    log('Errore:', err.toString());
    statusEl.textContent = 'Errore';
  } finally {
    startOcrBtn.disabled = false;
    // do not terminate worker to reuse it
  }
});

function drawWordBoxes(words, scaleX = 1, scaleY = 1) {
  // words have bbox: x0,y0,x1,y1 (relative to original image size used by Tesseract)
  const oc = overlayCanvas;
  const ctx = oc.getContext('2d');
  ctx.strokeStyle = 'rgba(124,58,237,0.9)';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(124,58,237,0.12)';
  words.forEach(w => {
    // The coords from tesseract are in image pixels relative to the input image
    // Our canvas had been scaled, so we must scale boxes to canvas size.
    // Tesseract uses x0,y0,x1,y1
    const x = Math.round(w.bbox.x0 * (oc.width / w.bbox.width / (w.bbox.width ? 1 : 1))); // fallback
    // Instead compute robustly using properties: w.bbox.x0 .. but ratio to original image: use w.bbox.x0 & image width are relative to original input image. Simpler: use w.bbox directly and scale by ratio of canvas/currentImage.
    // We'll compute scale factors:
  });

  // Instead reimplement drawing using data.words coordinates relative to the input canvas we sent to recognize.
  // The worker recognized our canvas (same size as imageCanvas), so we can draw boxes by mapping bbox.x0..x1 to overlay size.
  // We'll rebuild with corrected approach below.
  ctx.clearRect(0,0,oc.width,oc.height);
  ctx.strokeStyle = 'rgba(124,58,237,0.95)';
  ctx.lineWidth = Math.max(1, Math.min(3, oc.width / 400));
  ctx.fillStyle = 'rgba(124,58,237,0.08)';
  for (const w of words) {
    if (!w.bbox) continue;
    const x = w.bbox.x0;
    const y = w.bbox.y0;
    const wbox = w.bbox.x1 - w.bbox.x0;
    const hbox = w.bbox.y1 - w.bbox.y0;
    // If recognition ran on a canvas with same pixel dimensions as imageCanvas, coords match overlayCanvas pixel coordinates
    ctx.strokeRect(x, y, wbox, hbox);
    ctx.fillRect(x, y, wbox, hbox);
    // small label
    ctx.fillStyle = 'rgba(2,16,24,0.85)';
    ctx.font = `${Math.max(10, Math.round(oc.width / 120))}px sans-serif`;
    ctx.fillText((w.text || '').trim().slice(0,20), x + 2, y + Math.min(hbox - 2, 14));
    ctx.fillStyle = 'rgba(124,58,237,0.08)';
  }
}

// copy
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    statusEl.textContent = 'Testo copiato negli appunti';
  } catch (e) {
    alert('Copia non riuscita: ' + e);
  }
});

// download text
downloadBtn.addEventListener('click', () => {
  const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ocr-result.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// clear
clearBtn.addEventListener('click', () => {
  currentImage = null;
  const ctx = imageCanvas.getContext('2d');
  ctx.clearRect(0,0,imageCanvas.width,imageCanvas.height);
  clearOverlay();
  resultText.value = '';
  enableButtonsForResult(false);
  progressEl.value = 0;
  statusEl.textContent = 'In attesa';
  downloadImageBtn.disabled = true;
});

// download image (from canvas)
downloadImageBtn.addEventListener('click', () => {
  const url = imageCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'image.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
});

// Camera flow
startCameraBtn.addEventListener('click', async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera non supportata da questo browser.');
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    videoEl.srcObject = stream;
    videoEl.classList.remove('hidden');
    captureBtn.classList.remove('hidden');
    stopCameraBtn.classList.remove('hidden');
    startCameraBtn.classList.add('hidden');
    statusEl.textContent = 'Camera attiva';
  } catch (e) {
    alert('Impossibile attivare la camera: ' + e.message);
    log('Camera error', e);
  }
});

captureBtn.addEventListener('click', async () => {
  if (!videoEl || videoEl.readyState < 2) {
    alert('Video non pronto.');
    return;
  }
  // draw video frame to canvas
  const w = videoEl.videoWidth;
  const h = videoEl.videoHeight;
  // scale to container width
  const containerWidth = imageCanvas.parentElement.clientWidth;
  const scale = Math.min(1, containerWidth / w);
  imageCanvas.width = Math.round(w * scale);
  imageCanvas.height = Math.round(h * scale);
  overlayCanvas.width = imageCanvas.width;
  overlayCanvas.height = imageCanvas.height;
  const ctx = imageCanvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, imageCanvas.width, imageCanvas.height);
  // freeze frame as image
  const dataUrl = imageCanvas.toDataURL('image/png');
  const img = new Image();
  await new Promise((res) => { img.onload = res; img.src = dataUrl; });
  currentImage = img;
  startOcrBtn.disabled = false;
  downloadImageBtn.disabled = false;
  statusEl.textContent = 'Frame catturato';
});

stopCameraBtn.addEventListener('click', () => {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  videoEl.classList.add('hidden');
  captureBtn.classList.add('hidden');
  stopCameraBtn.classList.add('hidden');
  startCameraBtn.classList.remove('hidden');
  statusEl.textContent = 'Camera chiusa';
});

langSelect.addEventListener('change', () => {
  // do nothing immediate - language will be loaded when starting OCR
});

drawBoxesCheckbox.addEventListener('change', () => {
  if (!drawBoxesCheckbox.checked) clearOverlay();
});

// On load, size canvases to container
window.addEventListener('resize', () => {
  if (currentImage) drawImageToCanvas(currentImage);
});

// helper: robust drawing of boxes using data from worker
// Note: Tesseract worker.recognize was given a canvas that matched imageCanvas dimensions, so coords are in that coordinate space.

// Ensure copy/download availability when text changes
resultText.addEventListener('input', () => {
  enableButtonsForResult(resultText.value.trim().length > 0);
});

// save preference toggle
saveLangCheckbox.addEventListener('change', () => {
  try {
    localStorage.setItem('ocr_saveLang', saveLangCheckbox.checked ? '1' : '0');
    if (!saveLangCheckbox.checked) localStorage.removeItem('ocr_lang');
  } catch(e){}
});

// small UX: enable dropzone file chooser
document.querySelector('.file-btn[for]')?.addEventListener('click', ()=>{});

// log initial
log('OCR client-side inizializzato');
statusEl.textContent = 'Pronto';
