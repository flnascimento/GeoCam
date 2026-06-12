import { initCamera } from './camera.js';
import { startLocationWatch, currentLocation, currentObra } from './location.js';
import { initSettings, obras, appSettings } from './settings.js';
import { initPhoto } from './photo.js';

// PWA Support
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('Nova versão disponível. Deseja atualizar?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App pronto para funcionar offline.');
      },
    });

    // Lógica do botão de atualizar nas configurações
    document.getElementById('btn-update').addEventListener('click', () => {
      const btn = document.getElementById('btn-update');
      const originalText = btn.innerText;
      btn.innerText = "Buscando...";
      btn.disabled = true;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update().then(() => {
              alert('Busca concluída! Se houver uma nova versão, o aviso de recarregar aparecerá.');
              btn.innerText = originalText;
              btn.disabled = false;
            }).catch(() => {
              alert('Nenhuma atualização encontrada ou sem internet.');
              btn.innerText = originalText;
              btn.disabled = false;
            });
          } else {
            alert('App ainda não registrou o modo offline (certifique-se de estar em ambiente seguro/HTTPS real).');
            btn.innerText = originalText;
            btn.disabled = false;
          }
        }).catch(() => {
          alert('Erro interno ao buscar atualizações.');
          btn.innerText = originalText;
          btn.disabled = false;
        });
      } else {
        alert('App rodando sem suporte a Service Workers (Offline/Atualizações).');
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
  });
}

export let currentUIRotation = 0;

function updateUIOrientation(rot) {
  if (currentUIRotation === rot) return;
  currentUIRotation = rot;
  
  const logo = document.getElementById('overlay-logo');
  const metadata = document.querySelector('.metadata-preview');
  
  if (rot === 0) {
    logo.style.transform = `rotate(0deg)`;
    logo.style.top = '0';
    logo.style.left = '0';
    logo.style.right = 'auto';
    logo.style.bottom = 'auto';
    logo.style.transformOrigin = 'top left';

    metadata.style.transform = `rotate(0deg)`;
    metadata.style.bottom = '5px';
    metadata.style.right = '5px';
    metadata.style.top = 'auto';
    metadata.style.left = 'auto';
    metadata.style.transformOrigin = 'bottom right';
    metadata.style.textAlign = 'right';
  } else if (rot === 90) {
    logo.style.transform = `rotate(90deg)`;
    logo.style.top = '0';
    logo.style.right = '0';
    logo.style.left = 'auto';
    logo.style.bottom = 'auto';
    logo.style.transformOrigin = 'top right';

    metadata.style.transform = `rotate(90deg)`;
    metadata.style.bottom = '5px';
    metadata.style.left = '5px';
    metadata.style.top = 'auto';
    metadata.style.right = 'auto';
    metadata.style.transformOrigin = 'bottom left';
    metadata.style.textAlign = 'left';
  } else if (rot === -90) {
    logo.style.transform = `rotate(-90deg)`;
    logo.style.bottom = '0';
    logo.style.left = '0';
    logo.style.top = 'auto';
    logo.style.right = 'auto';
    logo.style.transformOrigin = 'bottom left';

    metadata.style.transform = `rotate(-90deg)`;
    metadata.style.top = '5px';
    metadata.style.right = '5px';
    metadata.style.bottom = 'auto';
    metadata.style.left = 'auto';
    metadata.style.transformOrigin = 'top right';
    metadata.style.textAlign = 'right';
  }
}

let smoothedTilt = 0;

// Lógica de Nivelamento e Rotação
window.addEventListener('deviceorientation', (event) => {
  if (event.gamma !== null) {
    let rawTilt = event.gamma; 
    
    // Filtro Passa-Baixa para evitar a "tremedeira" do sensor
    smoothedTilt = smoothedTilt + (rawTilt - smoothedTilt) * 0.15;
    let tilt = smoothedTilt;
    
    const levelIcon = document.getElementById('level-icon');
    const levelText = document.getElementById('device-level-text');
    
    levelIcon.style.transform = `rotate(${tilt}deg)`;
    
    let color = "#fff";
    if (Math.abs(tilt) < 2) {
      color = "#0f0";
    }
    
    levelText.innerText = `${Math.abs(tilt).toFixed(1)}°`;
    levelText.style.color = color;
    levelIcon.querySelector('line').setAttribute('stroke', color);
    
    let rot = 0;
    if (tilt < -45) rot = 90;
    else if (tilt > 45) rot = -90;
    
    updateUIOrientation(rot);
  }
});

let empresaNome = "EMPRESA";

async function fetchEmpresa() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}Nome.json`);
    if (res.ok) {
      const data = await res.json();
      empresaNome = data.nome;
    }
  } catch (e) {
    console.warn("Não foi possível carregar Nome.json", e);
  }
}

function updateMetadataOverlay() {
  const previewObra = document.getElementById('preview-obra');
  const previewDate = document.getElementById('preview-date');
  const previewUtm = document.getElementById('preview-utm');
  const previewLabel = document.getElementById('preview-label');
  const previewEmpresa = document.getElementById('preview-empresa');
  const logoImg = document.getElementById('overlay-logo');

  // Atualiza Date
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const monthStr = MONTHS[now.getMonth()];
  previewDate.innerText = `${pad(now.getDate())} de ${monthStr.toLowerCase()} de ${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Atualiza Obra e UTM
  if (currentObra) {
    previewObra.innerText = currentObra.name.toUpperCase();
  } else {
    previewObra.innerText = "-";
  }

  if (currentLocation) {
    previewUtm.innerText = `${currentLocation.zone} ${currentLocation.utmX.toFixed(0)} ${currentLocation.utmY.toFixed(0)}`;
  } else {
    previewUtm.innerText = `Aguardando GPS...`;
  }

  // Label e Empresa
  previewLabel.innerText = appSettings.customLabel || "";
  previewEmpresa.innerText = `#${empresaNome}`;

  // Logo View
  logoImg.style.opacity = appSettings.logoOpacity / 100;
  logoImg.style.width = `${appSettings.logoSize}%`;
}

async function start() {
  await fetchEmpresa();
  await initCamera();
  
  initSettings(() => {
    updateMetadataOverlay();
  });
  
  startLocationWatch(obras, (loc, obra) => {
    updateMetadataOverlay();
  });
  
  initPhoto(empresaNome);

  // Loop para atualizar relógio e overlay na tela
  setInterval(updateMetadataOverlay, 1000);
}

// Iniciar a aplicação
start();
