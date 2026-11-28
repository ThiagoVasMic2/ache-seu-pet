function renderHomeCards() {
    const grid = document.querySelector('.home-animal-grid');
    if (!grid) return;
    const featured = achePetApp.animals.filter(item => item.status === 'Em Adoção').slice(0, 4);
    if (!featured.length) {
        grid.innerHTML = '<p>Ainda não há animais cadastrados para adoção.</p>';
        return;
    }

    grid.innerHTML = featured.map(animal => `
        <article class="animal-card">
            <img src="${escapeHTML(resolveAssetPath(animal.image))}" alt="Foto de ${escapeHTML(animal.name)}">
            <div class="animal-card-content">
                <div>
                    <h3>${animal.name}</h3>
                    <span class="status-badge ${setStatusClass(animal.status)}">${animal.status}</span>
                </div>
                <p>${animal.species} • ${animal.city}, ${animal.state}</p>
                <a href="#animal?id=${animal.id}">Quero conhecer</a>
            </div>
        </article>
    `).join('');
}

function renderPartnerPreview() {
    const container = document.querySelector('.home-partner-grid');
    if (!container) return;
    const list = achePetApp.partners.slice(0, 4);
    container.innerHTML = list.map(partner => `
        <article class="partner-card">
            <h3>${partner.name}</h3>
            <p class="partner-meta">${partner.type} · ${partner.city}</p>
            <p>${partner.description}</p>
            <a href="#parceiros">Ver parceiro</a>
        </article>
    `).join('');
}

function handleSearchSubmit() {
    const form = document.getElementById('search-form');
    if (!form || form.dataset.searchInitialized === 'true') return;

    form.dataset.searchInitialized = 'true';
    form.addEventListener('submit', event => {
        event.preventDefault();
        const params = new URLSearchParams(new FormData(form));
        const query = params.toString();
        window.location.hash = query ? `animais?${query}` : 'animais';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderHomeCards();
    renderPartnerPreview();
    handleSearchSubmit();
});
