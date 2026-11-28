const achePetApp = {
    animals: [],
    partners: [
        {
            id: 1,
            name: "Rede Protetora",
            type: "ONG",
            city: "São Paulo",
            description: "Centro de resgate e adoção com apoio veterinário local.",
            logo: "assets/logo/ache-seu-pet.png",
            contact: "contato@redeprotetora.org"
        },
        {
            id: 2,
            name: "Zoonoses BH",
            type: "Zoonoses",
            city: "Belo Horizonte",
            description: "Serviço público de atendimento a animais em risco na capital mineira.",
            logo: "assets/logo/ache-seu-pet.png",
            contact: "servicos@zoonosesbh.gov.br"
        },
        {
            id: 3,
            name: "Fauna Segura",
            type: "Órgão de proteção à fauna",
            city: "Manaus",
            description: "Atuação em resgates de animais silvestres e orientação ambiental.",
            logo: "assets/logo/ache-seu-pet.png",
            contact: "fauna@segura.am.gov.br"
        },
        {
            id: 4,
            name: "Apoio Voluntário",
            type: "Voluntários",
            city: "Curitiba",
            description: "Rede de voluntários especializada em transporte e acolhimento temporário.",
            logo: "assets/logo/ache-seu-pet.png",
            contact: "voluntarios@apoio.org"
        },
        {
            id: 5,
            name: "Adote com Amor",
            type: "Centro de adoção",
            city: "Porto Alegre",
            description: "Instituição de adoção responsável por mais de 300 famílias felizes.",
            logo: "assets/logo/ache-seu-pet.png",
            contact: "adocoes@adotecomamor.org"
        }
    ],
    localKey: "acheSeuPetReports"
};

function initMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    // ensure controls attributes
    if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');
    if (!toggle.hasAttribute('aria-controls')) toggle.setAttribute('aria-controls', nav.id || 'site-navigation');
    if (!nav.id) nav.id = 'site-navigation';
    if (toggle.dataset.mobileMenuInitialized === 'true') return;
    toggle.dataset.mobileMenuInitialized = 'true';

    function openMenu() {
        nav.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        // move focus to first link for keyboard users
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.focus();
    }

    function closeMenu() {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
    }

    // expose close for other modules (router)
    window.closeMobileMenu = closeMenu;

    toggle.addEventListener('click', () => {
        const opened = nav.classList.contains('open');
        if (opened) closeMenu(); else openMenu();
    });

    // close menu on Esc
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu();
    });

    // close when clicking a link inside nav (navigate)
    nav.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (a) closeMenu();
    });

    // close when clicking outside
    document.addEventListener('click', e => {
        if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains('open')) {
            closeMenu();
        }
    });
}

function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}

function resolveAssetPath(assetPath) {
    if (/^(?:data:|blob:|https?:|\/)/i.test(assetPath)) return assetPath;
    return `${getBasePath()}${assetPath}`;
}

function escapeHTML(value) {
    const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

function setStatusClass(status) {
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    if (normalized.includes('perdido')) return 'status-perdido';
    if (normalized.includes('encontrado')) return 'status-encontrado';
    if (normalized.includes('adoção') || normalized.includes('adoçao')) return 'status-adoção';
    if (normalized.includes('resgate')) return 'status-resgate';
    return 'status-silvestre';
}

function reportToAnimal(report) {
    const species = String(report.species || 'Espécie não identificada');
    const eventType = String(report.event_type || report.eventType || '');
    const statusByEvent = {
        'Meu animal está perdido': {label: 'Perdido', tag: 'perdido'},
        'Encontrei um animal': {label: 'Encontrado', tag: 'encontrado'},
        'Encontrei um animal abandonado': {label: 'Abandonado', tag: 'abandonado'},
        'Vi um animal perdido': {label: 'Perdido', tag: 'perdido'},
        'Animal silvestre encontrado': {label: 'Silvestre avistado', tag: 'silvestre_avistado'},
        'Preciso de ajuda para resgate': {label: 'Resgate solicitado', tag: 'resgate_solicitado'}
    };
    const status = statusByEvent[eventType] || {label: 'Recebido', tag: 'recebido'};
    const isWild = eventType === 'Animal silvestre encontrado' || species.toLowerCase().includes('silvestre');
    const date = report.event_date || report.date;
    const parsedDate = date ? new Date(`${date}T00:00:00`) : null;

    return {
        id: report.id,
        ownerId: report.owner_id || report.ownerId || null,
        isLocalReport: report.source === 'localStorage',
        name: String(report.name || species),
        species,
        type: species,
        categoryTags: [isWild ? 'silvestre' : 'domestico'],
        status: status.label,
        statusTags: [status.tag],
        image: report.photo_url || report.photo_data_url || 'assets/images/Hero.png',
        breed: report.breed || '',
        sex: report.sex || '',
        color: report.color || '',
        characteristics: report.characteristics || '',
        city: report.city || '',
        region: report.region || '',
        state: report.state || '',
        description: report.description || '',
        date: parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString('pt-BR')
            : String(date || '')
    };
}

function saveReport(data) {
    const saved = loadReports();
    const localReport = {...data, source: 'localStorage'};
    saved.unshift(localReport);
    localStorage.setItem(achePetApp.localKey, JSON.stringify(saved));
    achePetApp.animals.unshift(reportToAnimal(localReport));
}

function loadReports() {
    return JSON.parse(localStorage.getItem(achePetApp.localKey) || '[]');
}

function deleteLocalReport(reportId) {
    const reports = loadReports();
    const remaining = reports.filter(report => String(report.id) !== String(reportId));
    if (remaining.length === reports.length) return false;
    localStorage.setItem(achePetApp.localKey, JSON.stringify(remaining));
    achePetApp.animals = remaining.map(report => reportToAnimal({...report, source: 'localStorage'}));
    return true;
}

achePetApp.animals = loadReports().map(report => reportToAnimal({...report, source: 'localStorage'}));

async function loadPublicAnimals() {
    if (window.achePetBackend?.isConfigured) {
        const reports = await window.achePetBackend.listReports();
        achePetApp.animals = reports.map(reportToAnimal);
        return achePetApp.animals;
    }

    achePetApp.animals = loadReports().map(report => reportToAnimal({...report, source: 'localStorage'}));
    return achePetApp.animals;
}

function animateSections() {
    document.querySelectorAll('.section, .card-panel').forEach((section, index) => {
        section.style.animationDelay = `${index * 0.08}s`;
        section.classList.add('fade-in');
    });
}

function getQueryParams() {
    return new URLSearchParams(window.location.search);
}

function getAnimalById(id) {
    return achePetApp.animals.find(animal => String(animal.id) === String(id));
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    animateSections();
});

window.achePetStore = {
    data: achePetApp,
    helpers: {
        setStatusClass,
        saveReport,
        loadReports,
        deleteLocalReport,
        loadPublicAnimals,
        reportToAnimal,
        getQueryParams,
        getAnimalById
    }
};

