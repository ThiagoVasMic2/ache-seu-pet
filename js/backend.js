const supabaseConfig = window.ACHEPET_SUPABASE_CONFIG || {};
const supabaseFactory = window.supabase?.createClient;
const supabaseClient = supabaseConfig.url && supabaseConfig.anonKey && supabaseFactory
    ? supabaseFactory(supabaseConfig.url, supabaseConfig.anonKey)
    : null;

let currentSession = null;
let currentUser = null;

function updateAuthSession(session, eventType = 'SIGNED_IN') {
    currentSession = session;
    currentUser = session?.user || null;
    const user = currentUser;
    window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('achepet:authchange', {
            detail: {user, eventType}
        }));
    }, 0);
}

async function initializeBackend() {
    if (!supabaseClient) return null;

    const {data, error} = await supabaseClient.auth.getSession();
    if (error) throw error;
    updateAuthSession(data.session, 'INITIAL_SESSION');
    supabaseClient.auth.onAuthStateChange((event, session) => updateAuthSession(session, event));
    return data.session;
}

const backendReady = initializeBackend();
backendReady.catch(error => console.error('Supabase initialization failed:', error));

async function requireBackend() {
    if (!supabaseClient) {
        throw new Error('Supabase ainda não foi configurado neste site.');
    }
    await backendReady;
}

async function requireUser() {
    await requireBackend();
    if (!currentUser) throw new Error('Entre na sua conta para continuar.');
    return currentUser;
}

function normalizePhone(value) {
    const rawPhone = String(value || '').trim();
    const digits = rawPhone.replace(/\D/g, '');
    if (rawPhone.startsWith('+')) {
        if (digits.length < 10 || digits.length > 15 || digits.startsWith('0')) {
            throw new Error('Informe um telefone válido com código do país.');
        }
        return `+${digits}`;
    }
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        return `+${digits}`;
    }
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
    throw new Error('Informe um telefone válido com DDI, como +55 11 99999-9999.');
}

async function createAccount({displayName, email, password, whatsappPhone}) {
    await requireBackend();
    const normalizedName = String(displayName || '').trim();
    if (normalizedName.length < 2 || normalizedName.length > 40) {
        throw new Error('O nome deve ter entre 2 e 40 caracteres.');
    }
    if (String(password || '').length < 8) {
        throw new Error('A senha precisa ter pelo menos 8 caracteres.');
    }
    const phone = whatsappPhone ? normalizePhone(whatsappPhone) : '';
    const {data, error} = await supabaseClient.auth.signUp({
        email: String(email || '').trim().toLowerCase(),
        password,
        options: {
            data: {
                display_name: normalizedName,
                whatsapp_phone: phone
            }
        }
    });
    if (error) throw error;
    return data;
}

async function requestEmailCode(email) {
    await requireBackend();
    const {data, error} = await supabaseClient.auth.signInWithOtp({
        email: String(email || '').trim().toLowerCase(),
        options: {shouldCreateUser: false}
    });
    if (error) throw error;
    return data;
}

async function requestPhoneCode(phone) {
    await requireBackend();
    const {data, error} = await supabaseClient.auth.signInWithOtp({
        phone: normalizePhone(phone),
        options: {shouldCreateUser: false}
    });
    if (error) throw error;
    return data;
}

async function resendSignupCode(email) {
    await requireBackend();
    const {data, error} = await supabaseClient.auth.resend({
        type: 'signup',
        email: String(email || '').trim().toLowerCase()
    });
    if (error) throw error;
    return data;
}

async function verifyLoginCode(identifier, token, channel) {
    await requireBackend();
    if (!/^\d{6}$/.test(String(token))) throw new Error('Digite o código de 6 dígitos.');
    const normalizedIdentifier = channel === 'phone'
        ? normalizePhone(identifier)
        : String(identifier || '').trim().toLowerCase();
    const {data, error} = await supabaseClient.auth.verifyOtp(
        channel === 'phone'
            ? {phone: normalizedIdentifier, token, type: 'sms'}
            : {email: normalizedIdentifier, token, type: 'email'}
    );
    if (error) throw error;
    updateAuthSession(data.session);
    return data;
}

