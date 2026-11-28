// Simple client-side router: fetches target pages and injects <main> content, creating an SPA-like experience.

async function loadPage(url, addToHistory = true) {
    try {
        const absolute = new URL(url, location.href).href;
        const urlObj = new URL(absolute);
        const path = urlObj.pathname;
        if (!path.endsWith('/conta.html') && !await hasAuthenticatedSiteAccess()) {
            sessionStorage.setItem('achepetPendingRoute', location.hash || '#inicio');
            window.location.hash = '#conta';
            return;
        }

        // Prefer in-document templates (SPA) if available
        const routes = [
            {match: 'animais.html', tmpl: 'tmpl-animais'},
            {match: 'cadastrar-animal.html', tmpl: 'tmpl-cadastrar'},
            {match: 'mapa.html', tmpl: 'tmpl-mapa'},
            {match: 'animal.html', tmpl: 'tmpl-animal'},
            {match: 'sobre.html', tmpl: 'tmpl-sobre'},
            {match: 'parceiros.html', tmpl: 'tmpl-parceiros'},
            {match: 'resgate.html', tmpl: 'tmpl-resgate'},
            {match: 'adocao.html', tmpl: 'tmpl-adocao'},
            {match: 'contato.html', tmpl: 'tmpl-contato'}
        ];

        const route = routes.find(r => path.endsWith(r.match) && document.getElementById(r.tmpl));
        const targetMain = document.querySelector('main');

        if (route && targetMain) {
            const tmpl = document.getElementById(route.tmpl);
            targetMain.innerHTML = tmpl.innerHTML;

            const title = tmpl.getAttribute('data-title');
            if (title) document.title = title;

            if (addToHistory) history.pushState({}, '', absolute);
            await initForPath(absolute);
            if (typeof animateSections === 'function') animateSections();
            initMobileMenu();
            if (typeof closeMobileMenu === 'function') closeMobileMenu();
            return;
        }

        // fallback: fetch HTML (keeps compatibility while files still exist)
        const res = await fetch(absolute, {credentials: 'same-origin'});
        if (!res.ok) {
            console.error('Failed to load', url, res.status);
            return;
        }
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // replace <main> contents
        const newMain = doc.querySelector('main');
        if (newMain && targetMain) {
            targetMain.innerHTML = newMain.innerHTML;
        }

        // update title
        const newTitle = doc.querySelector('title')?.textContent;
        if (newTitle) document.title = newTitle;

        if (addToHistory) history.pushState({}, '', absolute);
        await initForPath(absolute);
        if (typeof animateSections === 'function') animateSections();
        initMobileMenu();
        if (typeof closeMobileMenu === 'function') closeMobileMenu();
    } catch (err) {
        console.error('router load error', err);
    }
}

async function hasAuthenticatedSiteAccess() {
    const backend = window.achePetBackend;
    if (!backend?.isConfigured) {
        document.body.classList.remove('is-authenticated');
        return false;
    }
    try {
        await backend.ready;
        const user = backend.getCurrentUser();
        document.body.classList.toggle('is-authenticated', Boolean(user));
        if (user) document.body.classList.remove('auth-check-pending');
        return Boolean(user);
    } catch (error) {
        document.body.classList.remove('is-authenticated');
        console.error('Could not verify the current user:', error);
        return false;
    }
}

function isLocalLink(anchor) {
    if (!anchor || !anchor.href) return false;
    const url = new URL(anchor.href, location.href);
    return url.origin === location.origin;
}

