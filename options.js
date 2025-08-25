// Sites par défaut
const DEFAULT_BLOCKED_SITES = [
  { url: 'facebook.com', exclude: ['facebook.com/messages'] },
  { url: 'youtube.com', exclude: [] },
  { url: 'instagram.com', exclude: [] }
];

// Configuration par défaut de la plage horaire
const DEFAULT_SCHEDULE = {
  enabled: false,
  startTime: '09:00',
  endTime: '18:00'
};

let currentSites = [];
let currentSchedule = { ...DEFAULT_SCHEDULE };

// Éléments DOM
const sitesList = document.getElementById('sites-list');
const siteUrlInput = document.getElementById('site-url');
const excludeUrlsTextarea = document.getElementById('exclude-urls');
const addSiteBtn = document.getElementById('add-site-btn');
const resetBtn = document.getElementById('reset-btn');
const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');

// Éléments DOM pour la plage horaire
const scheduleEnabled = document.getElementById('schedule-enabled');
const scheduleInputs = document.getElementById('schedule-inputs');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const schedulePreviewText = document.getElementById('schedule-preview-text');

// Charger les données depuis le storage
async function loadData() {
  try {
    const result = await chrome.storage.sync.get(['blockedSites', 'schedule']);
    currentSites = result.blockedSites || DEFAULT_BLOCKED_SITES;
    currentSchedule = result.schedule || DEFAULT_SCHEDULE;
    renderSites();
    renderSchedule();
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    currentSites = DEFAULT_BLOCKED_SITES;
    currentSchedule = DEFAULT_SCHEDULE;
    renderSites();
    renderSchedule();
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

// Afficher la configuration de plage horaire
function renderSchedule() {
  scheduleEnabled.checked = currentSchedule.enabled;
  startTimeInput.value = currentSchedule.startTime;
  endTimeInput.value = currentSchedule.endTime;
  
  updateScheduleInputs();
  updateSchedulePreview();
}

// Mettre à jour l'état des inputs de plage horaire
function updateScheduleInputs() {
  if (currentSchedule.enabled) {
    scheduleInputs.classList.remove('disabled');
    startTimeInput.disabled = false;
    endTimeInput.disabled = false;
  } else {
    scheduleInputs.classList.add('disabled');
    startTimeInput.disabled = true;
    endTimeInput.disabled = true;
  }
}

// Mettre à jour l'aperçu de la plage horaire
function updateSchedulePreview() {
  if (currentSchedule.enabled) {
    schedulePreviewText.textContent = `Extension active de ${currentSchedule.startTime} à ${currentSchedule.endTime}`;
  } else {
    schedulePreviewText.textContent = 'Extension active en permanence';
  }
}

// Gérer le changement de statut de la plage horaire
function handleScheduleEnabledChange() {
  currentSchedule.enabled = scheduleEnabled.checked;
  updateScheduleInputs();
  updateSchedulePreview();
}

// Gérer le changement d'heure de début
function handleStartTimeChange() {
  currentSchedule.startTime = startTimeInput.value;
  updateSchedulePreview();
  
  // Vérifier que l'heure de début est avant l'heure de fin
  if (currentSchedule.startTime >= currentSchedule.endTime) {
    showMessage('L\'heure de début doit être antérieure à l\'heure de fin', 'error');
  }
}

// Gérer le changement d'heure de fin
function handleEndTimeChange() {
  currentSchedule.endTime = endTimeInput.value;
  updateSchedulePreview();
  
  // Vérifier que l'heure de fin est après l'heure de début
  if (currentSchedule.endTime <= currentSchedule.startTime) {
    showMessage('L\'heure de fin doit être postérieure à l\'heure de début', 'error');
  }
}

// Réinitialiser aux valeurs par défaut
function resetToDefault() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser aux valeurs par défaut ? Toutes vos modifications seront perdues.')) {
    currentSites = [...DEFAULT_BLOCKED_SITES];
    currentSchedule = { ...DEFAULT_SCHEDULE };
    renderSites();
    renderSchedule();
    showMessage('Configuration réinitialisée aux valeurs par défaut', 'success');
  }
}

// Sauvegarder les modifications
async function saveChanges() {
  // Valider la plage horaire
  if (currentSchedule.enabled && currentSchedule.startTime >= currentSchedule.endTime) {
    showMessage('Erreur: L\'heure de début doit être antérieure à l\'heure de fin', 'error');
    return;
  }
  
  try {
    await chrome.storage.sync.set({ 
      blockedSites: currentSites,
      schedule: currentSchedule
    });
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

// Événements pour la plage horaire
scheduleEnabled.addEventListener('change', handleScheduleEnabledChange);
startTimeInput.addEventListener('change', handleStartTimeChange);
endTimeInput.addEventListener('change', handleEndTimeChange);

// Permettre d'ajouter un site en appuyant sur Entrée
siteUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSite();
  }
});

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', loadData);