async function verifySignupCode(email, token) {
    await requireBackend();
    if (!/^\d{6}$/.test(String(token))) throw new Error('Digite o código de 6 dígitos enviado por e-mail.');
    const {data, error} = await supabaseClient.auth.verifyOtp({
        email: String(email || '').trim().toLowerCase(),
        token,
        type: 'signup'
    });
    if (error) throw error;
    updateAuthSession(data.session);
    return data;
}

async function requestPhoneVerification(phone) {
    await requireUser();
    const normalizedPhone = normalizePhone(phone);
    const {data, error} = await supabaseClient.auth.updateUser({phone: normalizedPhone});
    if (error) throw error;
    return data;
}

async function verifyPhoneCode(phone, token) {
    await requireUser();
    const normalizedPhone = normalizePhone(phone);
    if (!/^\d{6}$/.test(String(token))) throw new Error('Digite o código SMS de 6 dígitos.');
    const {data, error} = await supabaseClient.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: 'phone_change'
    });
    if (error) throw error;
    updateAuthSession(data.session || currentSession);
    return data;
}

async function signOut() {
    await requireBackend();
    const {error} = await supabaseClient.auth.signOut();
    if (error) throw error;
    updateAuthSession(null, 'SIGNED_OUT');
}

async function listReports() {
    await requireBackend();
    const {data, error} = await supabaseClient
        .from('reports')
        .select('*')
        .order('created_at', {ascending: false});
    if (error) throw error;
    return data.map(addReportPhotoUrl);
}

function addReportPhotoUrl(report) {
    if (!report.photo_path) return report;
    const {data} = supabaseClient.storage.from('report-photos').getPublicUrl(report.photo_path);
    return {...report, photo_url: data.publicUrl};
}

async function getReport(reportId) {
    await requireBackend();
    const {data, error} = await supabaseClient
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .maybeSingle();
    if (error) throw error;
    return data ? addReportPhotoUrl(data) : null;
}

async function createReport(fields, photoFile = null) {
    const user = await requireUser();
    const report = {
        owner_id: user.id,
        event_type: fields.eventType,
        name: fields.name || '',
        species: fields.species,
        breed: fields.breed || '',
        sex: fields.sex || '',
        color: fields.color || '',
        characteristics: fields.characteristics || '',
        event_date: fields.date,
        city: fields.city,
        region: fields.region || '',
        description: fields.description
    };
    const {data, error} = await supabaseClient
        .from('reports')
        .insert(report)
        .select('*')
        .single();
    if (error) throw error;

    if (!photoFile) return data;

    const photoPath = `${user.id}/${data.id}.jpg`;
    const storage = supabaseClient.storage.from('report-photos');
    let uploadError;
    try {
        ({error: uploadError} = await storage.upload(photoPath, photoFile, {
            contentType: 'image/jpeg',
            upsert: false
        }));
    } catch (error) {
        uploadError = error;
    }
    if (uploadError) {
        throw Object.assign(new Error(`Ocorrência publicada, mas a foto não foi enviada: ${uploadError.message}`), {
            reportCreated: true,
            report: data
        });
    }

    const {data: updatedReport, error: updateError} = await supabaseClient
        .from('reports')
        .update({photo_path: photoPath})
        .eq('id', data.id)
        .eq('owner_id', user.id)
        .select('*')
        .single();
    if (updateError) {
        try {
            const {error: cleanupError} = await storage.remove([photoPath]);
            if (cleanupError) console.error('Could not clean up an unlinked report photo:', cleanupError);
        } catch (cleanupError) {
            console.error('Could not clean up an unlinked report photo:', cleanupError);
        }
        throw Object.assign(new Error(`Ocorrência publicada, mas a foto não foi vinculada: ${updateError.message}`), {
            reportCreated: true,
            report: data
        });
    }
    return addReportPhotoUrl(updatedReport);
}

