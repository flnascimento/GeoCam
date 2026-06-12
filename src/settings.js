import { currentLocation } from './location.js';

export let obras = JSON.parse(localStorage.getItem('geocam_obras') || '[]');
export let appSettings = JSON.parse(localStorage.getItem('geocam_settings') || '{"logoSize": 30, "logoOpacity": 70, "customLabel": ""}');

export function initSettings(onSettingsChange) {
  const flipContainer = document.getElementById('flip-container');
  const btnSettings = document.getElementById('btn-settings');
  const btnBack = document.getElementById('btn-back');
  
  // Elements
  const inputName = document.getElementById('obra-name');
  const inputRadius = document.getElementById('obra-radius');
  const inputUtmE = document.getElementById('obra-utm-e');
  const inputUtmN = document.getElementById('obra-utm-n');
  const inputZone = document.getElementById('obra-zone');
  
  const btnCaptureGps = document.getElementById('btn-capture-gps');
  const btnAddObra = document.getElementById('btn-add-obra');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const obrasList = document.getElementById('obras-list');
  
  let editingIndex = -1;
  
  const sliderSize = document.getElementById('logo-size');
  const sliderOpacity = document.getElementById('logo-opacity');
  const customLabel = document.getElementById('custom-label');
  
  const sizeVal = document.getElementById('logo-size-val');
  const opacityVal = document.getElementById('logo-opacity-val');

  // Load Settings
  sliderSize.value = appSettings.logoSize;
  sliderOpacity.value = appSettings.logoOpacity;
  customLabel.value = appSettings.customLabel;
  sizeVal.innerText = appSettings.logoSize;
  opacityVal.innerText = appSettings.logoOpacity;

  // Flip logic
  btnSettings.addEventListener('click', () => {
    flipContainer.classList.add('flipped');
  });
  
  btnBack.addEventListener('click', () => {
    flipContainer.classList.remove('flipped');
  });

  // Obras logic
  function renderObras() {
    obrasList.innerHTML = '';
    obras.forEach((obra, index) => {
      const li = document.createElement('li');
      li.className = 'obra-item';
      li.innerHTML = `
        <div class="obra-info">
          <strong>${obra.name}</strong>
          <span>Raio: ${obra.radius}m</span>
        </div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">
          Centro: ${obra.utmX.toFixed(0)} E, ${obra.utmY.toFixed(0)} N (${obra.zone})
        </div>
        <div style="display: flex; gap: 8px; margin-top: 5px;">
          <button class="btn-secondary btn-edit-obra" data-index="${index}" style="flex:1; margin:0;">Editar</button>
          <button class="btn-danger btn-delete-obra" data-index="${index}" style="flex:1; margin:0;">Excluir</button>
        </div>
      `;
      obrasList.appendChild(li);
    });

    document.querySelectorAll('.btn-edit-obra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        editingIndex = parseInt(e.target.getAttribute('data-index'));
        const obra = obras[editingIndex];
        
        inputName.value = obra.name;
        inputRadius.value = obra.radius;
        inputUtmE.value = obra.utmX;
        inputUtmN.value = obra.utmY;
        inputZone.value = obra.zone;
        
        btnAddObra.innerText = "Salvar Alterações";
        btnCancelEdit.style.display = 'block';
        
        // Scroll up to the form
        document.querySelector('.settings-container').scrollIntoView({behavior: 'smooth'});
      });
    });

    document.querySelectorAll('.btn-delete-obra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        obras.splice(index, 1);
        saveObras();
        renderObras();
        onSettingsChange();
      });
    });
  }

  function saveObras() {
    localStorage.setItem('geocam_obras', JSON.stringify(obras));
  }

  btnCaptureGps.addEventListener('click', () => {
    if (!currentLocation) {
      alert("Aguardando sinal de GPS... Tente novamente em alguns segundos.");
      return;
    }
    inputUtmE.value = currentLocation.utmX.toFixed(0);
    inputUtmN.value = currentLocation.utmY.toFixed(0);
    inputZone.value = currentLocation.zone;
  });

  btnCancelEdit.addEventListener('click', () => {
    resetEditState();
  });

  function resetEditState() {
    editingIndex = -1;
    inputName.value = '';
    inputRadius.value = '';
    inputUtmE.value = '';
    inputUtmN.value = '';
    inputZone.value = '';
    btnAddObra.innerText = "Cadastrar Obra";
    btnCancelEdit.style.display = 'none';
  }

  btnAddObra.addEventListener('click', () => {
    const name = inputName.value.trim();
    const radius = parseFloat(inputRadius.value);
    const utmX = parseFloat(inputUtmE.value);
    const utmY = parseFloat(inputUtmN.value);
    const zone = inputZone.value.trim();
    
    if (!name || isNaN(radius) || radius <= 0 || isNaN(utmX) || isNaN(utmY) || !zone) {
      alert("Preencha todos os campos da obra (Nome, Raio e Coordenadas UTM). Você pode usar o botão 'Capturar GPS'.");
      return;
    }

    const novaObra = { name, radius, utmX, utmY, zone };

    if (editingIndex > -1) {
      obras[editingIndex] = novaObra;
    } else {
      obras.push(novaObra);
    }

    saveObras();
    renderObras();
    resetEditState();
    onSettingsChange();
  });

  // Settings logic
  function updateAppSetting() {
    appSettings.logoSize = sliderSize.value;
    appSettings.logoOpacity = sliderOpacity.value;
    appSettings.customLabel = customLabel.value;
    
    sizeVal.innerText = appSettings.logoSize;
    opacityVal.innerText = appSettings.logoOpacity;
    
    localStorage.setItem('geocam_settings', JSON.stringify(appSettings));
    onSettingsChange();
  }

  sliderSize.addEventListener('input', updateAppSetting);
  sliderOpacity.addEventListener('input', updateAppSetting);
  customLabel.addEventListener('input', updateAppSetting);

  // Initial render
  renderObras();
}
