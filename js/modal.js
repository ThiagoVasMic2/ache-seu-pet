function showAnimalDetail(animal) {
    const container = document.getElementById('animal-detail');
    if (!container) return;
    const imagePath = escapeHTML(resolveAssetPath(animal.image));
    const user = window.achePetBackend?.getCurrentUser();
    const contactLink = animal.status === 'Perdido'
        && animal.ownerId
        && animal.ownerId !== user?.id
        ? `<a href="#conversas?reportId=${encodeURIComponent(animal.id)}" class="button button-primary">Encontrei seu pet</a>`
        : '';
    container.innerHTML = `
        <article class="partner-card">
            <div style="display:grid;gap:1.5rem;">
                <div style="display:grid;gap:1rem;">
                    <img src="${imagePath}" alt="Foto de ${escapeHTML(animal.name)}" loading="lazy">
                    <div>
                        <span class="eyebrow">${escapeHTML(animal.species)}</span>
                        <h1>${escapeHTML(animal.name)}</h1>
                        <span class="status-badge ${setStatusClass(animal.status)}">${escapeHTML(animal.status)}</span>
                    </div>
                </div>
                <div style="display:grid;gap:1rem;">
                    <p><strong>Raça:</strong> ${escapeHTML(animal.breed || 'Não informada')}</p>
                    <p><strong>Sexo:</strong> ${escapeHTML(animal.sex || 'Não informado')}</p>
                    <p><strong>Cor:</strong> ${escapeHTML(animal.color || 'Não informada')}</p>
                    <p><strong>Características:</strong> ${escapeHTML(animal.characteristics || 'Não informadas')}</p>
                    <p><strong>Data:</strong> ${escapeHTML(animal.date)}</p>
                    <p><strong>Localização aproximada:</strong> ${escapeHTML(animal.region || 'Região não informada')}, ${escapeHTML(animal.city)}</p>
                    <p>${escapeHTML(animal.description)}</p>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:1rem;">
                    ${contactLink}
                    <button class="button button-secondary" type="button" onclick="alert('Função simulada: compartilhar ocorrência.');">Compartilhar ocorrência</button>
                </div>
            </div>
        </article>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const params = getQueryParams();
    const id = params.get('id');
    if (id) {
        const animal = getAnimalById(id);
        if (animal) {
            showAnimalDetail(animal);
        } else {
            document.getElementById('animal-detail').innerHTML = '<p>Animal não encontrado.</p>';
        }
    }
});
