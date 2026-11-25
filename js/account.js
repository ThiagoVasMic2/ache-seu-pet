let activityChannel = null;
let dashboardRequest = 0;
let chatChannel = null;
let chatConversationId = null;
let chatGeneration = 0;

function setFormNotice(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', isError);
}

function formatActivityDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR');
}

function updateAccountNavigation(user = window.achePetBackend?.getCurrentUser()) {
    const link = document.getElementById('account-nav-link');
    if (link) link.textContent = user ? 'Minha conta' : 'Entrar';
}

function renderAccountSession(user) {
    const form = document.getElementById('auth-form');
    const session = document.getElementById('account-session');
    const email = document.getElementById('account-email');
    if (!form || !session) return;

    form.hidden = Boolean(user);
    session.hidden = !user;
    if (email) email.textContent = user?.email || '';
}

async function initAuthPage() {
    const form = document.getElementById('auth-form');
    if (!form) return;
    const notice = document.getElementById('auth-notice');
    const backend = window.achePetBackend;
    const modeToggle = document.getElementById('auth-mode-toggle');
    const submitButton = document.getElementById('auth-submit');
    const session = document.getElementById('account-session');
    let isSignUp = false;

    if (!backend?.isConfigured) {
        form.hidden = true;
        if (session) session.hidden = true;
        setFormNotice(notice, 'A autenticação está indisponível até configurar a URL e a chave pública do Supabase.');
        return;
    }

    try {
        await backend.ready;
    } catch (error) {
        form.hidden = true;
        setFormNotice(notice, 'Não foi possível conectar ao Supabase. Confira a configuração do projeto.', true);
        console.error('Could not initialize account page:', error);
        return;
    }

    renderAccountSession(backend.getCurrentUser());
    if (form.dataset.initialized === 'true') return;
    form.dataset.initialized = 'true';

    modeToggle?.addEventListener('click', () => {
        isSignUp = !isSignUp;
        if (submitButton) submitButton.textContent = isSignUp ? 'Criar conta' : 'Entrar';
        if (modeToggle) modeToggle.textContent = isSignUp ? 'Já tenho uma conta' : 'Criar uma conta';
        const password = document.getElementById('auth-password');
        if (password) password.autocomplete = isSignUp ? 'new-password' : 'current-password';
        setFormNotice(notice, '');
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(form);
        const emailValue = String(formData.get('email') || '').trim();
        const passwordValue = String(formData.get('password') || '');
        if (submitButton) submitButton.disabled = true;
        setFormNotice(notice, isSignUp ? 'Criando sua conta…' : 'Entrando…');

        try {
            if (isSignUp) {
                const result = await backend.signUp(emailValue, passwordValue);
                if (!result.session) {
                    setFormNotice(notice, 'Conta criada. Confirme o e-mail enviado pelo Supabase e depois entre.');
                } else {
                    setFormNotice(notice, 'Conta criada e conectada.');
                }
            } else {
                await backend.signIn(emailValue, passwordValue);
                setFormNotice(notice, 'Você entrou na sua conta.');
            }
            renderAccountSession(backend.getCurrentUser());
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível autenticar.', true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });

    document.getElementById('signout-button')?.addEventListener('click', async () => {
        try {
            await backend.signOut();
            renderAccountSession(null);
            setFormNotice(notice, 'Você saiu da sua conta.');
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível sair da conta.', true);
        }
    });
}

function renderDashboardReports(reports) {
    const container = document.getElementById('dashboard-reports');
    if (!container) return;
    if (!reports.length) {
        container.innerHTML = '<p>Você ainda não publicou ocorrências nesta conta.</p>';
        return;
    }

    container.innerHTML = reports.map(report => {
        const animal = reportToAnimal(report);
        return `
            <article class="dashboard-report">
                <div>
                    <strong>${escapeHTML(animal.name)}</strong>
                    <span class="status-badge ${setStatusClass(animal.status)}">${escapeHTML(animal.status)}</span>
                    <p>${escapeHTML(animal.species)} · ${escapeHTML(animal.city)}</p>
                </div>
                <button class="button button-danger" type="button" data-delete-report="${encodeURIComponent(animal.id)}">Retirar postagem</button>
            </article>
        `;
    }).join('');
}

function renderDashboardConversations(conversations, user) {
    const container = document.getElementById('dashboard-conversations');
    if (!container) return;
    if (!conversations.length) {
        container.innerHTML = '<p>Ninguém iniciou uma conversa sobre suas ocorrências ainda.</p>';
        return;
    }

    container.innerHTML = conversations.slice(0, 5).map(conversation => {
        const reportName = conversation.report?.name || conversation.report?.species || 'Ocorrência';
        const isOwner = conversation.owner_id === user.id;
        const activity = isOwner
            ? 'Alguém quer falar com você sobre este pet.'
            : 'Conversa iniciada sobre este pet.';
        return `
            <article class="dashboard-conversation">
                <div>
                    <strong>${escapeHTML(reportName)}</strong>
                    <p>${activity}</p>
                    <small>${escapeHTML(formatActivityDate(conversation.updated_at))}</small>
                </div>
                <a class="button button-secondary" href="#conversas?conversationId=${encodeURIComponent(conversation.id)}">Responder</a>
            </article>
        `;
    }).join('');
}

async function refreshOwnerDashboard() {
    const dashboard = document.getElementById('owner-dashboard');
    if (!dashboard) return;
    const backend = window.achePetBackend;
    const user = backend?.getCurrentUser();
    const summary = document.getElementById('dashboard-summary-text');
    if (!backend?.isConfigured || !user) {
        dashboard.hidden = true;
        return;
    }

    dashboard.hidden = false;
    const requestId = ++dashboardRequest;
    if (summary) summary.textContent = 'Carregando suas ocorrências e conversas…';
    try {
        await backend.ready;
        const [reports, conversations] = await Promise.all([
            backend.listOwnReports(),
            backend.listConversations()
        ]);
        if (requestId !== dashboardRequest) return;

        const incoming = conversations.filter(conversation => conversation.owner_id === user.id);
        if (summary) {
            const latestReport = reports[0] ? reportToAnimal(reports[0]) : null;
            const latestConversationPet = incoming[0]?.report?.name || incoming[0]?.report?.species;
            const latestPost = latestReport
                ? `Última postagem: ${latestReport.name}`
                : 'Você ainda não publicou um pet';
            const contactActivity = incoming.length
                ? `${incoming.length} ${incoming.length === 1 ? 'conversa' : 'conversas'}${latestConversationPet ? ` sobre ${latestConversationPet}` : ''}`
                : 'Nenhuma conversa iniciada ainda';
            summary.textContent = `${latestPost} · ${contactActivity}`;
        }
        renderDashboardReports(reports);
        renderDashboardConversations(conversations, user);
    } catch (error) {
        if (requestId === dashboardRequest && summary) {
            summary.textContent = 'Não foi possível carregar sua atividade agora.';
        }
        console.error('Could not load account activity:', error);
    }
}

function initOwnerDashboard() {
    const dashboard = document.getElementById('owner-dashboard');
    if (!dashboard || dashboard.dataset.initialized === 'true') return;
    dashboard.dataset.initialized = 'true';

    document.getElementById('dashboard-toggle')?.addEventListener('click', event => {
        const content = document.getElementById('dashboard-content');
        const button = event.currentTarget;
        const expanded = button.getAttribute('aria-expanded') === 'true';
        if (!content) return;
        content.hidden = expanded;
        button.setAttribute('aria-expanded', String(!expanded));
        button.textContent = expanded ? 'Ver atividade' : 'Ocultar atividade';
    });
}

document.addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-report]');
    if (!button) return;
    const reportId = decodeURIComponent(button.dataset.deleteReport);
    const isLocalReport = button.dataset.deleteLocal === 'true';
    const confirmMessage = isLocalReport
        ? 'Excluir esta ocorrência salva neste navegador?'
        : 'Excluir esta ocorrência? As conversas ligadas a ela também serão apagadas.';
    if (!window.confirm(confirmMessage)) return;

    button.disabled = true;
    try {
        if (isLocalReport) {
            const deleted = window.achePetStore.helpers.deleteLocalReport(reportId);
            if (!deleted) throw new Error('Esta ocorrência local não foi encontrada.');
        } else {
            await window.achePetBackend.deleteReport(reportId);
            achePetApp.animals = achePetApp.animals.filter(animal => String(animal.id) !== reportId);
        }
        if (document.getElementById('animals-results')) applyAnimalFilters();
        await refreshOwnerDashboard();
    } catch (error) {
        console.error('Could not delete report:', error);
        window.alert(error.message || 'Não foi possível retirar a ocorrência.');
        button.disabled = false;
    }
});