async function updateReport(reportId, fields, photoFile = null) {
    const user = await requireUser();
    const existingReport = await getReport(reportId);
    if (!existingReport || existingReport.owner_id !== user.id) {
        throw new Error('Esta ocorrência não existe ou não pertence à sua conta.');
    }

    const updates = {
        event_type: fields.eventType,
        name: fields.name || '',
        species: fields.species,
        breed: fields.breed || '',
        sex: fields.sex || '',
        color: fields.color || '',
        characteristics: fields.characteristics || '',
        event_date: fields.date,
        city: fields.city,
        region: fields.region || '',
        description: fields.description
    };
    let newPhotoPath = null;
    const storage = supabaseClient.storage.from('report-photos');
    if (photoFile) {
        newPhotoPath = `${user.id}/${reportId}-${Date.now()}.jpg`;
        const {error: uploadError} = await storage.upload(newPhotoPath, photoFile, {
            contentType: 'image/jpeg',
            upsert: false
        });
        if (uploadError) throw uploadError;
        updates.photo_path = newPhotoPath;
    }

    const {data, error} = await supabaseClient
        .from('reports')
        .update(updates)
        .eq('id', reportId)
        .eq('owner_id', user.id)
        .select('*')
        .maybeSingle();
    if (error || !data) {
        if (newPhotoPath) {
            try {
                const {error: cleanupError} = await storage.remove([newPhotoPath]);
                if (cleanupError) console.error('Could not clean up an unlinked replacement photo:', cleanupError);
            } catch (cleanupError) {
                console.error('Could not clean up an unlinked replacement photo:', cleanupError);
            }
        }
        if (error) throw error;
        throw new Error('Esta ocorrência não foi alterada. Verifique se ela ainda pertence à sua conta.');
    }

    if (newPhotoPath && existingReport.photo_path) {
        try {
            const {error: removeError} = await storage.remove([existingReport.photo_path]);
            if (removeError) console.error('Could not remove the replaced report photo:', removeError);
        } catch (removeError) {
            console.error('Could not remove the replaced report photo:', removeError);
        }
    }
    return addReportPhotoUrl(data);
}

async function listOwnReports() {
    const user = await requireUser();
    const {data, error} = await supabaseClient
        .from('reports')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', {ascending: false});
    if (error) throw error;
    return data.map(addReportPhotoUrl);
}

async function deleteReport(reportId) {
    const user = await requireUser();
    const {data, error} = await supabaseClient
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('owner_id', user.id)
        .select('id')
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('A ocorrência não existe ou não pertence à sua conta.');
}

async function markReportReunited(reportId) {
    const user = await requireUser();
    const {data, error} = await supabaseClient
        .from('reports')
        .update({reunited_at: new Date().toISOString()})
        .eq('id', reportId)
        .eq('owner_id', user.id)
        .eq('event_type', 'Meu animal está perdido')
        .eq('status', 'Perdido')
        .is('reunited_at', null)
        .select('*')
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Não foi possível marcar esta ocorrência como reencontrada.');
    return addReportPhotoUrl(data);
}