async function initForPath(absoluteUrl) {
    const url = new URL(absoluteUrl);
    const path = url.pathname;

    if (path.endsWith('/pages/animais.html') || path.endsWith('/animais.html')) {
        if (typeof hydrateAnimalPage === 'function') hydrateAnimalPage();
    } else if (path.endsWith('/pages/cadastrar-animal.html') || path.endsWith('/cadastrar-animal.html')) {
        if (typeof initReportForm === 'function') await initReportForm(url.searchParams);
    } else if (path.endsWith('/pages/mapa.html') || path.endsWith('/mapa.html')) {
        if (typeof initMap === 'function') await initMap();
    } else if (path.endsWith('/pages/adocao.html') || path.endsWith('/adocao.html')) {
        if (typeof hydrateAdoptionPage === 'function') hydrateAdoptionPage();
    } else if (path.endsWith('/pages/parceiros.html') || path.endsWith('/parceiros.html')) {
        if (typeof renderPartnersList === 'function') renderPartnersList();
    } else if (path.endsWith('/conta.html')) {
        await initAuthPage();
    } else if (path.endsWith('/perfil.html')) {
        await initProfilePage();
    } else if (path.endsWith('/conversas.html')) {
        await initChatPage(url.searchParams);
    } else if (path.endsWith('/pages/animal.html') || path.endsWith('/animal.html')) {
        await renderAnimalDetail(url.searchParams);
    } else if (path === '/' || path.endsWith('index.html')) {
        initOwnerDashboard();
        await refreshOwnerDashboard();
        if (typeof renderHomeCards === 'function') renderHomeCards();
        if (typeof renderPartnerPreview === 'function') renderPartnerPreview();
        if (typeof handleSearchSubmit === 'function') handleSearchSubmit();
    }
}

async function renderAnimalDetail(searchParams) {
    const id = searchParams.get ? searchParams.get('id') : (new URL(location.href)).searchParams.get('id');
    const animal = (typeof achePetStore !== 'undefined' && achePetStore.helpers) ? achePetStore.helpers.getAnimalById(id) : null;
    const container = document.getElementById('animal-detail');
    if (!container) return;
    let selectedAnimal = animal;
    if (!selectedAnimal && window.achePetBackend?.isConfigured) {
        try {
            const report = await window.achePetBackend.getReport(id);
            if (report) selectedAnimal = achePetStore.helpers.reportToAnimal(report);
        } catch (error) {
            console.error('Could not load animal details:', error);
            container.textContent = 'Não foi possível carregar esta ocorrência.';
            return;
        }
    }
    if (!selectedAnimal) {
        container.innerHTML = '<p>Animal não encontrado.</p>';
        return;
    }

    const imagePath = escapeHTML(resolveAssetPath(selectedAnimal.image));
    const user = window.achePetBackend?.getCurrentUser();
    const contactLink = selectedAnimal.status === 'Perdido'
        && selectedAnimal.ownerId
        && selectedAnimal.ownerId !== user?.id
        ? `<a class="button button-primary" href="#conversas?reportId=${encodeURIComponent(selectedAnimal.id)}">Encontrei seu pet</a>`
        : '';
    container.innerHTML = `
        <div class="card-panel animal-detail-panel" style="gap:1rem;">
            <a class="button button-secondary animal-detail-close" href="#animais" aria-label="Fechar detalhes e voltar à busca" title="Voltar à busca">×</a>
            <div style="flex:1;min-width:280px;">
                <img src="${imagePath}" alt="${escapeHTML(selectedAnimal.name)}" style="width:100%;border-radius:16px;" loading="lazy">
            </div>
            <div style="flex:2;min-width:280px;">
                <h2>${escapeHTML(selectedAnimal.name)}</h2>
                <div><span class="status-badge ${setStatusClass(selectedAnimal.status)}">${escapeHTML(selectedAnimal.status)}</span></div>
                <p><strong>Espécie:</strong> ${escapeHTML(selectedAnimal.species)}</p>
                <p><strong>Raça:</strong> ${escapeHTML(selectedAnimal.breed || 'Não informada')}</p>
                <p><strong>Sexo:</strong> ${escapeHTML(selectedAnimal.sex || '-')}</p>
                <p><strong>Local:</strong> ${escapeHTML(selectedAnimal.region || 'Região não informada')}, ${escapeHTML(selectedAnimal.city)}${selectedAnimal.state ? ` - ${escapeHTML(selectedAnimal.state)}` : ''}</p>
                <p><strong>Descrição:</strong> ${escapeHTML(selectedAnimal.description || '')}</p>
                <p><small>Última atualização: ${escapeHTML(selectedAnimal.date)}</small></p>
                ${contactLink}
            </div>
        </div>
    `;
}

