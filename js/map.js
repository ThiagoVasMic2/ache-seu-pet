async function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined') return;
    if (mapElement.dataset.initialized === 'true' || mapElement.dataset.loading === 'true') return;
    mapElement.dataset.loading = 'true';

    try {
        await loadPublicAnimals();
    } catch (error) {
        console.error('Could not load reports for the map:', error);
        const notice = document.getElementById('map-notice');
        if (notice) notice.textContent = 'Não foi possível carregar as ocorrências para o mapa.';
        delete mapElement.dataset.loading;
        return;
    }

    const map = L.map('map').setView([-15.7801, -47.9292], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const icons = {
        Perdido: L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#D64545;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        Encontrado: L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#245C45;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        'Em Adoção': L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#E98A16;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        'Resgate solicitado': L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#173247;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]}),
        'Animal silvestre': L.divIcon({ className: 'leaflet-marker-icon leaflet-zoom-animated', html: '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#4E8B68;border: 2px solid #ffffff;"></span>', iconSize: [22, 22], iconAnchor: [11, 11]})
    };

    let markers = [];

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
    mapElement.dataset.initialized = 'true';
    delete mapElement.dataset.loading;
}

// keep previous behavior when page loads directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}
