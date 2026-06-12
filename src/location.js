import proj4 from 'proj4';

export let currentLocation = null;
export let currentObra = null;

// Helper para calcular Zona UTM
function getUTMZone(lon) {
  return Math.floor((lon + 180) / 6) + 1;
}

// Verifica se a coordenada está no hemisfério sul
function isSouthernHemisphere(lat) {
  return lat < 0;
}

// Distância em metros entre duas coordenadas UTM (aproximação Euclidiana simples na mesma zona)
function getDistance(utm1, utm2) {
  if (!utm1 || !utm2) return Infinity;
  const dx = utm1.x - utm2.x;
  const dy = utm1.y - utm2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function startLocationWatch(obras, onUpdate) {
  if (!navigator.geolocation) {
    console.error("Geolocalização não suportada.");
    return;
  }

  navigator.geolocation.watchPosition((position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    
    const zone = getUTMZone(lon);
    const isSouth = isSouthernHemisphere(lat);
    
    function getUTMLetter(lat) {
      if (lat < -80 || lat > 84) return ''; 
      const letters = 'CDEFGHJKLMNPQRSTUVWXX';
      const idx = Math.floor((lat + 80) / 8);
      return letters[idx];
    }
    
    // Define a projeção UTM local baseada na zona
    const projUTM = `+proj=utm +zone=${zone} ${isSouth ? '+south' : ''} +datum=WGS84 +units=m +no_defs`;
    const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
    
    const [x, y] = proj4(wgs84, projUTM, [lon, lat]);
    
    const zoneLetter = getUTMLetter(lat);
    
    currentLocation = {
      lat, lon,
      utmX: x,
      utmY: y,
      zone: `${zone}${zoneLetter}`,
      timestamp: position.timestamp
    };

    // Verificar se estamos dentro de alguma obra
    currentObra = null;
    for (const obra of obras) {
      // Ignora zonas completamente incompatíveis
      // Mas considerando que usuários podem ter salvo a zona como '24S' na versão velha
      // Vamos focar no número da zona, ou então exigir match exato se a formatação for a mesma.
      const isSameZone = (obra.zone === currentLocation.zone) || 
                         (obra.zone.slice(0,-1) === currentLocation.zone.slice(0,-1));

      if (isSameZone && obra.utmX && obra.utmY) {
        // Checagem de Máximo e Mínimo (Bounding Box Quadrada)
        const inBoundsX = Math.abs(currentLocation.utmX - obra.utmX) <= obra.radius;
        const inBoundsY = Math.abs(currentLocation.utmY - obra.utmY) <= obra.radius;

        if (inBoundsX && inBoundsY) {
          currentObra = obra;
          break; // Pega a primeira que bater
        }
      }
    }

    onUpdate(currentLocation, currentObra);
  }, 
  (error) => {
    console.error("Erro ao obter localização:", error);
  }, 
  {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000
  });
}
