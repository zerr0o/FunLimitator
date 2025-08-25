// Liste des sites par défaut à bloquer
const DEFAULT_BLOCKED_SITES = [
  { url: 'facebook.com', exclude: ['facebook.com/messages'] },
  { url: 'youtube.com', exclude: [] },
  { url: 'instagram.com', exclude: [] }
];

// Vérifier si le site actuel doit être bloqué
function shouldBlockSite(currentUrl, blockedSites) {
  for (const site of blockedSites) {
    if (currentUrl.includes(site.url)) {
      // Vérifier les exclusions
      const isExcluded = site.exclude.some(excludeUrl => currentUrl.includes(excludeUrl));
      if (!isExcluded) {
        return true;
      }
    }
  }
  return false;
}

// Créer la popup d'avertissement
function createWarningPopup() {
  // Vérifier si la popup existe déjà
  if (document.getElementById('fun-limitator-popup')) {
    return;
  }

  const popup = document.createElement('div');
  popup.id = 'fun-limitator-popup';
  popup.innerHTML = `
    <div class="popup-overlay">
      <div class="popup-content">
        <div class="warning-icon">⚠️</div>
        <h2>Attention !</h2>
        <p>Es-tu sûr de vouloir gaspiller ton temps sur ce site ?</p>
        <div class="countdown-container">
          <div class="countdown-circle">
            <span id="countdown-text">10</span>
          </div>
        </div>
        <div class="button-container">
          <button id="cancel-btn" class="cancel-btn">Non, retourner à l'accueil</button>
          <button id="continue-btn" class="continue-btn" disabled>Oui, je continue (10s)</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);
  
  // Empêcher le défilement de la page
  document.body.style.overflow = 'hidden';
  
  startCountdown();
  attachEventListeners();
}

// Gérer le compte à rebours
function startCountdown() {
  let timeLeft = 10;
  const countdownText = document.getElementById('countdown-text');
  const continueBtn = document.getElementById('continue-btn');
  
  const countdownInterval = setInterval(() => {
    timeLeft--;
    countdownText.textContent = timeLeft;
    continueBtn.textContent = timeLeft > 0 ? `Oui, je continue (${timeLeft}s)` : 'Oui, je continue';
    
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      continueBtn.disabled = false;
      continueBtn.classList.add('enabled');
      countdownText.textContent = '✓';
    }
  }, 1000);
}

// Attacher les événements aux boutons
function attachEventListeners() {
  const cancelBtn = document.getElementById('cancel-btn');
  const continueBtn = document.getElementById('continue-btn');
  
  cancelBtn.addEventListener('click', () => {
    // Rediriger vers une nouvelle page vide
    window.location.href = 'about:blank';
  });
  
  continueBtn.addEventListener('click', () => {
    if (!continueBtn.disabled) {
      removePopup();
    }
  });
}

// Supprimer la popup
function removePopup() {
  const popup = document.getElementById('fun-limitator-popup');
  if (popup) {
    popup.remove();
    document.body.style.overflow = '';
  }
}

// Initialisation
async function init() {
  const currentUrl = window.location.href;
  
  try {
    // Récupérer les sites bloqués depuis le storage ou utiliser les sites par défaut
    const result = await chrome.storage.sync.get(['blockedSites']);
    const blockedSites = result.blockedSites || DEFAULT_BLOCKED_SITES;
    
    if (shouldBlockSite(currentUrl, blockedSites)) {
      createWarningPopup();
    }
  } catch (error) {
    console.log('Erreur lors du chargement des sites bloqués:', error);
    // Utiliser les sites par défaut en cas d'erreur
    if (shouldBlockSite(currentUrl, DEFAULT_BLOCKED_SITES)) {
      createWarningPopup();
    }
  }
}

// Démarrer quand la page est chargée
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}