// Teachable Machine Model URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/gZLfgZ7bl/";

// Generation Data Config
const GENERATIONS_DATA = {
  "Generación 1": {
    badge: "Generación 1",
    title: "Primera Generación (1982–1995)",
    desc: "Los My Little Pony de primera generación son los originales, creados por Hasbro en 1982. Se caracterizan por cuerpos robustos y rechonchos, ojos grandes con pestañas marcadas y cutie mark en la cadera. Son muy valorados por coleccionistas debido a su antigüedad.",
    link: "https://data.mlpmerch.com/g1/",
    isFake: false
  },
  "Generación 2": {
    badge: "Generación 2",
    title: "Segunda Generación (1997–2003)",
    desc: "La generación menos conocida y más escasa. Los ponys G2 tienen cuerpo estilizado y delgado, patas largas y ojos con diseño de gema o cristal muy característico. Fueron más populares en Europa, por lo que son difíciles de conseguir en Latinoamérica y su valor coleccionable es alto.",
    link: "https://data.mlpmerch.com/g2/",
    isFake: false
  },
  "Generación 3": {
    badge: "Generación 3",
    title: "Tercera Generación (2003–2009)",
    desc: "Los ponys G3 tienen cuerpo redondeado y adorable, ojos grandes y brillantes sin pupila definida, y cutie marks elaborados. Son muy coloridos y populares entre coleccionistas por la gran variedad de personajes producidos. Relativamente fáciles de conseguir y con precios accesibles.",
    link: "https://data.mlpmerch.com/g3/",
    isFake: false
  },
  "Generación 4": {
    badge: "Generación 4",
    title: "Cuarta Generación (2010–2016)",
    desc: "La generación más reconocible gracias a la serie My Little Pony: La Magia de la Amistad. Los ponys G4 tienen cuerpos pequeños y compactos, cabeza grande proporcionalmente y ojos enormes con pupila definida. Es la generación más fácil de conseguir y la más económica en el mercado de segunda mano.",
    link: "https://data.mlpmerch.com/brushables/",
    isFake: false
  },
  "Falsos": {
    badge: "Falsificación ⚠️",
    title: "¡Posible Falsificación Detectada!",
    desc: "Este pony podría ser una copia no oficial. Antes de comprarlo revisa: ojos asimétricos o mal impresos, plástico de tacto pegajoso o brilloso, cutie mark borroso o mal centrado, olor fuerte a plástico barato, y pelo áspero o de colores incorrectos. Cuando tengas dudas, compara siempre con originales verificados.",
    link: "https://youtu.be/JzRditDJ1DA",
    isFake: true
  }
};

// Global variables
let model = null;
let webcam = null;
let isWebcamActive = false;
let currentImageElement = null;
let isLocked = false;

// DOM Elements
const tabUpload = document.getElementById("tab-upload");
const tabWebcam = document.getElementById("tab-webcam");
const panelUpload = document.getElementById("panel-upload");
const panelWebcam = document.getElementById("panel-webcam");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const previewContainer = document.getElementById("preview-container");
const previewImg = document.getElementById("preview-img");
const webcamContainer = document.getElementById("webcam-container");
const uploadControls = document.getElementById("upload-controls");
const btnAnalyze = document.getElementById("btn-analyze");
const btnClear = document.getElementById("btn-clear");
const btnStartWebcam = document.getElementById("btn-start-webcam");
const btnStopWebcam = document.getElementById("btn-stop-webcam");
const loadingOverlay = document.getElementById("loading-overlay");
const overlayText = document.getElementById("overlay-text");
const resultSection = document.getElementById("result-section");
const resultBadge = document.querySelector(".result-badge");
const confidenceBar = document.getElementById("confidence-bar");
const confidenceValue = document.getElementById("confidence-value");
const resultCard = document.getElementById("result-card");
const resultTitle = document.getElementById("result-title");
const resultDesc = document.getElementById("result-desc");
const resultLink = document.getElementById("result-link");
const btnUnlock = document.getElementById("btn-unlock");

/* ==========================================================================
   Model Loading
   ========================================================================== */

async function initModel() {
  if (model) return;
  try {
    showOverlay("Cargando modelo mágico...");
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    hideOverlay();
  } catch (error) {
    console.error("Error cargando el modelo:", error);
    showOverlay("Error cargando el modelo de Teachable Machine. Revisa tu conexión.");
  }
}

/* ==========================================================================
   Overlay utilities
   ========================================================================== */

function showOverlay(text) {
  overlayText.innerText = text;
  loadingOverlay.style.display = "flex";
  previewContainer.style.display = "flex";
}

function hideOverlay() {
  loadingOverlay.style.display = "none";
}

/* ==========================================================================
   Prediction & DOM Updates
   ========================================================================== */

async function predict(imageElement) {
  if (isLocked) return;

  if (!model) {
    await initModel();
  }
  
  if (!model) return;

  const predictions = await model.predict(imageElement);
  
  // Find prediction with highest probability
  let bestPrediction = predictions[0];
  for (let i = 1; i < predictions.length; i++) {
    if (predictions[i].probability > bestPrediction.probability) {
      bestPrediction = predictions[i];
    }
  }

  // Si supera el 80% de confianza, bloqueamos la predicción
  if (bestPrediction.probability >= 0.8) {
    isLocked = true;
    btnUnlock.style.display = "inline-flex";
  }

  displayResult(bestPrediction.className, bestPrediction.probability);
}

