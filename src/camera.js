export async function initCamera() {
  const video = document.getElementById('camera-preview');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Traseira
        width: { ideal: 1080 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    
    video.srcObject = stream;
  } catch (err) {
    console.error('Erro ao acessar a câmera:', err);
    alert('Não foi possível acessar a câmera. Verifique as permissões.');
  }
}
