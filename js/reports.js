function initReportForm() {
    const form = document.getElementById('report-form');
    if (!form) return;

    form.removeEventListener?.('submit', form._reportHandler);

    const handler = async event => {
        event.preventDefault();
        const notice = document.getElementById('report-notice');
        const backend = window.achePetBackend;
        if (!backend?.isConfigured) {
            if (notice) notice.textContent = 'O sistema de publicação ainda não está configurado. Consulte a configuração do Supabase no README.';
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton?.disabled) return;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Publicando…';
        }

        try {
            await backend.ready;
            if (!backend.getCurrentUser()) {
                if (notice) notice.innerHTML = 'Entre na sua conta para publicar. <a href="#conta">Entrar ou criar uma conta</a>.';
                return;
            }

            const formData = new FormData(form);
            const report = {
                eventType: formData.get('eventType'),
                name: formData.get('name'),
                species: formData.get('species'),
                breed: formData.get('breed'),
                sex: formData.get('sex'),
                color: formData.get('color'),
                characteristics: formData.get('characteristics'),
                date: formData.get('date'),
                city: formData.get('city'),
                region: formData.get('region'),
                description: formData.get('description')
            };

            const savedReport = await backend.createReport(report);
            const animal = reportToAnimal(savedReport);
            achePetApp.animals.unshift(animal);
            if (notice) notice.textContent = 'Ocorrência publicada. Ela já aparece na busca e ficará vinculada à sua conta.';
            form.reset();
            await window.refreshAccountDashboard?.();
        } catch (error) {
            console.error('Could not save animal report:', error);
            if (notice) notice.textContent = error.message || 'Não foi possível publicar a ocorrência.';
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar ocorrência';
            }
        }
    };

    form.addEventListener('submit', handler);
    form._reportHandler = handler;
}

// keep previous behavior when page loads directly
document.addEventListener('DOMContentLoaded', initReportForm);
