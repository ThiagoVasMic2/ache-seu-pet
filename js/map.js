const CITY_COORDINATE_CACHE_KEY = 'achepet:map-city-coordinates:v1';

function normalizeMapCity(city) {
    return String(city || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function isValidMapCoordinate(latitude, longitude) {
    if (latitude == null || latitude === '' || longitude == null || longitude === '') return false;
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function readCityCoordinateCache() {
    try {
        const cache = JSON.parse(localStorage.getItem(CITY_COORDINATE_CACHE_KEY) || '{}');
        return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
    } catch (error) {
        console.warn('Could not read the map city-coordinate cache:', error);
        return {};
    }
}

const cityCoordinateCache = readCityCoordinateCache();

function saveCityCoordinateCache() {
    try {
        localStorage.setItem(CITY_COORDINATE_CACHE_KEY, JSON.stringify(cityCoordinateCache));
    } catch (error) {
        console.warn('Could not save the map city-coordinate cache:', error);
    }
}

async function getCityCoordinates(city) {
    const normalizedCity = normalizeMapCity(city);
    if (!normalizedCity) return null;
    if (Object.prototype.hasOwnProperty.call(cityCoordinateCache, normalizedCity)) {
        return cityCoordinateCache[normalizedCity];
    }

    const query = new URLSearchParams({
        name: String(city).trim(),
        count: '10',
        language: 'pt',
        format: 'json',
        countryCode: 'BR'
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${query}`);
    if (!response.ok) throw new Error(`Geocoding request failed with status ${response.status}.`);
    const result = await response.json();
    const candidates = (Array.isArray(result.results) ? result.results : [])
        .filter(location => location.country_code === 'BR'
            && isValidMapCoordinate(location.latitude, location.longitude));
    const cityName = normalizeMapCity(String(city).split(',')[0]);
    const exactMatches = candidates.filter(location => normalizeMapCity(location.name) === cityName);
    const matches = exactMatches.length ? exactMatches : candidates.length === 1 ? candidates : [];
    matches.sort((first, second) => (second.population || 0) - (first.population || 0));
    const location = matches[0];
    if (!location) return null;

    const coordinates = {
        lat: Number(location.latitude),
        lng: Number(location.longitude)
    };
    cityCoordinateCache[normalizedCity] = coordinates;
    saveCityCoordinateCache();
    return coordinates;
}

async function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined') return;
    if (mapElement.dataset.initialized === 'true' || mapElement.dataset.loading === 'true') return;
    mapElement.dataset.loading = 'true';

    let animals;
    try {
        animals = await loadPublicAnimals();
    } catch (error) {
        console.error('Could not load reports for the map:', error);
        const notice = document.getElementById('map-notice');
        if (notice) notice.textContent = 'Não foi possível carregar as ocorrências para o mapa.';
        delete mapElement.dataset.loading;
        return;
    }

    const map = L.map('map').setView([-15.7801, -47.9292], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors · Localização aproximada: <a href="https://open-meteo.com/">Open-Meteo</a> / <a href="https://www.geonames.org/">GeoNames</a>'
    }).addTo(map);

    const icons = {
        Perdido: L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#D64545;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        Encontrado: L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#245C45;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        'Em Adoção': L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#E98A16;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        'Resgate solicitado': L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#173247;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        'Animal silvestre': L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#4E8B68;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]})
    };

    let markers = [];
    let geocodingFailures = 0;
    const mapNotice = document.getElementById('map-notice');

    const cities = new Map();
    animals.forEach(animal => {
        if (isValidMapCoordinate(animal.lat, animal.lng)) return;
        const city = String(animal.city || '').trim();
        const key = normalizeMapCity(city);
        if (key && !cities.has(key)) cities.set(key, city);
    });

    if (cities.size && mapNotice) {
        mapNotice.textContent = 'Localizando as cidades das ocorrências…';
    }

    const coordinatesByCity = new Map();
    await Promise.all(Array.from(cities, async ([key, city]) => {
        try {
            coordinatesByCity.set(key, await getCityCoordinates(city));
        } catch (error) {
            geocodingFailures += 1;
            console.error(`Could not locate the city "${city}" for the map:`, error);
        }
    }));

    animals.forEach(animal => {
        if (isValidMapCoordinate(animal.lat, animal.lng)) return;
        const coordinates = coordinatesByCity.get(normalizeMapCity(animal.city));
        if (!coordinates) return;
        animal.lat = coordinates.lat;
        animal.lng = coordinates.lng;
    });

    function buildPopup(animal) {
        const imagePath = escapeHTML(resolveAssetPath(animal.image));
        return `
            <div style="max-width:220px;">
                <img src="${imagePath}" alt="${escapeHTML(animal.name)}" style="width:100%;border-radius:12px;margin-bottom:0.75rem;" loading="lazy">
                <strong>${escapeHTML(animal.name)}</strong>
                <p style="margin:0.35rem 0 0.45rem;color:#4D5B6B;font-size:0.95rem;">${escapeHTML(animal.species)} • ${escapeHTML(animal.status)}</p>
                <p style="margin:0 0 0.6rem;font-size:0.95rem;">${escapeHTML(animal.region || 'Região não informada')}, ${escapeHTML(animal.city)}</p>
                <a href="#animal?id=${encodeURIComponent(animal.id)}" style="display:inline-block;padding:0.6rem 0.85rem;background:#245C45;color:#fff;border-radius:999px;text-decoration:none;font-size:0.95rem;">Ver ocorrência</a>
            </div>
        `;
    }

    function addMarkers(filterStatus = '', filterType = '') {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        achePetApp.animals.forEach(animal => {
            if (filterStatus && animal.status !== filterStatus) return;
            if (filterType && animal.type !== filterType) return;
            const lat = Number(animal.lat);
            const lng = Number(animal.lng);
            if (animal.lat == null || animal.lat === '' || animal.lng == null || animal.lng === ''
                || !Number.isFinite(lat) || !Number.isFinite(lng)
                || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
            const icon = icons[animal.status] || icons['Animal silvestre'];
            const marker = L.marker([lat, lng], { icon }).addTo(map);
            marker.bindPopup(buildPopup(animal));
            markers.push(marker);
        });
    }

    const statusFilter = document.getElementById('map-filter-status');
    const typeFilter = document.getElementById('map-filter-type');

    function refreshMarkers() {
        addMarkers(statusFilter?.value || '', typeFilter?.value || '');
    }

    statusFilter?.addEventListener('change', refreshMarkers);
    typeFilter?.addEventListener('change', refreshMarkers);

    addMarkers();
    const unlocatedCount = animals.filter(animal => !isValidMapCoordinate(animal.lat, animal.lng)).length;
    if (mapNotice) {
        if (markers.length) {
            mapNotice.textContent = `Os pontos indicam o centro aproximado da cidade, não o endereço exato.${unlocatedCount ? ` ${unlocatedCount} ocorrência(s) não puderam ser localizadas.` : ''}`;
        } else if (geocodingFailures) {
            mapNotice.textContent = 'Não foi possível localizar as cidades agora. Confira sua conexão e tente abrir o mapa novamente.';
        } else if (animals.length) {
            mapNotice.textContent = 'Nenhuma cidade das ocorrências pôde ser localizada. Confira se o nome da cidade está correto.';
        } else {
            mapNotice.textContent = 'Ainda não há ocorrências cadastradas para mostrar no mapa.';
        }
    }
    mapElement.dataset.initialized = 'true';
    delete mapElement.dataset.loading;
}

// keep previous behavior when page loads directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}
