// Sites par défaut
const DEFAULT_BLOCKED_SITES = [
  { url: 'facebook.com', exclude: ['facebook.com/messages'] },
  { url: 'youtube.com', exclude: [] },
  { url: 'instagram.com', exclude: [] }
];

let currentSites = [];

// Éléments DOM
const sitesList = document.getElementById('sites-list');
const siteUrlInput = document.getElementById('site-url');
const excludeUrlsTextarea = document.getElementById('exclude-urls');
const addSiteBtn = document.getElementById('add-site-btn');
const resetBtn = document.getElementById('reset-btn');
const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');

// Charger les sites depuis le storage
async function loadSites() {
  try {
    const result = await chrome.storage.sync.get(['blockedSites']);
    currentSites = result.blockedSites || DEFAULT_BLOCKED_SITES;
    renderSites();
  } catch (error) {
    console.error('Erreur lors du chargement des sites:', error);
    currentSites = DEFAULT_BLOCKED_SITES;
    renderSites();
  }
}

// Afficher les sites dans l'interface
function renderSites() {
  sitesList.innerHTML = '';
  
  currentSites.forEach((site, index) => {
    const siteElement = document.createElement('div');
    siteElement.className = 'site-item';
    
    const excludesHtml = site.exclude.length > 0 
      ? `<div class="site-excludes">
          <strong>Exclusions:</strong> 
          ${site.exclude.map(exclude => `<span class="exclude-item">${exclude}</span>`).join(' ')}
         </div>`
      : '<div class="site-excludes"><em>Aucune exclusion</em></div>';
    
    siteElement.innerHTML = `
      <div class="site-header">
        <div class="site-url">${site.url}</div>
        <button class="delete-btn" data-index="${index}">Supprimer</button>
      </div>
      ${excludesHtml}
    `;
    
    sitesList.appendChild(siteElement);
  });
  
  // Attacher les événements de suppression
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteSite);
  });
}

// Ajouter un nouveau site
function addSite() {
  const url = siteUrlInput.value.trim();
  const excludeUrls = excludeUrlsTextarea.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
  
  if (!url) {
    showMessage('Veuillez saisir une URL de site', 'error');
    return;
  }
  
  // Vérifier si le site existe déjà
  if (currentSites.some(site => site.url === url)) {
    showMessage('Ce site est déjà dans la liste', 'error');
    return;
  }
  
  // Ajouter le nouveau site
  currentSites.push({
    url: url,
    exclude: excludeUrls
  });
  
  // Réinitialiser le formulaire
  siteUrlInput.value = '';
  excludeUrlsTextarea.value = '';
  
  renderSites();
  showMessage('Site ajouté avec succès', 'success');
}

// Supprimer un site
function deleteSite(event) {
  const index = parseInt(event.target.dataset.index);
  const site = currentSites[index];
  
  if (confirm(`Êtes-vous sûr de vouloir supprimer "${site.url}" de la liste ?`)) {
    currentSites.splice(index, 1);
    renderSites();
    showMessage('Site supprimé avec succès', 'success');
  }
}

// Réinitialiser aux valeurs par défaut
function resetToDefault() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser la liste aux sites par défaut ? Toutes vos modifications seront perdues.')) {
    currentSites = [...DEFAULT_BLOCKED_SITES];
    renderSites();
    showMessage('Liste réinitialisée aux valeurs par défaut', 'success');
  }
}

// Sauvegarder les modifications
async function saveChanges() {
  try {
    await chrome.storage.sync.set({ blockedSites: currentSites });
    showMessage('Modifications sauvegardées avec succès', 'success');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showMessage('Erreur lors de la sauvegarde', 'error');
  }
}

// Afficher un message de statut
function showMessage(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // Masquer le message après 3 secondes
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 3000);
}

// Événements
addSiteBtn.addEventListener('click', addSite);
resetBtn.addEventListener('click', resetToDefault);
saveBtn.addEventListener('click', saveChanges);

// Permettre d'ajouter un site en appuyant sur Entrée
siteUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSite();
  }
});

// Charger les sites au démarrage
document.addEventListener('DOMContentLoaded', loadSites);