async function getProfile(profileId) {
    await requireUser();
    const [profileResult, reportsResult, ratingsResult] = await Promise.all([
        supabaseClient.from('profiles')
            .select('id, display_name, avatar_path, created_at')
            .eq('id', profileId)
            .maybeSingle(),
        supabaseClient.from('reports')
            .select('event_type')
            .eq('owner_id', profileId),
        supabaseClient.from('profile_ratings')
            .select('stars')
            .eq('rated_user_id', profileId)
    ]);
    if (profileResult.error) throw profileResult.error;
    if (reportsResult.error) throw reportsResult.error;
    if (ratingsResult.error) throw ratingsResult.error;
    if (!profileResult.data) return null;

    const reportTypes = reportsResult.data.map(report => report.event_type);
    const stars = ratingsResult.data.map(rating => rating.stars);
    const {data: avatarData, error: avatarError} = profileResult.data.avatar_path
        ? await supabaseClient.storage.from('profile-avatars')
            .createSignedUrl(profileResult.data.avatar_path, 3600)
        : {data: {signedUrl: null}};
    if (avatarError) throw avatarError;
    return {
        ...profileResult.data,
        avatar_url: avatarData.signedUrl,
        stats: {
            found: reportTypes.filter(type => [
                'Encontrei um animal',
                'Encontrei um animal abandonado'
            ].includes(type)).length,
            lost: reportTypes.filter(type => type === 'Meu animal está perdido').length,
            adoption: reportTypes.filter(type => type === 'Animal para adoção').length,
            ratingAverage: stars.length
                ? stars.reduce((total, value) => total + value, 0) / stars.length
                : 0,
            ratingCount: stars.length
        }
    };
}

async function getMyWhatsappPhone() {
    const user = await requireUser();
    const {data, error} = await supabaseClient.rpc('get_my_whatsapp_phone');
    if (error) throw error;
    return data || '';
}

async function updateProfile(displayName, avatarFile = null, whatsappPhone = '') {
    const user = await requireUser();
    const normalizedName = String(displayName || '').trim();
    if (normalizedName.length < 2 || normalizedName.length > 40) {
        throw new Error('O nome do perfil deve ter entre 2 e 40 caracteres.');
    }

    const currentProfileResult = await supabaseClient.from('profiles')
        .select('avatar_path')
        .eq('id', user.id)
        .maybeSingle();
    if (currentProfileResult.error) throw currentProfileResult.error;
    const oldAvatarPath = currentProfileResult.data?.avatar_path || null;
    let newAvatarPath = null;
    const storage = supabaseClient.storage.from('profile-avatars');
    if (avatarFile) {
        const extensionByType = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp'
        };
        const extension = extensionByType[avatarFile.type];
        if (!extension || avatarFile.size > 5 * 1024 * 1024) {
            throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
        }
        newAvatarPath = `${user.id}/${Date.now()}.${extension}`;
        const {error} = await storage.upload(newAvatarPath, avatarFile, {
            contentType: avatarFile.type,
            upsert: false
        });
        if (error) throw error;
    }

    const normalizedPhone = whatsappPhone ? normalizePhone(whatsappPhone) : '';
    const changes = {display_name: normalizedName, whatsapp_phone: normalizedPhone || null};
    if (newAvatarPath) changes.avatar_path = newAvatarPath;
    const {data, error} = await supabaseClient.from('profiles')
        .update(changes)
        .eq('id', user.id)
        .select('id')
        .maybeSingle();
    if (error || !data) {
        if (newAvatarPath) {
            const {error: cleanupError} = await storage.remove([newAvatarPath]);
            if (cleanupError) console.error('Could not clean up an unlinked profile photo:', cleanupError);
        }
        if (error) throw error;
        throw new Error('Não foi possível salvar seu perfil.');
    }

    if (newAvatarPath && oldAvatarPath) {
        const {error: removeError} = await storage.remove([oldAvatarPath]);
        if (removeError) console.error('Could not remove the replaced profile photo:', removeError);
    }
    return getProfile(user.id);
}

async function getMyRating(conversationId) {
    const user = await requireUser();
    const {data, error} = await supabaseClient.from('profile_ratings')
        .select('stars')
        .eq('conversation_id', conversationId)
        .eq('rater_id', user.id)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function rateConversation(conversationId, stars) {
    const user = await requireUser();
    const rating = Number(stars);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('Escolha uma avaliação entre 1 e 5 estrelas.');
    }
    const conversation = await getConversation(conversationId);
    const ratedUserId = conversation.owner_id === user.id
        ? conversation.visitor_id
        : conversation.owner_id;
    const {error} = await supabaseClient.from('profile_ratings').insert({
        conversation_id: conversationId,
        rater_id: user.id,
        rated_user_id: ratedUserId,
        stars: rating
    });
    if (error) throw error;
}

