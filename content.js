// Liste des sites par défaut à bloquer
const DEFAULT_BLOCKED_SITES = [
  { url: 'facebook.com', exclude: ['facebook.com/messages'] },
  { url: 'youtube.com', exclude: [] },
  { url: 'instagram.com', exclude: [] }
];

// Variables globales pour gérer l'état des médias
let originalMediaStates = [];
let wasTabMuted = false;
let muteInterval = null;
let youtubePlayer = null;
let mediaListeners = new Map(); // Pour stocker les listeners et pouvoir les supprimer

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

// Vérifier si ce site a déjà été autorisé dans cette session
function isAlreadyAllowed(currentUrl) {
  const domain = new URL(currentUrl).hostname;
  const sessionKey = `fun-limitator-allowed-${domain}`;
  return sessionStorage.getItem(sessionKey) === 'true';
}

// Marquer le site comme autorisé pour cette session
function markAsAllowed(currentUrl) {
  const domain = new URL(currentUrl).hostname;
  const sessionKey = `fun-limitator-allowed-${domain}`;
  sessionStorage.setItem(sessionKey, 'true');
}


// Détecter et mettre en pause tous les médias + muter de manière agressive
function pauseAndMuteAllMedia() {
  originalMediaStates = [];
  
  // Fonction pour traiter un média
  function processMedia(media, index) {
    // Sauvegarder l'état original si pas déjà fait
    if (!originalMediaStates[index]) {
      originalMediaStates[index] = {
        element: media,
        wasPlaying: !media.paused,
        autoplay: media.autoplay,
        wasMuted: media.muted,
        volume: media.volume,
        currentTime: media.currentTime
      };
    }
    
    // Actions de mute et pause agressives
    try {
      if (!media.paused) {
        media.pause();
      }
      media.muted = true;
      media.volume = 0;
      
      // Créer les event listeners avec référence pour pouvoir les supprimer
      const playListener = function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        media.pause();
        media.muted = true;
        media.volume = 0;
      };
      
      const volumeListener = function(e) {
        if (!media.muted) {
          media.muted = true;
          media.volume = 0;
        }
      };
      
      // Ajouter les listeners
      media.addEventListener('play', playListener, { capture: true });
      media.addEventListener('volumechange', volumeListener, { capture: true });
      
      // Stocker les listeners pour pouvoir les supprimer plus tard
      if (!mediaListeners.has(media)) {
        mediaListeners.set(media, []);
      }
      mediaListeners.get(media).push(
        { event: 'play', listener: playListener },
        { event: 'volumechange', listener: volumeListener }
      );
      
    } catch (error) {
      console.log('Erreur lors du traitement du média:', error);
    }
  }
  
  // Traiter tous les médias existants
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(processMedia);
  
  // Recherche spécifique pour YouTube
  if (window.location.hostname.includes('youtube.com')) {
    // Essayer de trouver le player YouTube
    const youtubeVideos = document.querySelectorAll('[data-youtube-player], .html5-main-video, #movie_player video');
    youtubeVideos.forEach(processMedia);
    
    // Hook dans l'API YouTube si disponible
    try {
      if (window.YT && window.YT.Player) {
        const originalGetPlayerState = window.YT.Player.prototype.getPlayerState;
        window.YT.Player.prototype.getPlayerState = function() {
          this.mute();
          this.pauseVideo();
          return originalGetPlayerState.call(this);
        };
      }
    } catch (error) {
      console.log('Impossible d\'hooker l\'API YouTube:', error);
    }
  }
  
  // Observer agressif pour les nouveaux médias
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Vérifier les médias directs et imbriqués
          const newMediaList = [];
          if (node.matches && node.matches('video, audio')) {
            newMediaList.push(node);
          }
          if (node.querySelectorAll) {
            const nestedMedia = node.querySelectorAll('video, audio');
            newMediaList.push(...nestedMedia);
          }
          
          newMediaList.forEach(media => processMedia(media, originalMediaStates.length));
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Forcer le mute en continu toutes les 100ms pendant que la popup est active
  muteInterval = setInterval(() => {
    const allCurrentMedia = document.querySelectorAll('video, audio');
    allCurrentMedia.forEach(media => {
      if (!media.muted || media.volume > 0) {
        media.muted = true;
        media.volume = 0;
      }
      if (!media.paused) {
        media.pause();
      }
    });
  }, 100);
  
  // Sauvegarder l'observer pour pouvoir l'arrêter plus tard
  window.funLimitatorObserver = observer;
}

