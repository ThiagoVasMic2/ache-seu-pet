const supabaseConfig = window.ACHEPET_SUPABASE_CONFIG || {};
const supabaseFactory = window.supabase?.createClient;
const supabaseClient = supabaseConfig.url && supabaseConfig.anonKey && supabaseFactory
    ? supabaseFactory(supabaseConfig.url, supabaseConfig.anonKey)
    : null;

let currentSession = null;
let currentUser = null;

function updateAuthSession(session) {
    currentSession = session;
    currentUser = session?.user || null;
    const user = currentUser;
    window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('achepet:authchange', {
            detail: {user}
        }));
    }, 0);
}

async function initializeBackend() {
    if (!supabaseClient) return null;

    const {data, error} = await supabaseClient.auth.getSession();
    if (error) throw error;
    updateAuthSession(data.session);
    supabaseClient.auth.onAuthStateChange((_event, session) => updateAuthSession(session));
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

async function signIn(email, password) {
    await requireBackend();
    const {data, error} = await supabaseClient.auth.signInWithPassword({email, password});
    if (error) throw error;
    updateAuthSession(data.session);
    return data.user;
}

async function signUp(email, password) {
    await requireBackend();
    const {data, error} = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`
        }
    });
    if (error) throw error;
    if (data.session) updateAuthSession(data.session);
    return data;
}

async function signOut() {
    await requireBackend();
    const {error} = await supabaseClient.auth.signOut();
    if (error) throw error;
    updateAuthSession(null);
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
    return data.map(conversation => ({
        ...conversation,
        report: Array.isArray(conversation.reports)
            ? conversation.reports[0]
            : conversation.reports
    }));
}

async function openConversation(reportId) {
    const user = await requireUser();
    const report = await getReport(reportId);
    if (!report || report.status !== 'Perdido') {
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
    return {
        ...data,
        report: Array.isArray(data.reports) ? data.reports[0] : data.reports
    };
}

async function listMessages(conversationId) {
    await requireUser();
    const {data, error} = await supabaseClient
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', {ascending: true});
    if (error) throw error;
    return data;
}

async function sendMessage(conversationId, body) {
    const user = await requireUser();
    const trimmedBody = String(body || '').trim();
    if (!trimmedBody || trimmedBody.length > 2000) {
        throw new Error('A mensagem deve ter entre 1 e 2000 caracteres.');
    }
    const {data, error} = await supabaseClient
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            body: trimmedBody
        })
        .select('*')
        .single();
    if (error) throw error;
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
    signIn,
    signUp,
    signOut,
    listReports,
    getReport,
    createReport,
    updateReport,
    listOwnReports,
    deleteReport,
    submitAbuseReport,
    listConversations,
    openConversation,
    getConversation,
    listMessages,
    sendMessage,
    subscribeToConversation,
    subscribeToActivity
};
