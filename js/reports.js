function initReportForm() {
    const form = document.getElementById('report-form');
    if (!form) return;

    initReportPhotoPreview(form);
    form.removeEventListener?.('submit', form._reportHandler);

    const handler = async event => {
        event.preventDefault();
        const notice = document.getElementById('report-notice');
        const backend = window.achePetBackend;
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton?.disabled) return;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Publicando…';
        }

        try {
            const formData = new FormData(form);
            const photoFile = formData.get('photos');
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

            const photo = photoFile?.size ? await prepareReportPhoto(photoFile) : null;
            if (!backend?.isConfigured) {
                report.id = `local-${Date.now()}`;
                if (photo) report.photo_data_url = photo.dataUrl;
                window.achePetStore.helpers.saveReport(report);
                form.reset();
                window.location.hash = 'animais?publicado=local';
                return;
            }

            await backend.ready;
            if (!backend.getCurrentUser()) {
                if (notice) notice.innerHTML = 'Entre na sua conta para publicar. <a href="#conta">Entrar ou criar uma conta</a>.';
                return;
            }

            const savedReport = await backend.createReport(report, photo?.blob || null);
            const animal = reportToAnimal(savedReport);
            achePetApp.animals.unshift(animal);
            form.reset();
            await window.refreshAccountDashboard?.();
            window.location.hash = 'animais?publicado=online';
        } catch (error) {
            console.error('Could not save animal report:', error);
            if (error.reportCreated) {
                achePetApp.animals.unshift(reportToAnimal(error.report));
                form.reset();
                window.location.hash = 'animais?publicado=foto';
            } else if (notice) {
                notice.textContent = error.message || 'Não foi possível publicar a ocorrência.';
            }
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

function initReportPhotoPreview(form) {
    if (form.dataset.photoPreviewInitialized === 'true') return;
    const input = document.getElementById('animal-photos');
    const preview = document.getElementById('animal-photo-preview');
    const image = document.getElementById('animal-photo-preview-image');
    const filename = document.getElementById('animal-photo-preview-name');
    if (!input || !preview || !image || !filename) return;

    form.dataset.photoPreviewInitialized = 'true';
    let previewUrl = null;
    const clearPreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
        image.removeAttribute('src');
        filename.textContent = '';
        preview.hidden = true;
    };

    input.addEventListener('change', () => {
        clearPreview();
        const file = input.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            input.value = '';
            return;
        }
        previewUrl = URL.createObjectURL(file);
        image.src = previewUrl;
        filename.textContent = file.name;
        preview.hidden = false;
    });
    form.addEventListener('reset', clearPreview);
}

async function prepareReportPhoto(file) {
    if (!file.type.startsWith('image/')) {
        throw new Error('Selecione um arquivo de imagem válido.');
    }
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('A foto deve ter no máximo 10 MB.');
    }

    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
        image.close();
        throw new Error('Não foi possível preparar a foto neste navegador.');
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) throw new Error('Não foi possível processar a foto selecionada.');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    return {blob, dataUrl};
}

// keep previous behavior when page loads directly
document.addEventListener('DOMContentLoaded', initReportForm);
