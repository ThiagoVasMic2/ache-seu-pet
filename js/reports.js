function initReportForm() {
    const form = document.getElementById('report-form');
    if (!form) return;

    // avoid duplicate handlers
    form.removeEventListener?.('submit', form._reportHandler);

    const handler = event => {
        event.preventDefault();
        const formData = new FormData(form);
        const report = {
            id: Date.now(),
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
            description: formData.get('description'),
            contact: formData.get('contact'),
            createdAt: new Date().toISOString(),
            status: 'Recebido',
            source: 'localStorage'
        };

        saveReport(report);
        alert('Ocorrência registrada localmente. Em uma versão futura, ela será enviada para um backend seguro.');
        form.reset();
    };

    form.addEventListener('submit', handler);
    form._reportHandler = handler;
}

// keep previous behavior when page loads directly
document.addEventListener('DOMContentLoaded', initReportForm);