async function submitAbuseReport(reportId, reason, details) {
    const user = await requireUser();
    const allowedReasons = [
        'solicitacao_dinheiro',
        'suspeita_golpe',
        'informacao_falsa',
        'abuso_assedio',
        'suspeita_hack',
        'outro'
    ];
    const trimmedDetails = String(details || '').trim();
    if (!allowedReasons.includes(reason)) {
        throw new Error('Selecione um motivo válido para a denúncia.');
    }
    if (trimmedDetails.length > 2000) {
        throw new Error('Os detalhes da denúncia devem ter no máximo 2000 caracteres.');
    }

    const {error} = await supabaseClient
        .from('abuse_reports')
        .insert({
            report_id: reportId,
            reporter_id: user.id,
            reason,
            details: trimmedDetails
        });
    if (error) throw error;
}

async function listConversations() {
    const user = await requireUser();
    const {data, error} = await supabaseClient
        .from('conversations')
        .select('id, report_id, owner_id, visitor_id, updated_at, reports(name, species, city)')
        .or(`owner_id.eq.${user.id},visitor_id.eq.${user.id}`)
        .order('updated_at', {ascending: false});
    if (error) throw error;
    const participantIds = [...new Set(data.map(conversation =>
        conversation.owner_id === user.id ? conversation.visitor_id : conversation.owner_id
    ))];
    const profiles = await getProfiles(participantIds);
    const profilesById = new Map(profiles.map(profile => [profile.id, profile]));
    return data.map(conversation => ({
        ...conversation,
        otherProfile: profilesById.get(conversation.owner_id === user.id
            ? conversation.visitor_id
            : conversation.owner_id) || null,
        report: Array.isArray(conversation.reports)
            ? conversation.reports[0]
            : conversation.reports
    }));
}

async function getProfiles(profileIds) {
    await requireUser();
    const ids = [...new Set(profileIds.filter(Boolean))];
    if (!ids.length) return [];
    const {data, error} = await supabaseClient.from('profiles')
        .select('id, display_name, avatar_path')
        .in('id', ids);
    if (error) throw error;
    return Promise.all(data.map(async profile => {
        if (!profile.avatar_path) return {...profile, avatar_url: null};
        const {data: avatar, error: avatarError} = await supabaseClient.storage
            .from('profile-avatars')
            .createSignedUrl(profile.avatar_path, 3600);
        if (avatarError) throw avatarError;
        return {...profile, avatar_url: avatar.signedUrl};
    }));
}

async function openConversation(reportId) {
    const user = await requireUser();
    const report = await getReport(reportId);
    if (!report || report.status !== 'Perdido' || report.reunited_at) {
        throw new Error('Esta ocorrência não está mais disponível para contato.');
    }
    if (report.owner_id === user.id) {
        throw new Error('Esta é uma ocorrência da sua própria conta.');
    }

    const {data: existing, error: lookupError} = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('report_id', reportId)
        .eq('visitor_id', user.id)
        .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return existing;

    const {data, error} = await supabaseClient
        .from('conversations')
        .insert({
            report_id: report.id,
            owner_id: report.owner_id,
            visitor_id: user.id
        })
        .select('*')
        .single();
    if (error?.code === '23505') {
        const {data: racedConversation, error: retryError} = await supabaseClient
            .from('conversations')
            .select('*')
            .eq('report_id', reportId)
            .eq('visitor_id', user.id)
            .maybeSingle();
        if (retryError) throw retryError;
        if (racedConversation) return racedConversation;
    }
    if (error) throw error;
    return data;
}