function syncActivitySubscription(user) {
    if (activityChannel) {
        activityChannel.unsubscribe();
        activityChannel = null;
    }
    if (user && window.achePetBackend?.isConfigured) {
        activityChannel = window.achePetBackend.subscribeToActivity(() => {
            refreshOwnerDashboard();
        });
    }
}

function showChatLoginNotice(reportId) {
    const route = `#conversas?reportId=${encodeURIComponent(reportId)}`;
    if (reportId) sessionStorage.setItem('achepetPendingChat', route);
    const notice = document.getElementById('chat-notice');
    if (notice) {
        notice.innerHTML = 'Entre na sua conta para falar com o tutor. <a href="#conta">Entrar ou criar uma conta</a>.';
    }
}

function renderConversationList(conversations, selectedId) {
    const container = document.getElementById('conversation-list');
    if (!container) return;
    if (!conversations.length) {
        container.innerHTML = '<p>Suas conversas aparecerão aqui.</p>';
        return;
    }

    const user = window.achePetBackend.getCurrentUser();
    container.innerHTML = conversations.map(conversation => {
        const reportName = conversation.report?.name || conversation.report?.species || 'Ocorrência';
        const otherPerson = conversation.owner_id === user.id ? 'Pessoa interessada' : 'Tutor do pet';
        return `
            <button type="button" class="conversation-item${conversation.id === selectedId ? ' is-active' : ''}" data-conversation-id="${escapeHTML(conversation.id)}">
                <strong>${escapeHTML(reportName)}</strong>
                <span>${otherPerson}</span>
                <small>${escapeHTML(formatActivityDate(conversation.updated_at))}</small>
            </button>
        `;
    }).join('');
}

