function setAbuseReportNotice(message, isError = false) {
    const notice = document.getElementById('abuse-report-notice');
    if (!notice) return;
    notice.textContent = message;
    notice.classList.toggle('is-error', isError);
}

document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-report-abuse]');
    const dialog = document.getElementById('abuse-report-dialog');
    if (!dialog) return;

    if (trigger) {
        const form = document.getElementById('abuse-report-form');
        form.reset();
        form.dataset.reportId = decodeURIComponent(trigger.dataset.reportAbuse);
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = false;
        setAbuseReportNotice('');
        dialog.showModal();
        return;
    }

    if (event.target.closest('[data-close-abuse-dialog]')) {
        dialog.close();
    } else if (event.target === dialog) {
        dialog.close();
    }
});

document.addEventListener('submit', async event => {
    const form = event.target.closest('#abuse-report-form');
    if (!form) return;
    event.preventDefault();

    const backend = window.achePetBackend;
    if (!backend?.isConfigured) {
        setAbuseReportNotice('O envio de denúncias exige que o Supabase esteja configurado.', true);
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    setAbuseReportNotice('Enviando denúncia…');

    try {
        const formData = new FormData(form);
        await backend.submitAbuseReport(
            form.dataset.reportId,
            formData.get('reason'),
            formData.get('details')
        );
        setAbuseReportNotice('Denúncia enviada para análise. Não faça pagamentos nem compartilhe dados financeiros.');
    } catch (error) {
        console.error('Could not submit abuse report:', error);
        const message = error.message === 'Entre na sua conta para continuar.'
            ? 'Entre na sua conta para enviar a denúncia.'
            : error.message || 'Não foi possível enviar a denúncia.';
        setAbuseReportNotice(message, true);
        if (submitButton) submitButton.disabled = false;
    }
});
