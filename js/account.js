let activityChannel = null;
let dashboardRequest = 0;
let chatChannel = null;
let chatConversationId = null;
let chatGeneration = 0;
let pendingAuthIdentifier = '';
let pendingAuthChannel = 'email';
let pendingAuthPurpose = 'login';
let pendingRegistration = null;
let activeAuthMode = 'signup';
let currentProfilePreviewUrl = null;
let profileRequest = 0;
let signupAvatarPreviewUrl = null;

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
    const accountLink = document.getElementById('account-nav-link');
    const profileLink = document.getElementById('profile-nav-link');
    if (accountLink) accountLink.hidden = Boolean(user);
    if (profileLink) profileLink.hidden = !user;
    document.body.classList.toggle('is-authenticated', Boolean(user));
    if (user || window.location.hash.startsWith('#conta')) {
        document.body.classList.remove('auth-check-pending');
    }
    if (user) refreshHeaderProfile();
}

function renderAccountSession(user) {
    const signupForm = document.getElementById('auth-signup-form');
    const loginForm = document.getElementById('auth-login-form');
    const codeForm = document.getElementById('auth-code-form');
    const modeSwitch = document.getElementById('auth-mode-switch');
    const session = document.getElementById('account-session');
    const email = document.getElementById('account-email');
    if (!signupForm || !loginForm || !session) return;

    signupForm.hidden = Boolean(user) || Boolean(pendingAuthIdentifier) || activeAuthMode !== 'signup';
    loginForm.hidden = Boolean(user) || Boolean(pendingAuthIdentifier) || activeAuthMode !== 'login';
    if (codeForm) codeForm.hidden = Boolean(user) || !pendingAuthIdentifier;
    if (modeSwitch) modeSwitch.hidden = Boolean(user) || Boolean(pendingAuthIdentifier);
    session.hidden = !user;
    if (email) email.textContent = user?.email || '';
}

function showAuthMode(mode) {
    activeAuthMode = mode;
    pendingAuthIdentifier = '';
    pendingRegistration = null;
    const signupPassword = document.getElementById('auth-signup-password');
    if (signupPassword) signupPassword.value = '';
    updatePasswordStrength('');
    document.getElementById('auth-show-login')?.setAttribute('aria-pressed', String(mode === 'login'));
    document.getElementById('auth-show-signup')?.setAttribute('aria-pressed', String(mode === 'signup'));
    document.getElementById('auth-code-form')?.reset();
    renderAccountSession(null);
    setFormNotice(document.getElementById('auth-notice'), '');
}

function passwordStrength(password) {
    if (!password) return {level: 'empty', label: 'A senha precisa ter pelo menos 8 caracteres.'};
    const categories = [
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password)
    ].filter(Boolean).length;
    if (password.length < 8 || categories < 2) return {level: 'weak', label: 'Senha fraca'};
    if (password.length >= 12 && categories >= 3) return {level: 'strong', label: 'Senha forte'};
    return {level: 'medium', label: 'Senha média'};
}

function updatePasswordStrength(password) {
    const meter = document.getElementById('password-strength');
    const label = document.getElementById('password-strength-label');
    if (!meter || !label) return;
    const strength = passwordStrength(password);
    meter.dataset.strength = strength.level;
    label.textContent = strength.label;
}

