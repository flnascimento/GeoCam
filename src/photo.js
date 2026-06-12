import { currentLocation, currentObra } from './location.js';
import { appSettings } from './settings.js';
import { currentUIRotation } from './main.js';

let empresaNome = "EMPRESA";

export async function initPhoto(nomeEmpresa) {
  empresaNome = nomeEmpresa;
  
  const btnCapture = document.getElementById('btn-capture');
  btnCapture.addEventListener('click', takePhoto);
}

function pad(num) {
  return num.toString().padStart(2, '0');
}

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function getFileNameAndDateText() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const monthStr = MONTHS[monthIdx];
  const day = pad(now.getDate());
  
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  
  const dateText = `${day} de ${monthStr.toLowerCase()} de ${year} ${h}:${m}:${s}`;
  
  // Nome do arquivo: NOME_DA_OBRA_ANO_MES_DIA_DD-MM-AA_HH-MM-SS.jpg
  const obraStr = currentObra ? currentObra.name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_").toUpperCase() : "SEM_OBRA";
  
  const shortYear = year.toString().slice(-2);
  const fileName = `${obraStr}_${year}_${pad(monthIdx+1)}_${monthStr}_${day}_OBRA_${day}-${pad(monthIdx+1)}-${shortYear}_${h}-${m}-${s}.jpg`;
  
  return { dateText, fileName };
}

export function takePhoto() {
  const video = document.getElementById('camera-preview');
  const canvas = document.getElementById('photo-canvas');
  const ctx = canvas.getContext('2d');
  
  const W = 1080;
  const H = 1080;
  
  // Recorte da imagem do vídeo para ficar 1080x1080 (Crop central)
  const videoAspect = video.videoWidth / video.videoHeight;
  const canvasAspect = W / H;
  
  let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
  
  if (videoAspect > canvasAspect) {
    drawHeight = H;
    drawWidth = video.videoWidth * (H / video.videoHeight);
    offsetX = (W - drawWidth) / 2;
  } else {
    drawWidth = W;
    drawHeight = video.videoHeight * (W / video.videoWidth);
    offsetY = (H - drawHeight) / 2;
  }
  
  // Limpar e desenhar vídeo
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
  
  ctx.save();
  
  // Rotate context to match UI rotation so the photo saves upright
  if (currentUIRotation === 90) {
    ctx.translate(W, 0);
    ctx.rotate(90 * Math.PI / 180);
  } else if (currentUIRotation === -90) {
    ctx.translate(0, H);
    ctx.rotate(-90 * Math.PI / 180);
  }
  
  // Desenhar Logo
  const logoImg = document.getElementById('overlay-logo');
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    ctx.globalAlpha = appSettings.logoOpacity / 100;
    
    // Calcula o tamanho da logo (100% = metade do canvas = 540px largura)
    const baseWidth = W * 0.5;
    const sizeMultiplier = appSettings.logoSize / 100;
    const finalLogoWidth = baseWidth * sizeMultiplier;
    const finalLogoHeight = logoImg.naturalHeight * (finalLogoWidth / logoImg.naturalWidth);
    
    ctx.drawImage(logoImg, 0, 0, finalLogoWidth, finalLogoHeight);
    ctx.globalAlpha = 1.0; // Reset
  }
  
  // Textos Inferior Direito
  const { dateText, fileName } = getFileNameAndDateText();
  
  const lines = [];
  lines.push(currentObra ? currentObra.name.toUpperCase() : "-");
  lines.push(dateText);
  if (currentLocation) {
    lines.push(`${currentLocation.zone} ${currentLocation.utmX.toFixed(0)} ${currentLocation.utmY.toFixed(0)}`);
  } else {
    lines.push(`Aguardando GPS...`);
  }
  if (appSettings.customLabel && appSettings.customLabel.trim() !== '') {
    lines.push(appSettings.customLabel);
  }
  lines.push(`#${empresaNome}`);
  
  // Configurações de fonte
  ctx.font = 'bold 14px "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.letterSpacing = '0px';
  
  const lineSpacing = 16;
  let startY = H - 5; // Margem inferior bem pequena
  
  // Desenha os textos de baixo para cima
  for (let i = lines.length - 1; i >= 0; i--) {
    const text = lines[i];
    
    // Contorno para legibilidade
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.strokeText(text, W - 5, startY);
    
    // Texto
    ctx.fillStyle = 'white';
    ctx.fillText(text, W - 5, startY);
    
    startY -= lineSpacing;
  }

  ctx.restore();
  
  // Download do arquivo
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.95);
}
