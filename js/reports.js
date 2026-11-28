async function initReportForm(searchParams) {
    const form = document.getElementById('report-form');
    if (!form) return;

    initReportPhotoPreview(form);
    form.removeEventListener?.('submit', form._reportHandler);
    const backend = window.achePetBackend;
    const params = searchParams || new URLSearchParams(window.location.search);
    const editId = params.get('editar');
    const submitButton = form.querySelector('button[type="submit"]');
    const notice = document.getElementById('report-notice');

    if (editId) {
        try {
            let existingReport = window.achePetStore.helpers.getLocalReport(editId);
            const isLocalEdit = Boolean(existingReport);
            if (!existingReport) {
                if (!backend?.isConfigured) throw new Error('Esta ocorrência não está disponível neste navegador.');
                await backend.ready;
                const user = backend.getCurrentUser();
                existingReport = await backend.getReport(editId);
                if (!existingReport || existingReport.owner_id !== user?.id) {
                    throw new Error('Somente quem publicou esta ocorrência pode editá-la.');
                }
            }

            fillReportForm(form, existingReport);
            form.dataset.editReportId = editId;
            form.dataset.editIsLocal = String(isLocalEdit);
            const heading = document.getElementById('report-form-heading');
            if (heading) heading.textContent = 'Corrija ou atualize a ocorrência';
            if (submitButton) submitButton.textContent = 'Salvar alterações';
            const photoNote = document.getElementById('animal-photo-note');
            if (photoNote) photoNote.textContent = 'Selecione uma nova foto somente se quiser substituir a atual.';
        } catch (error) {
            form.hidden = true;
            if (notice) notice.textContent = error.message || 'Não foi possível carregar esta ocorrência para edição.';
            return;
        }
    } else {
        delete form.dataset.editReportId;
        delete form.dataset.editIsLocal;
    }

    const handler = async event => {
        event.preventDefault();
        if (submitButton?.disabled) return;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = form.dataset.editReportId ? 'Salvando…' : 'Publicando…';
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
            const editingReportId = form.dataset.editReportId;
            if (editingReportId && form.dataset.editIsLocal === 'true') {
                const changes = {...report};
                if (photo) changes.photo_data_url = photo.dataUrl;
                const updated = window.achePetStore.helpers.updateLocalReport(editingReportId, changes);
                if (!updated) throw new Error('Esta ocorrência local não foi encontrada.');
                form.reset();
                window.location.hash = 'animais?publicado=local-edit';
                return;
            }

            if (!backend?.isConfigured) {
                if (editingReportId) throw new Error('Não é possível editar esta ocorrência sem conectar ao Supabase.');
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

            const savedReport = editingReportId
                ? await backend.updateReport(editingReportId, report, photo?.blob || null)
                : await backend.createReport(report, photo?.blob || null);
            const animal = reportToAnimal(savedReport);
            achePetApp.animals = achePetApp.animals.filter(item => String(item.id) !== String(animal.id));
            achePetApp.animals.unshift(animal);
            form.reset();
            await window.refreshAccountDashboard?.();
            window.location.hash = editingReportId
                ? 'animais?publicado=atualizado'
                : 'animais?publicado=online';
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
                submitButton.textContent = form.dataset.editReportId ? 'Salvar alterações' : 'Enviar ocorrência';
            }
        }
    };

    form.addEventListener('submit', handler);
    form._reportHandler = handler;
}

function fillReportForm(form, report) {
    const values = {
        name: report.name,
        species: report.species,
        breed: report.breed,
        sex: report.sex,
        color: report.color,
        characteristics: report.characteristics,
        date: report.event_date || report.date,
        city: report.city,
        region: report.region,
        description: report.description
    };
    Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (field) field.value = value || '';
    });

    const eventType = report.event_type || report.eventType;
    const eventOption = Array.from(form.querySelectorAll('input[name="eventType"]'))
        .find(input => input.value === eventType);
    if (eventOption) eventOption.checked = true;
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
