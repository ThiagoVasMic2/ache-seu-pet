function showAnimalDetail(animal) {
    const container = document.getElementById('animal-detail');
    if (!container) return;
    const imagePath = resolveAssetPath(animal.image);
    container.innerHTML = `
        <article class="partner-card">
            <div style="display:grid;gap:1.5rem;">
                <div style="display:grid;gap:1rem;">
                    <img src="${imagePath}" alt="Foto de ${animal.name}" loading="lazy">
                    <div>
                        <span class="eyebrow">${animal.species}</span>
                        <h1>${animal.name}</h1>
                        <span class="status-badge ${setStatusClass(animal.status)}">${animal.status}</span>
                    </div>
                </div>
                <div style="display:grid;gap:1rem;">
                    <p><strong>Raça:</strong> ${animal.breed}</p>
                    <p><strong>Sexo:</strong> ${animal.sex}</p>
                    <p><strong>Cor:</strong> ${animal.color}</p>
                    <p><strong>Características:</strong> ${animal.characteristics}</p>
                    <p><strong>Data:</strong> ${animal.date}</p>
                    <p><strong>Localização aproximada:</strong> ${animal.region}, ${animal.city}</p>
                    <p>${animal.description}</p>
                    <p><strong>Contato:</strong> ${animal.contact}</p>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:1rem;">
                    <a href="#contato" class="button button-primary">Entrar em contato</a>
                    <button class="button button-secondary" type="button" onclick="alert('Função simulada: compartilhar ocorrência.');">Compartilhar ocorrência</button>
                    <button class="button button-secondary" type="button" onclick="alert('Função simulada: informar que vi este animal.');">Informar que vi este animal</button>
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