function displayResult(className, probability) {
  const percentage = Math.round(probability * 100);
  
  // Get data configuration
  const data = GENERATIONS_DATA[className];
  if (!data) return;

  // Update confidence elements
  confidenceValue.innerText = `${percentage}%`;
  confidenceBar.style.width = `${percentage}%`;

  // Update Result Card content
  resultBadge.innerHTML = data.badge;
  resultTitle.innerText = data.title;
  resultDesc.innerText = data.desc;
  resultLink.href = data.link;

  // Adapt style for Fake vs G1-G4
  if (data.isFake) {
    resultCard.className = "result-card fake";
  } else {
    resultCard.className = "result-card";
  }

  // Show result section
  resultSection.style.display = "block";
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ==========================================================================
   Tab Navigation & Webcam management
   ========================================================================== */

function switchTab(mode) {
  // Stop webcam if switching tabs
  if (isWebcamActive) {
    stopWebcam();
  }

  isLocked = false;
  btnUnlock.style.display = "none";
  resultSection.style.display = "none";

  if (mode === "upload") {
    tabUpload.classList.add("active");
    tabUpload.setAttribute("aria-selected", "true");
    tabWebcam.classList.remove("active");
    tabWebcam.setAttribute("aria-selected", "false");
    panelUpload.classList.add("active");
    panelWebcam.classList.remove("active");
    
    // Show image preview container if image exists
    if (previewImg.src && previewImg.style.display === "block") {
      previewContainer.style.display = "flex";
      uploadControls.style.display = "flex";
    } else {
      previewContainer.style.display = "none";
      uploadControls.style.display = "none";
    }
  } else {
    tabWebcam.classList.add("active");
    tabWebcam.setAttribute("aria-selected", "true");
    tabUpload.classList.remove("active");
    tabUpload.setAttribute("aria-selected", "false");
    panelWebcam.classList.add("active");
    panelUpload.classList.remove("active");
    
    // Hide image elements
    previewImg.style.display = "none";
    uploadControls.style.display = "none";
    previewContainer.style.display = "none";
  }
}

async function startWebcam() {
  try {
    showOverlay("Iniciando cámara mágica...");
    
    // Ensure model is loaded first
    await initModel();
    
    const flip = true; // Mirror canvas
    webcam = new tmImage.Webcam(400, 300, flip);
    await webcam.setup();
    await webcam.play();
    
    // Display canvas in DOM
    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);
    
    previewImg.style.display = "none";
    hideOverlay();
    
    btnStartWebcam.style.display = "none";
    btnStopWebcam.style.display = "flex";
    
    isWebcamActive = true;
    requestAnimationFrame(webcamLoop);
  } catch (error) {
    console.error("Error al iniciar cámara:", error);
    showOverlay("No se pudo acceder a la cámara. Por favor otorga los permisos correspondientes.");
    setTimeout(() => {
      hideOverlay();
      previewContainer.style.display = "none";
    }, 3000);
  }
}

function stopWebcam() {
  isWebcamActive = false;
  isLocked = false;
  btnUnlock.style.display = "none";
  if (webcam) {
    webcam.stop();
    webcam = null;
  }
  webcamContainer.innerHTML = "";
  btnStartWebcam.style.display = "flex";
  btnStopWebcam.style.display = "none";
  previewContainer.style.display = "none";
  resultSection.style.display = "none";
}

async function webcamLoop() {
  if (!isWebcamActive) return;
  webcam.update();
  await predict(webcam.canvas);
  requestAnimationFrame(webcamLoop);
}

/* ==========================================================================
   File / Image Input Logic
   ========================================================================== */

function handleImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Por favor selecciona un archivo de imagen válido.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    previewImg.src = e.target.result;
    previewImg.style.display = "block";
    
    // Clear webcam canvas just in case
    webcamContainer.innerHTML = "";
    
    previewContainer.style.display = "flex";
    uploadControls.style.display = "flex";
    resultSection.style.display = "none";
    
    // Auto-predict once loaded
    previewImg.onload = async function() {
      showOverlay("Analizando pony...");
      await predict(previewImg);
      hideOverlay();
    };
  };
  reader.readAsDataURL(file);
}

/* ==========================================================================
   Event Listeners
   ========================================================================== */

// Tabs
tabUpload.addEventListener("click", () => switchTab("upload"));
tabWebcam.addEventListener("click", () => switchTab("webcam"));

// Drag and drop Zone
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    handleImageFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleImageFile(e.target.files[0]);
  }
});

// Image buttons
btnAnalyze.addEventListener("click", async () => {
  showOverlay("Analizando pony...");
  await predict(previewImg);
  hideOverlay();
});

btnClear.addEventListener("click", () => {
  previewImg.src = "";
  previewImg.style.display = "none";
  previewContainer.style.display = "none";
  uploadControls.style.display = "none";
  resultSection.style.display = "none";
  fileInput.value = "";
  isLocked = false;
  btnUnlock.style.display = "none";
});

// Webcam buttons
btnStartWebcam.addEventListener("click", startWebcam);
btnStopWebcam.addEventListener("click", stopWebcam);

// Unlock button
btnUnlock.addEventListener("click", () => {
  isLocked = false;
  btnUnlock.style.display = "none";
});

// Initialize model on page load in the background
window.addEventListener("DOMContentLoaded", () => {
  initModel();
});
