function createAnimalCard(animal, useDetailsLink = true) {
    const imagePath = escapeHTML(resolveAssetPath(animal.image));
    return `
        <article class="animal-card">
            <img src="${imagePath}" alt="Foto de ${escapeHTML(animal.name)}" loading="lazy">
            <div class="animal-card-content">
                <div>
                    <h3>${escapeHTML(animal.name)}</h3>
                    <span class="status-badge ${setStatusClass(animal.status)}">${escapeHTML(animal.status)}</span>
                </div>
                <p>${escapeHTML(animal.species)} • ${escapeHTML(animal.city)} - ${escapeHTML(animal.region || 'Região não informada')}</p>
                <div class="animal-badges">${renderAnimalBadges(animal)}</div>
                <p><small>Última atualização: ${escapeHTML(animal.date)}</small></p>
                ${useDetailsLink ? `<a href="#animal?id=${encodeURIComponent(animal.id)}">Ver detalhes</a>` : ''}
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
    ].filter(Boolean);

    return [...new Set(values)].map(value => `
        <span class="info-badge">${escapeHTML(labelMap[value] || String(value).toUpperCase())}</span>
    `).join('');
}

function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    return Array.from(select.selectedOptions)
        .map(option => option.value)
        .filter(Boolean);
}

function arrayMatchesFilter(selectedValues, itemValues) {
    if (!selectedValues.length) return true;
    if (!itemValues || !itemValues.length) return false;
    return selectedValues.some(value => itemValues.includes(value));
}

function statusFilterValue(status) {
    const normalized = String(status || '').trim().toLowerCase();
    const values = {
        'em adoção': 'para_adocao',
        'resgate solicitado': 'resgate_solicitado',
        'silvestre avistado': 'silvestre_avistado'
    };
    return values[normalized] || normalized.replace(/\s+/g, '_');
}

function getAnimalSearchParams() {
    const hashQueryIndex = window.location.hash.indexOf('?');
    if (window.location.hash.startsWith('#animais') && hashQueryIndex >= 0) {
        return new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1));
    }
    return new URLSearchParams(window.location.search);
}

function applyAnimalSearchParams() {
    const params = getAnimalSearchParams();
    const type = document.getElementById('filter-type');
    const status = document.getElementById('filter-status');
    const category = document.getElementById('filter-category');
    const city = document.getElementById('filter-city');

    if (type && params.has('type')) type.value = params.get('type');
    if (category && params.has('category')) category.value = params.get('category');
    if (city && params.has('city')) city.value = params.get('city');

    const statusValue = params.get('situation') || params.get('status');
    if (status && statusValue) status.value = statusFilterValue(statusValue);
}

function applyAnimalFilters() {
    const categoryValues = getSelectedValues('filter-category');
    const typeValue = document.getElementById('filter-type')?.value.trim().toLowerCase();
    const classValues = getSelectedValues('filter-class');
    const movementValues = getSelectedValues('filter-movement');
    const dietValues = getSelectedValues('filter-diet');
    const habitatValues = getSelectedValues('filter-habitat');
    const statusValues = getSelectedValues('filter-status');
    const cityValue = document.getElementById('filter-city')?.value.trim().toLowerCase() || '';

    const results = achePetApp.animals.filter(animal => {
        const species = String(animal.species || animal.type || '').trim().toLowerCase();
        const matchesType = !typeValue || (typeValue === 'outro'
            ? !['cachorro', 'gato', 'animal silvestre'].includes(species)
            : species === typeValue);
        const matchesCategory = arrayMatchesFilter(categoryValues, animal.categoryTags || [animal.category]);
        const matchesClass = arrayMatchesFilter(classValues, animal.classTags || []);
        const matchesMovement = arrayMatchesFilter(movementValues, animal.movement || []);
        const matchesDiet = arrayMatchesFilter(dietValues, animal.diet || []);
        const matchesHabitat = arrayMatchesFilter(habitatValues, animal.habitat || []);
        const statuses = animal.statusTags || (animal.status ? [statusFilterValue(animal.status)] : []);
        const matchesStatus = arrayMatchesFilter(statusValues, statuses);
        const matchesCity = cityValue ? String(animal.city || '').toLowerCase().includes(cityValue) : true;
        return matchesType && matchesCategory && matchesClass && matchesMovement && matchesDiet && matchesHabitat && matchesStatus && matchesCity;
    });

    const container = document.getElementById('animals-results');
    if (!container) return;
    if (!results.length) {
        container.textContent = achePetApp.animals.length
            ? 'Nenhum animal encontrado com esses filtros.'
            : 'Ainda não há ocorrências cadastradas.';
        return;
    }

    container.innerHTML = results.map(createAnimalCard).join('');
}

function renderAdoptionList() {
    const container = document.getElementById('adoption-list');
    if (!container) return;
    const cityValue = document.getElementById('adoption-filter-city')?.value.trim().toLowerCase() || '';
    const speciesValue = document.getElementById('adoption-filter-species')?.value.toLowerCase() || '';
    const adoptionAnimals = achePetApp.animals.filter(item => {
        const matchesStatus = item.status === 'Em Adoção' || (item.statusTags || []).includes('para_adocao');
        const matchesSpecies = !speciesValue || String(item.species || '').toLowerCase() === speciesValue;
        const matchesCity = !cityValue || String(item.city || '').toLowerCase().includes(cityValue);
        return matchesStatus && matchesSpecies && matchesCity;
    });
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
    applyAnimalSearchParams();
    initAdvancedToggle();
    applyAnimalFilters();
    const form = document.getElementById('animal-search-form');
    if (form?.dataset.filtersInitialized === 'true') return;
    if (form) form.dataset.filtersInitialized = 'true';
    form?.addEventListener('submit', event => {
        event.preventDefault();
        applyAnimalFilters();
    });

    const filterInputs = [
        'filter-category',
        'filter-type',
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

    if (container.dataset.filtersInitialized === 'true') return;
    container.dataset.filtersInitialized = 'true';
    cityInput?.addEventListener('input', renderAdoptionList);
    speciesSelect?.addEventListener('change', renderAdoptionList);
}

function initAdvancedToggle() {
    const btn = document.getElementById('toggle-advanced');
    const adv = document.getElementById('advanced-filters');
    if (!btn || !adv || btn.dataset.initialized === 'true') return;
    btn.dataset.initialized = 'true';
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
