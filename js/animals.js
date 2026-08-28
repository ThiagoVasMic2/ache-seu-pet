function createAnimalCard(animal, useDetailsLink = true) {
    const imagePath = resolveAssetPath(animal.image);
    return `
        <article class="animal-card">
            <img src="${imagePath}" alt="Foto de ${animal.name}" loading="lazy">
            <div class="animal-card-content">
                <div>
                    <h3>${animal.name}</h3>
                    <span class="status-badge ${setStatusClass(animal.status)}">${animal.status}</span>
                </div>
                <p>${animal.species} • ${animal.city} - ${animal.region}</p>
                <div class="animal-badges">${renderAnimalBadges(animal)}</div>
                <p><small>Última atualização: ${animal.date}</small></p>
                ${useDetailsLink ? `<a href="#animal?id=${animal.id}">Ver detalhes</a>` : ''}
            </div>
        </article>
    `;
}

function renderAnimalBadges(animal) {
    const labelMap = {
        domestico: 'DOMÉSTICO',
        silvestre: 'SILVESTRE',
        rural: 'RURAL',
        exotico: 'EXÓTICO',
        nao_identificado: 'NÃO IDENTIFICADO',
        mamifero: 'MAMÍFERO',
        ave: 'AVE',
        reptil: 'RÉPTIL',
        anfibio: 'ANFÍBIO',
        peixe: 'PEIXE',
        invertebrado: 'INVERTEBRADO',
        terrestre: 'TERRESTRE',
        voa: 'VOA',
        aquatico: 'AQUÁTICO',
        semi_aquatico: 'SEMI-AQUÁTICO',
        arboricola: 'ARBORÍCOLA',
        rasteja: 'RASTEJA',
        salta: 'SALTA',
        carnivoro: 'CARNÍVORO',
        herbivoro: 'HERBÍVORO',
        onivoro: 'ONÍVORO',
        insetivoro: 'INSETÍVORO',
        detritivoro: 'DETritÍVORO',
        urbano: 'URBANO',
        floresta: 'FLORESTA',
        campo: 'CAMPO',
        rio: 'RIO',
        lago: 'LAGO',
        mar: 'MAR',
        praia: 'PRAIA',
        ambiente_domestico: 'AMBIENTE DOMÉSTICO',
        perdido: 'PERDIDO',
        encontrado: 'ENCONTRADO',
        abandonado: 'ABANDONADO',
        resgate_solicitado: 'RESGATE SOLICITADO',
        resgatado: 'RESGATADO',
        para_adocao: 'PARA ADOÇÃO',
        adotado: 'ADOTADO',
        reencontrado: 'REENCONTRADO',
        silvestre_avistado: 'SILVESTRE AVISTADO',
        ferido: 'FERIDO',
        encerrado: 'ENCERRADO'
    };

    const values = [
        ...(animal.categoryTags || [animal.category]),
        ...(animal.classTags || []),
        ...(animal.movement || []),
        ...(animal.diet || []),
        ...(animal.habitat || []),
        ...(animal.statusTags || [])
    ];

    return [...new Set(values)].map(value => `
        <span class="info-badge">${labelMap[value] || value.toUpperCase()}</span>
    `).join('');
}

function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    return Array.from(select.selectedOptions).map(option => option.value);
}

function arrayMatchesFilter(selectedValues, itemValues) {
    if (!selectedValues.length) return true;
    if (!itemValues || !itemValues.length) return false;
    return selectedValues.some(value => itemValues.includes(value));
}

function applyAnimalFilters() {
    const categoryValues = getSelectedValues('filter-category');
    const classValues = getSelectedValues('filter-class');
    const movementValues = getSelectedValues('filter-movement');
    const dietValues = getSelectedValues('filter-diet');
    const habitatValues = getSelectedValues('filter-habitat');
    const statusValues = getSelectedValues('filter-status');
    const cityValue = document.getElementById('filter-city')?.value.trim().toLowerCase();

    const results = achePetApp.animals.filter(animal => {
        const matchesCategory = arrayMatchesFilter(categoryValues, animal.categoryTags || [animal.category]);
        const matchesClass = arrayMatchesFilter(classValues, animal.classTags || []);
        const matchesMovement = arrayMatchesFilter(movementValues, animal.movement || []);
        const matchesDiet = arrayMatchesFilter(dietValues, animal.diet || []);
        const matchesHabitat = arrayMatchesFilter(habitatValues, animal.habitat || []);
        const matchesStatus = arrayMatchesFilter(statusValues, animal.statusTags || []);
        const matchesCity = cityValue ? animal.city.toLowerCase().includes(cityValue) : true;
        return matchesCategory && matchesClass && matchesMovement && matchesDiet && matchesHabitat && matchesStatus && matchesCity;
    });

    const container = document.getElementById('animals-results');
    if (!container) return;
    container.innerHTML = results.length ? results.map(createAnimalCard).join('') : '<p>Nenhum animal encontrado com esses filtros.</p>';
}

function renderAdoptionList() {
    const container = document.getElementById('adoption-list');
    if (!container) return;
    const adoptionAnimals = achePetApp.animals.filter(item => item.status === 'Em Adoção');
    container.innerHTML = adoptionAnimals.length ? adoptionAnimals.map(animal => createAnimalCard(animal)).join('') : '<p>Nenhum animal disponível para adoção no momento.</p>';
}

function renderPartnersList() {
    const container = document.getElementById('partners-list');
    if (!container) return;
    container.innerHTML = achePetApp.partners.map(partner => `
        <article class="partner-card">
            <h3>${partner.name}</h3>
            <p class="partner-meta">${partner.type} · ${partner.city}</p>
            <p>${partner.description}</p>
            <p><strong>Contato:</strong> ${partner.contact}</p>
            <a href="#parceiros">Ver parceiro</a>
        </article>
    `).join('');
}

function hydrateAnimalPage() {
    const cardContainer = document.getElementById('animals-results');
    if (!cardContainer) return;
    applyAnimalFilters();
    const form = document.getElementById('animal-search-form');
    form?.addEventListener('submit', event => {
        event.preventDefault();
        applyAnimalFilters();
    });

    const filterInputs = [
        'filter-category',
        'filter-class',
        'filter-movement',
        'filter-diet',
        'filter-habitat',
        'filter-status',
        'filter-city'
    ];

    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        element?.addEventListener('change', applyAnimalFilters);
        element?.addEventListener('input', applyAnimalFilters);
    });
}

function hydrateAdoptionPage() {
    const container = document.getElementById('adoption-list');
    if (!container) return;
    renderAdoptionList();
    const cityInput = document.getElementById('adoption-filter-city');
    const speciesSelect = document.getElementById('adoption-filter-species');
    const ageSelect = document.getElementById('adoption-filter-age');

    [cityInput, speciesSelect, ageSelect].forEach(input => {
        input?.addEventListener('input', renderAdoptionList);
    });
}

function initAdvancedToggle() {
    const btn = document.getElementById('toggle-advanced');
    const adv = document.getElementById('advanced-filters');
    if (!btn || !adv) return;
    btn.addEventListener('click', () => {
        const isHidden = adv.hasAttribute('hidden');
        if (isHidden) {
            adv.removeAttribute('hidden');
            btn.textContent = 'Ocultar filtros avançados';
            btn.setAttribute('aria-expanded','true');
        } else {
            adv.setAttribute('hidden','');
            btn.textContent = 'Mostrar filtros avançados';
            btn.setAttribute('aria-expanded','false');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    hydrateAnimalPage();
    renderPartnersList();
    hydrateAdoptionPage();
    initAdvancedToggle();
});