async function getConversation(conversationId) {
    await requireUser();
    const {data, error} = await supabaseClient
        .from('conversations')
        .select('id, report_id, owner_id, visitor_id, updated_at, reports(*)')
        .eq('id', conversationId)
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Conversa não encontrada ou sem permissão de acesso.');
    const conversation = {
        ...data,
        report: Array.isArray(data.reports) ? data.reports[0] : data.reports
    };
    const user = currentUser;
    const otherUserId = conversation.owner_id === user.id
        ? conversation.visitor_id
        : conversation.owner_id;
    const [otherProfile, contactResult] = await Promise.all([
        getProfiles([otherUserId]),
        supabaseClient.rpc('get_conversation_contact', {
            p_conversation_id: conversationId
        })
    ]);
    if (contactResult.error) throw contactResult.error;
    return {
        ...conversation,
        otherProfile: otherProfile[0] || null,
        contact: Array.isArray(contactResult.data) ? contactResult.data[0] || null : contactResult.data
    };
}

async function listMessages(conversationId) {
    await requireUser();
    const {data, error} = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, body, image_path, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', {ascending: true});
    if (error) throw error;
    return Promise.all(data.map(async message => {
        if (!message.image_path) return message;
        const {data: image, error: imageError} = await supabaseClient.storage
            .from('chat-images')
            .createSignedUrl(message.image_path, 3600);
        if (imageError) throw imageError;
        return {...message, image_url: image.signedUrl};
    }));
}

async function sendMessage(conversationId, body, imageFile = null) {
    const user = await requireUser();
    const trimmedBody = String(body || '').trim();
    if ((!trimmedBody && !imageFile) || trimmedBody.length > 2000) {
        throw new Error('A mensagem deve ter entre 1 e 2000 caracteres.');
    }
    let imagePath = null;
    if (imageFile) {
        const extensionByType = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp'
        };
        const extension = extensionByType[imageFile.type];
        if (!extension || imageFile.size > 5 * 1024 * 1024) {
            throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
        }
        imagePath = `${conversationId}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        const {error: uploadError} = await supabaseClient.storage.from('chat-images')
            .upload(imagePath, imageFile, {contentType: imageFile.type, upsert: false});
        if (uploadError) throw uploadError;
    }
    const {data, error} = await supabaseClient
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            body: trimmedBody,
            image_path: imagePath
        })
        .select('*')
        .single();
    if (error) {
        if (imagePath) {
            const {error: cleanupError} = await supabaseClient.storage.from('chat-images').remove([imagePath]);
            if (cleanupError) console.error('Could not clean up an unsent chat image:', cleanupError);
        }
        throw error;
    }
    return data;
}

function subscribeToConversation(conversationId, onMessage) {
    if (!supabaseClient) return null;
    return supabaseClient
        .channel(`conversation-${conversationId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
        }, onMessage)
        .subscribe();
}

function subscribeToActivity(onChange) {
    if (!supabaseClient) return null;
    return supabaseClient
        .channel('account-activity')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversations'
        }, onChange)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, onChange)
        .subscribe();
}

window.achePetBackend = {
    ready: backendReady,
    isConfigured: Boolean(supabaseClient),
    getCurrentUser: () => currentUser,
    getCurrentSession: () => currentSession,
    createAccount,
    requestEmailCode,
    requestPhoneCode,
    resendSignupCode,
    verifyLoginCode,
    verifySignupCode,
    requestPhoneVerification,
    verifyPhoneCode,
    signOut,
    listReports,
    getReport,
    createReport,
    updateReport,
    listOwnReports,
    deleteReport,
    markReportReunited,
    getProfile,
    getMyWhatsappPhone,
    updateProfile,
    getMyRating,
    rateConversation,
    submitAbuseReport,
    listConversations,
    openConversation,
    getConversation,
    listMessages,
    sendMessage,
    subscribeToConversation,
    subscribeToActivity
};
