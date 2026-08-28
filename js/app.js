const achePetApp = {
    animals: [
        {
            id: 1,
            name: "Rex",
            species: "Cachorro",
            type: "Cachorro",
            status: "Perdido",
            situation: "Perdido",
            city: "São Paulo",
            state: "SP",
            region: "Centro",
            date: "06/08/2026",
            image: "assets/images/Animal-Doméstico.png",
            description: "Rex sumiu em um bairro central e estava usando coleira verde.",
            breed: "SRD",
            sex: "Macho",
            color: "Marrom e branco",
            characteristics: "Orelhas grandes, rabinho curto.",
            contact: "contato@acheseupet.org",
            lat: -23.5505,
            lng: -46.6333,
            category: "animal",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["perdido"]
        },
        {
            id: 2,
            name: "Luna",
            species: "Gato",
            type: "Gato",
            status: "Encontrado",
            situation: "Encontrado",
            city: "Curitiba",
            state: "PR",
            region: "Batel",
            date: "28/07/2026",
            image: "assets/images/Animal-Silvestre.png",
            description: "Fêmea encontrada próxima a um parque, muito dócil e bem cuidada.",
            breed: "Mestiça",
            sex: "Fêmea",
            color: "Cinza claro",
            characteristics: "Olhos verdes, pequeno porte.",
            contact: "ong@acolherfeliz.org",
            lat: -25.4284,
            lng: -49.2733,
            category: "animal",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["carnivoro"],
            habitat: ["urbano"],
            statusTags: ["encontrado"]
        },
        {
            id: 3,
            name: "Jade",
            species: "Cachorro",
            type: "Cachorro",
            status: "Em Adoção",
            situation: "Em Adoção",
            city: "Porto Alegre",
            state: "RS",
            region: "Moinhos",
            date: "15/07/2026",
            image: "assets/images/Animal-Réptil.png",
            description: "Cadelinha carinhosa disponível para adoção em instituição parceira.",
            breed: "Labrador",
            sex: "Fêmea",
            color: "Dourado",
            characteristics: "Amigável com crianças e outros pets.",
            contact: "adocao@protetoresul.org",
            lat: -30.0280,
            lng: -51.2287,
            category: "adocao",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["para_adocao"]
        },
        {
            id: 4,
            name: "Pingo",
            species: "Cachorro",
            type: "Cachorro",
            status: "Resgate solicitado",
            situation: "Resgate solicitado",
            city: "Belo Horizonte",
            state: "MG",
            region: "Savassi",
            date: "02/08/2026",
            image: "assets/images/Animal-Aquático.png",
            description: "Cachorro ferido encontrado próximo a uma rodovia, precisa de ajuda.",
            breed: "SRD",
            sex: "Macho",
            color: "Preto e branco",
            characteristics: "Caminha com dificuldade.",
            contact: "resgate@heroisde4patas.org",
            lat: -19.9313,
            lng: -43.9383,
            category: "resgate",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["resgate_solicitado", "ferido"]
        },
        {
            id: 5,
            name: "Aurora",
            species: "Gato",
            type: "Gato",
            status: "Perdido",
            situation: "Perdido",
            city: "Fortaleza",
            state: "CE",
            region: "Meireles",
            date: "22/07/2026",
            image: "assets/images/Animal-Anfíbio.png",
            description: "Gata desaparecida na região litorânea. Responde por Aurora.",
            breed: "Siamês",
            sex: "Fêmea",
            color: "Bege e marrom",
            characteristics: "Miado agudo, coleira rosa.",
            contact: "apoio@cuidapets.org",
            lat: -3.7184,
            lng: -38.5434,
            category: "animal",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["carnivoro"],
            habitat: ["praia"],
            statusTags: ["perdido"]
        },
        {
            id: 6,
            name: "Tuca",
            species: "Animal silvestre",
            type: "Animal silvestre",
            status: "Encontrado",
            situation: "Encontrado",
            city: "Manaus",
            state: "AM",
            region: "Centro",
            date: "18/07/2026",
            image: "assets/images/Animal-Doméstico.png",
            description: "Arara encontrada em área urbana. Deve ser encaminhada a órgão especializado.",
            breed: "Arara",
            sex: "Macho",
            color: "Azul e amarelo",
            characteristics: "Asas inteiras, muito alerta.",
            contact: "fauna@amazoniaact.org",
            lat: -3.1190,
            lng: -60.0217,
            category: "silvestre",
            categoryTags: ["silvestre"],
            classTags: ["ave"],
            movement: ["voa"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["encontrado"]
        },
        {
            id: 7,
            name: "Nina",
            species: "Cachorro",
            type: "Cachorro",
            status: "Em Adoção",
            situation: "Em Adoção",
            city: "Recife",
            state: "PE",
            region: "Boa Viagem",
            date: "10/07/2026",
            image: "assets/images/Animal-Silvestre.png",
            description: "Filhote carinhoso e sociável disponível em ONG local.",
            breed: "SRD",
            sex: "Fêmea",
            color: "Bege",
            characteristics: "Brinca muito e está vacinada.",
            contact: "adocoes@amigosde4patas.org",
            lat: -8.0600,
            lng: -34.8760,
            category: "adocao",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["para_adocao"]
        },
        {
            id: 8,
            name: "Thor",
            species: "Cachorro",
            type: "Cachorro",
            status: "Perdido",
            situation: "Perdido",
            city: "Salvador",
            state: "BA",
            region: "Pituba",
            date: "30/07/2026",
            image: "assets/images/Animal-Réptil.png",
            description: "Macho forte que fugiu de casa durante uma tempestade.",
            breed: "Boxer",
            sex: "Macho",
            color: "Marrom",
            characteristics: "Respira com som alto.",
            contact: "perdido@apadrinhando.org",
            lat: -12.9714,
            lng: -38.5014,
            category: "animal",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["perdido"]
        },
        {
            id: 9,
            name: "Mila",
            species: "Animal silvestre",
            type: "Animal silvestre",
            status: "Resgate solicitado",
            situation: "Resgate solicitado",
            city: "Florianópolis",
            state: "SC",
            region: "Lagoa da Conceição",
            date: "08/08/2026",
            image: "assets/images/Animal-Aquático.png",
            description: "Macaco encontrado próximo à trilha. Não se aproxime sem apoio técnico.",
            breed: "Macaco",
            sex: "Fêmea",
            color: "Marrom escuro",
            characteristics: "Olhos atentos, habitat urbano.",
            contact: "resgate@faunawatch.org",
            lat: -27.5949,
            lng: -48.5477,
            category: "silvestre",
            categoryTags: ["silvestre"],
            classTags: ["mamifero"],
            movement: ["arboricola"],
            diet: ["onivoro"],
            habitat: ["floresta"],
            statusTags: ["resgate_solicitado"]
        },
        {
            id: 10,
            name: "Simba",
            species: "Gato",
            type: "Gato",
            status: "Encontrado",
            situation: "Encontrado",
            city: "Brasília",
            state: "DF",
            region: "Lago Sul",
            date: "12/08/2026",
            image: "assets/images/Animal-Anfíbio.png",
            description: "Gato encontrado em área residencial com sinais de arame roçando o pelo.",
            breed: "Mestiço",
            sex: "Macho",
            color: "Laranja",
            characteristics: "Adora comida úmida.",
            contact: "voluntario@brasilpet.org",
            lat: -15.7939,
            lng: -47.8828,
            category: "animal",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["carnivoro"],
            habitat: ["urbano"],
            statusTags: ["encontrado"]
        },
        {
            id: 11,
            name: "Nuvem",
            species: "Gato",
            type: "Gato",
            status: "Em Adoção",
            situation: "Em Adoção",
            city: "Campinas",
            state: "SP",
            region: "Taquaral",
            date: "05/08/2026",
            image: "assets/images/Animal-Doméstico.png",
            description: "Gatinha tranquila e carinhosa pronta para um novo lar.",
            breed: "Persa",
            sex: "Fêmea",
            color: "Branco",
            characteristics: "Pelagem longa, precisa de escovação.",
            contact: "adocao@refugioamigos.org",
            lat: -22.9099,
            lng: -47.0626,
            category: "adocao",
            categoryTags: ["domestico"],
            classTags: ["mamifero"],
            movement: ["terrestre"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["para_adocao"]
        },
        {
            id: 12,
            name: "Lua",
            species: "Animal silvestre",
            type: "Animal silvestre",
            status: "Perdido",
            situation: "Perdido",
            city: "Vitória",
            state: "ES",
            region: "Jardim da Penha",
            date: "03/08/2026",
            image: "assets/images/Animal-Silvestre.png",
            description: "Pomba astronômica perdida próxima a trecho verde urbano.",
            breed: "Pombo",
            sex: "Fêmea",
            color: "Cinza e branco",
            characteristics: "Não tenta fugir quando se aproxima devagar.",
            contact: "fauna@esverde.org",
            lat: -20.3155,
            lng: -40.3128,
            category: "silvestre",
            categoryTags: ["silvestre"],
            classTags: ["ave"],
            movement: ["voa"],
            diet: ["onivoro"],
            habitat: ["urbano"],
            statusTags: ["perdido"]
        }
    ],
    partners: [
        {
            id: 1,
            name: "Rede Protetora",
            type: "ONG",
            city: "São Paulo",
            description: "Centro de resgate e adoção com apoio veterinário local.",
            logo: "assets/logo/Ache-seu-Pet.png",
            contact: "contato@redeprotetora.org"
        },
        {
            id: 2,
            name: "Zoonoses BH",
            type: "Zoonoses",
            city: "Belo Horizonte",
            description: "Serviço público de atendimento a animais em risco na capital mineira.",
            logo: "assets/logo/Ache-seu-Pet.png",
            contact: "servicos@zoonosesbh.gov.br"
        },
        {
            id: 3,
            name: "Fauna Segura",
            type: "Órgão de proteção à fauna",
            city: "Manaus",
            description: "Atuação em resgates de animais silvestres e orientação ambiental.",
            logo: "assets/logo/Ache-seu-Pet.png",
            contact: "fauna@segura.am.gov.br"
        },
        {
            id: 4,
            name: "Apoio Voluntário",
            type: "Voluntários",
            city: "Curitiba",
            description: "Rede de voluntários especializada em transporte e acolhimento temporário.",
            logo: "assets/logo/Ache-seu-Pet.png",
            contact: "voluntarios@apoio.org"
        },
        {
            id: 5,
            name: "Adote com Amor",
            type: "Centro de adoção",
            city: "Porto Alegre",
            description: "Instituição de adoção responsável por mais de 300 famílias felizes.",
            logo: "assets/logo/Ache-seu-Pet.png",
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

    toggle.addEventListener('click', (e) => {
        const opened = nav.classList.contains('open');
        if (opened) closeMenu(); else openMenu();
    });

    // support keyboard toggle (Enter/Space)
    toggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const opened = nav.classList.contains('open');
            if (opened) closeMenu(); else openMenu();
        }
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
    return `${getBasePath()}${assetPath}`;
}

function setStatusClass(status) {
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    if (normalized.includes('perdido')) return 'status-perdido';
    if (normalized.includes('encontrado')) return 'status-encontrado';
    if (normalized.includes('adoção') || normalized.includes('adoçao')) return 'status-adoção';
    if (normalized.includes('resgate')) return 'status-resgate';
    return 'status-silvestre';
}

function saveReport(data) {
    const saved = JSON.parse(localStorage.getItem(achePetApp.localKey) || '[]');
    saved.unshift(data);
    localStorage.setItem(achePetApp.localKey, JSON.stringify(saved));
}

function loadReports() {
    return JSON.parse(localStorage.getItem(achePetApp.localKey) || '[]');
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
        getQueryParams,
        getAnimalById
    }
};