async function initAuthPage() {
    const signupForm = document.getElementById('auth-signup-form');
    const loginForm = document.getElementById('auth-login-form');
    const codeForm = document.getElementById('auth-code-form');
    if (!signupForm || !loginForm || !codeForm) return;
    const notice = document.getElementById('auth-notice');
    const backend = window.achePetBackend;
    const signupButton = document.getElementById('auth-signup-submit');
    const loginButton = document.getElementById('auth-login-submit');
    const verifyButton = document.getElementById('auth-verify');
    const resendButton = document.getElementById('auth-resend');
    const changeEmailButton = document.getElementById('auth-change-email');
    const session = document.getElementById('account-session');

    if (!backend?.isConfigured) {
        signupForm.hidden = true;
        loginForm.hidden = true;
        codeForm.hidden = true;
        const modeSwitch = document.getElementById('auth-mode-switch');
        if (modeSwitch) modeSwitch.hidden = true;
        if (session) session.hidden = true;
        const config = window.ACHEPET_SUPABASE_CONFIG || {};
        const setupMessage = config.url && !config.anonKey
            ? 'A URL já está configurada. Falta a chave pública anon/publishable do Supabase.'
            : !config.url
                ? 'A autenticação está indisponível até configurar a URL e a chave pública do Supabase.'
                : 'Não foi possível carregar o cliente do Supabase. Confira se a biblioteca está disponível.';
        setFormNotice(notice, setupMessage);
        return;
    }

    try {
        await backend.ready;
    } catch (error) {
        signupForm.hidden = true;
        loginForm.hidden = true;
        codeForm.hidden = true;
        const modeSwitch = document.getElementById('auth-mode-switch');
        if (modeSwitch) modeSwitch.hidden = true;
        setFormNotice(notice, 'Não foi possível conectar ao Supabase. Confira a configuração do projeto.', true);
        console.error('Could not initialize account page:', error);
        return;
    }

    renderAccountSession(backend.getCurrentUser());
    if (signupForm.dataset.initialized === 'true') return;
    signupForm.dataset.initialized = 'true';

    document.getElementById('auth-show-login')?.addEventListener('click', () => showAuthMode('login'));
    document.getElementById('auth-show-signup')?.addEventListener('click', () => showAuthMode('signup'));

    const signupPassword = document.getElementById('auth-signup-password');
    signupPassword?.addEventListener('input', () => updatePasswordStrength(signupPassword.value));

    const signupAvatar = document.getElementById('auth-signup-avatar');
    signupAvatar?.addEventListener('change', () => {
        const file = signupAvatar.files?.[0];
        const preview = document.getElementById('auth-signup-avatar-preview');
        const placeholder = document.getElementById('auth-signup-avatar-placeholder');
        if (!file || !preview) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            signupAvatar.value = '';
            setFormNotice(notice, 'Escolha uma imagem JPG, PNG ou WebP de até 5 MB.', true);
            return;
        }
        if (signupAvatarPreviewUrl) URL.revokeObjectURL(signupAvatarPreviewUrl);
        signupAvatarPreviewUrl = URL.createObjectURL(file);
        preview.src = signupAvatarPreviewUrl;
        preview.hidden = false;
        if (placeholder) placeholder.hidden = true;
    });

    signupForm.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(signupForm);
        const registration = {
            displayName: String(formData.get('displayName') || '').trim(),
            email: String(formData.get('email') || '').trim().toLowerCase(),
            password: String(formData.get('password') || ''),
            whatsappPhone: String(formData.get('phone') || '').trim(),
            avatarFile: signupAvatar?.files?.[0] || null
        };
        if (signupButton) signupButton.disabled = true;
        setFormNotice(notice, 'Criando seu cadastro e enviando o código…');

        try {
            await backend.createAccount(registration);
            pendingRegistration = {
                displayName: registration.displayName,
                email: registration.email,
                whatsappPhone: registration.whatsappPhone,
                avatarFile: registration.avatarFile
            };
            pendingAuthIdentifier = registration.email;
            pendingAuthChannel = 'email';
            pendingAuthPurpose = 'signup';
            renderAccountSession(null);
            setFormNotice(notice, `Cadastro iniciado. Enviamos um código de confirmação para ${registration.email}.`);
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível autenticar.', true);
        } finally {
            if (signupButton) signupButton.disabled = false;
        }
    });

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        const identifier = String(new FormData(loginForm).get('identifier') || '').trim();
        pendingAuthChannel = identifier.includes('@') ? 'email' : 'phone';
        pendingAuthIdentifier = identifier;
        pendingAuthPurpose = 'login';
        if (loginButton) loginButton.disabled = true;
        setFormNotice(notice, 'Enviando seu código de acesso…');
        try {
            if (pendingAuthChannel === 'phone') await backend.requestPhoneCode(identifier);
            else await backend.requestEmailCode(identifier);
            renderAccountSession(null);
            setFormNotice(notice, `Enviamos um código de 6 dígitos para ${identifier}.`);
        } catch (error) {
            pendingAuthIdentifier = '';
            setFormNotice(notice, error.message || 'Não foi possível enviar o código.', true);
        } finally {
            if (loginButton) loginButton.disabled = false;
        }
    });

    codeForm.addEventListener('submit', async event => {
        event.preventDefault();
        const code = String(new FormData(codeForm).get('code') || '').trim();
        if (!pendingAuthIdentifier) {
            setFormNotice(notice, 'Informe seu e-mail ou telefone novamente para receber um código.', true);
            renderAccountSession(null);
            return;
        }
        if (verifyButton) verifyButton.disabled = true;
        setFormNotice(notice, 'Verificando o código…');
        try {
            if (pendingAuthPurpose === 'signup') {
                await backend.verifySignupCode(pendingAuthIdentifier, code);
                if (!backend.getCurrentUser()) {
                    throw new Error('E-mail confirmado. Entre com seu e-mail para acessar a conta.');
                }
                await backend.updateProfile(
                    pendingRegistration.displayName,
                    pendingRegistration.avatarFile,
                    pendingRegistration.whatsappPhone
                );
                pendingRegistration = null;
                if (signupForm) signupForm.reset();
                if (signupAvatar) signupAvatar.value = '';
                if (signupAvatarPreviewUrl) {
                    URL.revokeObjectURL(signupAvatarPreviewUrl);
                    signupAvatarPreviewUrl = null;
                }
                updatePasswordStrength('');
            } else {
                await backend.verifyLoginCode(pendingAuthIdentifier, code, pendingAuthChannel);
            }
            pendingAuthIdentifier = '';
            renderAccountSession(backend.getCurrentUser());
            setFormNotice(notice, 'Você entrou na sua conta.');
        } catch (error) {
            setFormNotice(notice, error.message || 'Código inválido ou expirado.', true);
        } finally {
            if (verifyButton) verifyButton.disabled = false;
        }
    });

    resendButton?.addEventListener('click', async () => {
        if (!pendingAuthIdentifier) return;
        resendButton.disabled = true;
        setFormNotice(notice, 'Enviando outro código…');
        try {
            if (pendingAuthPurpose === 'signup') {
                await backend.resendSignupCode(pendingAuthIdentifier);
            } else if (pendingAuthChannel === 'phone') {
                await backend.requestPhoneCode(pendingAuthIdentifier);
            } else {
                await backend.requestEmailCode(pendingAuthIdentifier);
            }
            setFormNotice(notice, `Enviamos outro código para ${pendingAuthIdentifier}.`);
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível enviar outro código.', true);
        } finally {
            resendButton.disabled = false;
        }
    });

    changeEmailButton?.addEventListener('click', () => {
        codeForm.reset();
        showAuthMode(pendingAuthPurpose === 'signup' ? 'signup' : 'login');
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

async function refreshHeaderProfile() {
    const backend = window.achePetBackend;
    const user = backend?.getCurrentUser();
    const nameElement = document.getElementById('profile-nav-name');
    const avatarElement = document.getElementById('profile-nav-avatar');
    if (!user || !backend?.isConfigured) return;
    if (nameElement) nameElement.textContent = user.email?.split('@')[0] || 'Meu perfil';
    const requestId = ++profileRequest;
    try {
        const profile = await backend.getProfile(user.id);
        if (requestId !== profileRequest || !profile) return;
        if (nameElement) nameElement.textContent = profile.display_name || 'Meu perfil';
        if (avatarElement) {
            avatarElement.hidden = !profile.avatar_url;
            if (profile.avatar_url) avatarElement.src = profile.avatar_url;
            else avatarElement.removeAttribute('src');
        }
    } catch (error) {
        console.error('Could not load the profile in the header:', error);
    }
}

function renderProfile(profile) {
    const nameInput = document.getElementById('profile-name');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const avatarPlaceholder = document.getElementById('profile-avatar-placeholder');
    const stats = document.getElementById('profile-stat-grid');
    if (nameInput) nameInput.value = profile.display_name || '';
    if (avatarPreview) {
        avatarPreview.hidden = !profile.avatar_url;
        if (profile.avatar_url) avatarPreview.src = profile.avatar_url;
        else avatarPreview.removeAttribute('src');
    }
    if (avatarPlaceholder) avatarPlaceholder.hidden = Boolean(profile.avatar_url);
    const yearJoined = new Date(profile.created_at).getFullYear();
    const rating = profile.stats.ratingAverage
        ? `${profile.stats.ratingAverage.toFixed(1)} ★ (${profile.stats.ratingCount})`
        : 'Ainda sem avaliações';
    if (stats) {
        stats.innerHTML = [
            ['Ano de entrada', Number.isNaN(yearJoined) ? '—' : yearJoined],
            ['Animais encontrados', profile.stats.found],
            ['Ocorrências de animais perdidos', profile.stats.lost],
            ['Animais para adoção', profile.stats.adoption],
            ['Avaliação recebida', rating]
        ].map(([label, value]) => `
            <article class="profile-stat">
                <strong>${escapeHTML(String(value))}</strong>
                <span>${escapeHTML(label)}</span>
            </article>
        `).join('');
    }
}

async function initProfilePage() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    const backend = window.achePetBackend;
    const notice = document.getElementById('profile-notice');
    const contactForm = document.getElementById('profile-contact-form');
    const phoneInput = document.getElementById('profile-whatsapp');
    const phoneCodeForm = document.getElementById('profile-phone-code-form');
    const user = backend?.getCurrentUser();
    if (!backend?.isConfigured || !user) {
        setFormNotice(notice, 'Entre na sua conta para acessar o perfil.', true);
        return;
    }

    try {
        await backend.ready;
        const [profile, whatsappPhone] = await Promise.all([
            backend.getProfile(user.id),
            backend.getMyWhatsappPhone()
        ]);
        if (!profile) throw new Error('Não foi possível encontrar seu perfil.');
        renderProfile(profile);
        if (phoneInput) phoneInput.value = whatsappPhone;
    } catch (error) {
        setFormNotice(notice, error.message || 'Não foi possível carregar seu perfil.', true);
        return;
    }
    if (form.dataset.initialized === 'true') return;
    form.dataset.initialized = 'true';

    document.getElementById('profile-signout-button')?.addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            await backend.signOut();
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível sair da conta.', true);
            button.disabled = false;
        }
    });

    const avatarInput = document.getElementById('profile-avatar');
    avatarInput?.addEventListener('change', () => {
        const file = avatarInput.files?.[0];
        const preview = document.getElementById('profile-avatar-preview');
        const placeholder = document.getElementById('profile-avatar-placeholder');
        if (!file || !preview) return;
        if (currentProfilePreviewUrl) URL.revokeObjectURL(currentProfilePreviewUrl);
        currentProfilePreviewUrl = URL.createObjectURL(file);
        preview.src = currentProfilePreviewUrl;
        preview.hidden = false;
        if (placeholder) placeholder.hidden = true;
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const displayName = new FormData(form).get('displayName');
        const avatarFile = avatarInput?.files?.[0] || null;
        if (button) button.disabled = true;
        setFormNotice(notice, 'Salvando seu perfil…');
        try {
            const profile = await backend.updateProfile(displayName, avatarFile);
            renderProfile(profile);
            if (avatarInput) avatarInput.value = '';
            if (currentProfilePreviewUrl) {
                URL.revokeObjectURL(currentProfilePreviewUrl);
                currentProfilePreviewUrl = null;
            }
            updateAccountNavigation(user);
            setFormNotice(notice, 'Perfil atualizado com sucesso.');
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível salvar seu perfil.', true);
        } finally {
            if (button) button.disabled = false;
        }
    });

    contactForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const button = document.getElementById('profile-save-contact');
        if (button) button.disabled = true;
        setFormNotice(notice, 'Salvando telefone…');
        try {
            const profile = await backend.updateProfile(
                document.getElementById('profile-name')?.value || '',
                null,
                phoneInput?.value || ''
            );
            renderProfile(profile);
            setFormNotice(notice, 'Telefone salvo. Para usar no login, confirme-o por SMS.');
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível salvar o telefone.', true);
        } finally {
            if (button) button.disabled = false;
        }
    });

    document.getElementById('profile-verify-phone')?.addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        setFormNotice(notice, 'Solicitando código SMS…');
        try {
            await backend.requestPhoneVerification(phoneInput?.value || '');
            if (phoneCodeForm) phoneCodeForm.hidden = false;
            setFormNotice(notice, 'Código enviado. Digite-o para confirmar o telefone.');
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível enviar o SMS. Confira a configuração do provedor no Supabase.', true);
        } finally {
            button.disabled = false;
        }
    });

    phoneCodeForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const button = phoneCodeForm.querySelector('button[type="submit"]');
        const code = String(new FormData(phoneCodeForm).get('phoneCode') || '').trim();
        if (button) button.disabled = true;
        setFormNotice(notice, 'Confirmando telefone…');
        try {
            await backend.verifyPhoneCode(phoneInput?.value || '', code);
            phoneCodeForm.reset();
            phoneCodeForm.hidden = true;
            setFormNotice(notice, 'Telefone confirmado. Agora você pode usá-lo para receber códigos de acesso.');
        } catch (error) {
            setFormNotice(notice, error.message || 'Não foi possível confirmar o telefone.', true);
        } finally {
            if (button) button.disabled = false;
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
                ${report.event_type === 'Meu animal está perdido' && !report.reunited_at
                    ? `<button class="button button-secondary" type="button" data-resolve-report="${encodeURIComponent(animal.id)}">Marcar como reencontrado</button>`
                    : ''}
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
    const resolveButton = event.target.closest('[data-resolve-report]');
    if (resolveButton) {
        const reportId = decodeURIComponent(resolveButton.dataset.resolveReport);
        if (!window.confirm('Marcar esta ocorrência como reencontrada? Os participantes poderão avaliar um ao outro.')) return;
        resolveButton.disabled = true;
        try {
            await window.achePetBackend.markReportReunited(reportId);
            const reports = await window.achePetBackend.listReports();
            achePetApp.animals = reports.map(reportToAnimal);
            if (document.getElementById('animals-results')) applyAnimalFilters();
            await refreshOwnerDashboard();
        } catch (error) {
            window.alert(error.message || 'Não foi possível encerrar esta ocorrência.');
            resolveButton.disabled = false;
        }
        return;
    }

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
        const otherPerson = conversation.otherProfile?.display_name || (
            conversation.owner_id === user.id ? 'Pessoa interessada' : 'Tutor do pet'
        );
        const avatar = conversation.otherProfile?.avatar_url
            ? `<img src="${escapeHTML(conversation.otherProfile.avatar_url)}" alt="">`
            : '<span aria-hidden="true">🐾</span>';
        return `
            <button type="button" class="conversation-item${conversation.id === selectedId ? ' is-active' : ''}" data-conversation-id="${escapeHTML(conversation.id)}">
                <span class="conversation-avatar">${avatar}</span>
                <span class="conversation-item-details">
                    <strong>${escapeHTML(otherPerson)}</strong>
                    <span>${escapeHTML(reportName)}</span>
                    <small>${escapeHTML(formatActivityDate(conversation.updated_at))}</small>
                </span>
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
                ${message.image_url ? `<a class="chat-message-image-link" href="${escapeHTML(message.image_url)}" target="_blank" rel="noopener noreferrer"><img class="chat-message-image" src="${escapeHTML(message.image_url)}" alt="Imagem enviada na conversa" loading="lazy"></a>` : ''}
                ${body ? `<p>${body}</p>` : ''}
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
    const contactCard = document.getElementById('chat-contact-card');
    const messageList = document.getElementById('chat-messages');
    setFormNotice(notice, 'Carregando conversa…');
    if (form) form.hidden = true;
    if (contactCard) contactCard.hidden = true;
    if (summary) summary.innerHTML = '';
    if (messageList) messageList.innerHTML = '';
    const messageInput = document.getElementById('chat-message');
    const imageInput = document.getElementById('chat-image');
    const imageName = document.getElementById('chat-image-name');
    if (messageInput) messageInput.value = '';
    if (imageInput) imageInput.value = '';
    if (imageName) imageName.textContent = '';

    try {
        const [conversation, messages] = await Promise.all([
            window.achePetBackend.getConversation(conversationId),
            window.achePetBackend.listMessages(conversationId)
        ]);
        if (generation !== chatGeneration) return;
        const report = reportToAnimal(conversation.report || {});
        const user = window.achePetBackend.getCurrentUser();
        if (summary) {
            summary.innerHTML = `
                <img src="${escapeHTML(resolveAssetPath(report.image))}" alt="">
                <div>
                    <strong>${escapeHTML(report.name)}</strong>
                    <span>${escapeHTML(report.status)} · ${escapeHTML(report.city)}</span>
                    <small>Ocorrência deste animal</small>
                </div>
            `;
        }
        if (contactCard) {
            const profile = conversation.otherProfile || {};
            const contact = conversation.contact || {};
            const displayName = profile.display_name || 'Participante';
            const avatar = profile.avatar_url
                ? `<img src="${escapeHTML(profile.avatar_url)}" alt="">`
                : '<span aria-hidden="true">🐾</span>';
            const emailLink = contact.email
                ? `<a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a>`
                : '<span>E-mail indisponível</span>';
            const phoneDigits = String(contact.whatsapp_phone || '').replace(/\D/g, '');
            const whatsappLink = phoneDigits
                ? `<a href="https://wa.me/${escapeHTML(phoneDigits)}" target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp</a>`
                : '<span>WhatsApp não informado</span>';
            contactCard.innerHTML = `
                <span class="chat-contact-avatar">${avatar}</span>
                <div class="chat-contact-details">
                    <strong>${escapeHTML(displayName)}</strong>
                    <div>${emailLink}${whatsappLink}</div>
                </div>
            `;
            contactCard.hidden = false;
        }
        renderChatMessages(messages, user);
        await renderConversationRating(conversation, user, generation);
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

async function renderConversationRating(conversation, user, generation) {
    const panel = document.getElementById('conversation-rating');
    if (!panel) return;
    if (!conversation.report?.reunited_at) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }

    panel.hidden = false;
    panel.innerHTML = '<p>Carregando avaliação…</p>';
    try {
        const existingRating = await window.achePetBackend.getMyRating(conversation.id);
        if (generation !== chatGeneration) return;
        if (existingRating) {
            panel.innerHTML = `<p>Você já avaliou esta conversa: <strong>${'★'.repeat(existingRating.stars)}${'☆'.repeat(5 - existingRating.stars)}</strong></p>`;
            return;
        }

        const otherPerson = conversation.owner_id === user.id ? 'quem encontrou o pet' : 'o tutor';
        panel.innerHTML = `
            <form id="conversation-rating-form" class="rating-form">
                <label for="conversation-rating-stars">Como foi sua experiência com ${otherPerson}?</label>
                <select id="conversation-rating-stars" name="stars" required>
                    <option value="">Escolha de 1 a 5 estrelas</option>
                    <option value="5">★★★★★ — Excelente</option>
                    <option value="4">★★★★☆ — Boa</option>
                    <option value="3">★★★☆☆ — Regular</option>
                    <option value="2">★★☆☆☆ — Ruim</option>
                    <option value="1">★☆☆☆☆ — Muito ruim</option>
                </select>
                <button class="button button-secondary" type="submit">Enviar avaliação</button>
                <p class="form-notice" id="rating-notice" role="status" aria-live="polite"></p>
            </form>
        `;
        panel.querySelector('#conversation-rating-form')?.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const button = form.querySelector('button[type="submit"]');
            const stars = new FormData(form).get('stars');
            if (button) button.disabled = true;
            try {
                await window.achePetBackend.rateConversation(conversation.id, stars);
                panel.innerHTML = '<p>Obrigado pela avaliação! Sua opinião ajuda a comunidade.</p>';
            } catch (error) {
                setFormNotice(document.getElementById('rating-notice'), error.message || 'Não foi possível enviar a avaliação.', true);
                if (button) button.disabled = false;
            }
        });
    } catch (error) {
        if (generation !== chatGeneration) return;
        panel.innerHTML = `<p class="form-notice is-error">${escapeHTML(error.message || 'Não foi possível carregar a avaliação.')}</p>`;
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
    const imageInput = document.getElementById('chat-image');
    const imageName = document.getElementById('chat-image-name');
    imageInput?.addEventListener('change', () => {
        const file = imageInput.files?.[0];
        if (!file) {
            if (imageName) imageName.textContent = '';
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            imageInput.value = '';
            if (imageName) imageName.textContent = '';
            setFormNotice(notice, 'Escolha uma imagem JPG, PNG ou WebP de até 5 MB.', true);
            return;
        }
        if (imageName) imageName.textContent = file.name;
        setFormNotice(notice, '');
    });
    if (chatForm && chatForm.dataset.initialized !== 'true') {
        chatForm.dataset.initialized = 'true';
        chatForm.addEventListener('submit', async event => {
            event.preventDefault();
            if (!chatConversationId) return;
            const sendingConversationId = chatConversationId;
            const messageField = document.getElementById('chat-message');
            const imageFile = imageInput?.files?.[0] || null;
            const submitButton = chatForm.querySelector('button[type="submit"]');
            if (!messageField) return;
            if (submitButton) submitButton.disabled = true;
            try {
                await backend.sendMessage(sendingConversationId, messageField.value, imageFile);
                if (sendingConversationId !== chatConversationId) return;
                messageField.value = '';
                if (imageInput) imageInput.value = '';
                if (imageName) imageName.textContent = '';
                await refreshChatMessages(sendingConversationId);
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

    if (user && event.detail.eventType === 'SIGNED_IN') {
        if (window.location.hash.startsWith('#conta')) {
            const pendingRoute = sessionStorage.getItem('achepetPendingRoute')
                || sessionStorage.getItem('achepetPendingChat');
            sessionStorage.removeItem('achepetPendingRoute');
            sessionStorage.removeItem('achepetPendingChat');
            if (pendingRoute) {
                window.location.hash = pendingRoute;
            } else {
                history.replaceState({}, '', window.location.pathname + window.location.search);
                loadPage('/', false);
            }
        }
    } else if (!user && window.location.hash && !window.location.hash.startsWith('#conta')) {
        window.location.hash = '#conta';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initOwnerDashboard();
    updateAccountNavigation();
    refreshOwnerDashboard();
});