// Créer la popup d'avertissement
function createWarningPopup() {
  // Vérifier si la popup existe déjà
  if (document.getElementById('fun-limitator-popup')) {
    return;
  }

  // Muter l'onglet et mettre en pause tous les médias
  pauseAndMuteAllMedia();

  const popup = document.createElement('div');
  popup.id = 'fun-limitator-popup';
  popup.innerHTML = `
    <div class="fun-limitator-overlay-wrapper">
      <div class="fun-limitator-content-wrapper">
        <div class="fun-limitator-warning-icon">⚠️</div>
        <div class="fun-limitator-title">Attention !</div>
        <div class="fun-limitator-description">Es-tu sûr de vouloir gaspiller ton temps sur ce site ?</div>
        <div class="fun-limitator-countdown-container">
          <div class="fun-limitator-countdown-circle">
            <span id="countdown-text">10</span>
          </div>
        </div>
        <div class="fun-limitator-button-container">
          <button id="cancel-btn" class="fun-limitator-button fun-limitator-cancel-btn">Non, retourner à l'accueil</button>
          <button id="continue-btn" class="fun-limitator-button fun-limitator-continue-btn" disabled>Oui, je continue (10s)</button>
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
      continueBtn.classList.add('fun-limitator-enabled');
      countdownText.textContent = '✓';
    }
  }, 1000);
}

// Relancer les médias et restaurer le son
function resumeMedia() {
  // Arrêter l'intervalle de mute forcé
  if (muteInterval) {
    clearInterval(muteInterval);
    muteInterval = null;
  }
  
  // Arrêter l'observer de médias
  if (window.funLimitatorObserver) {
    window.funLimitatorObserver.disconnect();
    delete window.funLimitatorObserver;
  }
  
  // CRUCIAL : Supprimer tous les event listeners bloquants
  mediaListeners.forEach((listeners, media) => {
    listeners.forEach(({ event, listener }) => {
      try {
        media.removeEventListener(event, listener, { capture: true });
      } catch (error) {
        console.log('Erreur lors de la suppression du listener:', error);
      }
    });
  });
  
  // Vider la map des listeners
  mediaListeners.clear();
  
  // Restaurer l'état des médias existants
  originalMediaStates.forEach(mediaState => {
    const { element, wasPlaying, autoplay, wasMuted, volume, currentTime } = mediaState;
    
    try {
      // Restaurer le son si le média n'était pas muté à l'origine
      if (!wasMuted) {
        element.muted = false;
        element.volume = volume || 1;
      }
      
      // Restaurer la position si elle avait changé
      if (currentTime && Math.abs(element.currentTime - currentTime) > 1) {
        element.currentTime = currentTime;
      }
      
      // Si le média était en train de jouer ou avait l'autoplay, le relancer
      if (wasPlaying || autoplay) {
        setTimeout(() => {
          element.play().catch(e => {
            // Certains navigateurs bloquent l'autoplay, c'est normal
            console.log('Impossible de relancer automatiquement le média:', e);
          });
        }, 100);
      }
    } catch (error) {
      console.log('Erreur lors de la restauration du média:', error);
    }
  });
  
  // Réactiver l'autoplay et le son pour les nouveaux médias après un délai
  setTimeout(() => {
    const allMedia = document.querySelectorAll('video, audio');
    allMedia.forEach(media => {
      try {
        // Restaurer le son des médias qui étaient mutés par notre extension
        const wasOriginallyMuted = originalMediaStates.some(state => state.element === media && state.wasMuted);
        if (media.muted && !wasOriginallyMuted) {
          media.muted = false;
          if (media.volume === 0) {
            media.volume = 1;
          }
        }
        
        if (media.autoplay && media.paused) {
          media.play().catch(e => {
            console.log('Autoplay bloqué par le navigateur:', e);
          });
        }
      } catch (error) {
        console.log('Erreur lors de la restauration automatique:', error);
      }
    });
  }, 300);
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
      // Marquer le site comme autorisé pour cette session
      markAsAllowed(window.location.href);
      
      // Relancer les médias
      resumeMedia();
      
      // Supprimer la popup
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
  
  // Vérifier si ce site a déjà été autorisé dans cette session
  if (isAlreadyAllowed(currentUrl)) {
    return; // Ne pas afficher la popup
  }
  
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