// intercept link clicks (handles both html links and hash routes)
document.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    if (!anchor) return;
    if (anchor.hasAttribute('download') || anchor.target === '_blank') return;

    const href = anchor.getAttribute('href');
    if (!href) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

    // handle hash-based internal routes (e.g. #animais, #animal?id=3)
    if (href.startsWith('#')) {
        event.preventDefault();
        handleHashRoute(href);
        return;
    }

    if (!isLocalLink(anchor)) return;

    // only handle navigation for html pages or root paths
    if (href.endsWith('.html') || href.startsWith('/')) {
        event.preventDefault();
        loadPage(href);
    }
});

// handle back/forward (history)
window.addEventListener('popstate', () => {
    if (!location.hash) {
        loadPage(location.pathname + location.search, false);
    }
});

// handle hash changes (direct navigation to #hash or redirects)
window.addEventListener('hashchange', () => {
    if (location.hash) handleHashRoute(location.hash, false);
});

// On initial load, ensure correct init when index is opened with a path or hash
document.addEventListener('DOMContentLoaded', () => {
    if (location.hash) {
        handleHashRoute(location.hash, false);
    } else {
        handleInitialRoute();
    }
});

async function handleInitialRoute() {
    if (!await hasAuthenticatedSiteAccess()) {
        sessionStorage.setItem('achepetPendingRoute', '#inicio');
        window.location.hash = '#conta';
        return;
    }
    await initForPath(location.href);
}

// helper to load from hash tokens
async function handleHashRoute(hash, addToHistory = true) {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    const [name, query] = raw.split('?');
    if (name === 'conta') {
        await hasAuthenticatedSiteAccess();
        document.body.classList.remove('auth-check-pending');
    }
    if (name !== 'conta' && !await hasAuthenticatedSiteAccess()) {
        sessionStorage.setItem('achepetPendingRoute', `#${raw}`);
        if (location.hash !== '#conta') window.location.hash = '#conta';
        return;
    }
    if (name === 'inicio') {
        await loadPage('/', false);
        return;
    }
    const map = {
        'animais': 'tmpl-animais',
        'cadastrar-animal': 'tmpl-cadastrar',
        'mapa': 'tmpl-mapa',
        'animal': 'tmpl-animal',
        'sobre': 'tmpl-sobre',
        'parceiros': 'tmpl-parceiros',
        'resgate': 'tmpl-resgate',
        'adocao': 'tmpl-adocao',
        'contato': 'tmpl-contato',
        'conta': 'tmpl-conta',
        'perfil': 'tmpl-perfil',
        'conversas': 'tmpl-conversas'
    };

    const tmplId = map[name];
    const targetMain = document.querySelector('main');
    if (!tmplId || !targetMain) return;
    const tmpl = document.getElementById(tmplId);
    if (!tmpl) return;

    targetMain.innerHTML = tmpl.innerHTML;
    const title = tmpl.getAttribute('data-title');
    if (title) document.title = title;

    // push a readable history entry (keeps hash visible)
    if (addToHistory) history.pushState({}, '', '#' + raw);

    // call initForPath with a synthetic path so existing init logic runs
    const synthetic = new URL(name + '.html' + (query ? '?' + query : ''), location.href).href;
    await initForPath(synthetic);
    if (typeof animateSections === 'function') animateSections();
    initMobileMenu();
    if (typeof closeMobileMenu === 'function') closeMobileMenu();
}