function renderChatMessages(messages, user) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    if (!messages.length) {
        container.innerHTML = '<p class="chat-empty">Conversa aberta. Envie uma mensagem para começar.</p>';
        return;
    }

    container.innerHTML = messages.map(message => {
        const ownMessage = message.sender_id === user.id;
        const label = ownMessage ? 'Você' : 'Participante';
        const body = escapeHTML(message.body).replace(/\r?\n/g, '<br>');
        return `
            <article class="chat-message${ownMessage ? ' is-mine' : ''}">
                <span>${label}</span>
                <p>${body}</p>
                <time datetime="${escapeHTML(message.created_at)}">${escapeHTML(formatActivityDate(message.created_at))}</time>
            </article>
        `;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

async function refreshChatMessages(conversationId, generation = chatGeneration) {
    const messages = await window.achePetBackend.listMessages(conversationId);
    if (generation !== chatGeneration || conversationId !== chatConversationId) return;
    renderChatMessages(messages, window.achePetBackend.getCurrentUser());
}

async function selectConversation(conversationId) {
    const generation = ++chatGeneration;
    chatConversationId = conversationId;
    if (chatChannel) {
        chatChannel.unsubscribe();
        chatChannel = null;
    }

    const notice = document.getElementById('chat-notice');
    const form = document.getElementById('chat-form');
    const summary = document.getElementById('chat-report-summary');
    setFormNotice(notice, 'Carregando conversa…');
    if (form) form.hidden = true;

    try {
        const [conversation, messages] = await Promise.all([
            window.achePetBackend.getConversation(conversationId),
            window.achePetBackend.listMessages(conversationId)
        ]);
        if (generation !== chatGeneration) return;
        const report = reportToAnimal(conversation.report || {});
        const user = window.achePetBackend.getCurrentUser();
        const otherPerson = conversation.owner_id === user.id ? 'Pessoa interessada' : 'Tutor do pet';
        if (summary) {
            summary.innerHTML = `
                <img src="${escapeHTML(resolveAssetPath(report.image))}" alt="">
                <div>
                    <strong>${escapeHTML(report.name)}</strong>
                    <span>${escapeHTML(report.status)} · ${escapeHTML(report.city)}</span>
                    <small>Conversando com: ${otherPerson}</small>
                </div>
            `;
        }
        renderChatMessages(messages, user);
        if (form) form.hidden = false;
        setFormNotice(notice, '');
        renderConversationList(await window.achePetBackend.listConversations(), conversationId);
        chatChannel = window.achePetBackend.subscribeToConversation(conversationId, () => {
            refreshChatMessages(conversationId, generation)
                .catch(error => console.error('Could not refresh chat messages:', error));
            refreshOwnerDashboard();
        });
    } catch (error) {
        if (generation === chatGeneration) {
            setFormNotice(notice, error.message || 'Não foi possível carregar esta conversa.', true);
        }
    }
}

async function initChatPage(searchParams) {
    const page = document.getElementById('conversation-list');
    if (!page) return;
    const backend = window.achePetBackend;
    const notice = document.getElementById('chat-notice');
    const reportId = searchParams.get('reportId');

    if (chatChannel) {
        chatChannel.unsubscribe();
        chatChannel = null;
    }
    chatConversationId = null;

    if (!backend?.isConfigured) {
        setFormNotice(notice, 'As conversas online ainda não estão configuradas. Consulte o README para conectar o Supabase.');
        return;
    }

    try {
        await backend.ready;
    } catch (error) {
        setFormNotice(notice, 'Não foi possível conectar ao Supabase.', true);
        console.error('Could not initialize chat:', error);
        return;
    }

    if (!backend.getCurrentUser()) {
        showChatLoginNotice(reportId);
        return;
    }
    if (reportId) sessionStorage.removeItem('achepetPendingChat');

    const chatForm = document.getElementById('chat-form');
    if (chatForm && chatForm.dataset.initialized !== 'true') {
        chatForm.dataset.initialized = 'true';
        chatForm.addEventListener('submit', async event => {
            event.preventDefault();
            if (!chatConversationId) return;
            const messageField = document.getElementById('chat-message');
            const submitButton = chatForm.querySelector('button[type="submit"]');
            if (!messageField) return;
            if (submitButton) submitButton.disabled = true;
            try {
                await backend.sendMessage(chatConversationId, messageField.value);
                messageField.value = '';
                await refreshChatMessages(chatConversationId);
                await refreshOwnerDashboard();
            } catch (error) {
                setFormNotice(notice, error.message || 'Não foi possível enviar a mensagem.', true);
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    page.addEventListener('click', event => {
        const button = event.target.closest('[data-conversation-id]');
        if (button) selectConversation(button.dataset.conversationId);
    });

    try {
        let selectedConversationId = searchParams.get('conversationId');
        if (reportId) {
            const conversation = await backend.openConversation(reportId);
            selectedConversationId = conversation.id;
        }
        const conversations = await backend.listConversations();
        renderConversationList(conversations, selectedConversationId);

        if (selectedConversationId) {
            await selectConversation(selectedConversationId);
        } else {
            setFormNotice(notice, conversations.length
                ? 'Escolha uma conversa para ver as mensagens.'
                : 'Você ainda não tem conversas. Encontre um animal perdido e toque em “Encontrei seu pet”.');
        }
    } catch (error) {
        setFormNotice(notice, error.message || 'Não foi possível abrir as conversas.', true);
    }
}

window.refreshAccountDashboard = refreshOwnerDashboard;

window.addEventListener('achepet:authchange', event => {
    const user = event.detail.user;
    updateAccountNavigation(user);
    renderAccountSession(user);
    syncActivitySubscription(user);
    refreshOwnerDashboard();

    if (user) {
        const pendingRoute = sessionStorage.getItem('achepetPendingChat');
        if (pendingRoute && window.location.hash.startsWith('#conta')) {
            sessionStorage.removeItem('achepetPendingChat');
            window.location.hash = pendingRoute;
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initOwnerDashboard();
    updateAccountNavigation();
    refreshOwnerDashboard();
});
