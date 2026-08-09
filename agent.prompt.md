REFATORAÇÃO VISUAL E RESPONSIVA — ACHE SEU PET

CONTEXTO
========

Estou desenvolvendo o projeto "Ache Seu Pet".

O projeto já possui uma estrutura funcional de páginas, HTML/CSS/JavaScript e assets.

Antes de modificar qualquer coisa, ANALISE o projeto existente.

NÃO recrie o projeto do zero.

NÃO remova funcionalidades existentes.

NÃO substitua tecnologias sem necessidade.

A tarefa principal agora é melhorar o layout, o aproveitamento da tela e a apresentação dos animais.

==================================================
1. PROBLEMAS VISUAIS IDENTIFICADOS
==================================================

Ao visualizar o site atualmente, foram identificados:

- container central muito estreito;
- grandes espaços vazios nas laterais;
- conteúdo excessivamente concentrado no centro;
- cards ocupando pouco espaço horizontal;
- ilustrações das categorias maiores do que deveriam;
- proporções inconsistentes entre imagem e conteúdo;
- pouca informação visual nos cards de animais;
- dificuldade para visualizar vários animais simultaneamente.

O objetivo é criar uma interface moderna, limpa, responsiva e semelhante a uma plataforma real de localização, resgate e adoção de animais.

==================================================
2. ANTES DE ALTERAR
==================================================

Faça uma auditoria do projeto.

Identifique:

- arquivo HTML principal;
- arquivos CSS globais;
- arquivos CSS específicos de páginas;
- JavaScript responsável pela interface;
- componentes existentes, caso seja React;
- containers principais;
- grids;
- cards;
- seção Hero;
- seção de categorias;
- seção de animais;
- header;
- footer;
- sistema de filtros.

Não altere arquivos que não sejam necessários.

Depois faça as alterações diretamente no workspace.

==================================================
3. CONTAINER PRINCIPAL
==================================================

O conteúdo não deve ficar preso em um container estreito.

Adote um layout fluido.

Utilize algo semelhante a:

max-width: 1400px;

com:

width: min(100% - 32px, 1400px);

ou uma solução equivalente.

O objetivo é aproveitar melhor monitores grandes sem deixar o conteúdo colado nas bordas.

Utilize espaçamento lateral adequado.

Em telas muito grandes, o conteúdo deve continuar centralizado.

Em celulares, o conteúdo deve utilizar praticamente toda a largura disponível, mantendo pequenos espaçamentos laterais.

==================================================
4. BREAKPOINTS
==================================================

Crie um layout responsivo consistente.

Desktop grande:
>= 1440px

Desktop:
1200px — 1439px

Tablet:
768px — 1199px

Mobile:
<= 767px

Não dependa exclusivamente de valores fixos.

Prefira:

CSS Grid
Flexbox
clamp()
minmax()
auto-fit
auto-fill

quando apropriado.

==================================================
5. GRID DE CATEGORIAS
==================================================

As categorias atuais são:

Doméstico
Silvestre
Réptil
Aquático
Anfíbio

As imagens oficiais são:

assets/images/Animal-Doméstico.png
assets/images/Animal-Silvestre.png
assets/images/Animal-Réptil.png
assets/images/Animal-Aquático.png
assets/images/Animal-Anfíbio.png

Utilize essas imagens.

NÃO recrie as imagens.

NÃO substitua por outras imagens.

NÃO altere os arquivos PNG.

==================================================
6. TAMANHO DAS IMAGENS DE CATEGORIA
==================================================

As imagens das categorias devem ser visualmente compactas.

Elas NÃO devem dominar o card.

Utilize um espaço de imagem controlado.

Exemplo conceitual:

.category-card img {
    width: 100%;
    max-width: 140px;
    height: 120px;
    object-fit: contain;
}

Adapte os valores ao design existente.

Não utilize imagens gigantes.

Não estique as imagens.

Não distorça proporções.

==================================================
7. GRID DAS CATEGORIAS
==================================================

Desktop:

Preferencialmente 4 ou 5 categorias por linha, dependendo da largura disponível.

Tablet:

2 ou 3 por linha.

Mobile:

1 ou 2 por linha.

A grid deve se adaptar automaticamente ao espaço disponível.

Os cards devem possuir altura visual semelhante.

==================================================
8. HERO
==================================================

A imagem:

assets/images/Hero.png

representa a ideia:

"VOCÊ É UM HERÓI"

Ela deve continuar pequena e proporcional.

NÃO transformar Hero.png em uma imagem gigante.

NÃO utilizar como background ocupando toda a tela.

A seção Hero deve possuir:

- título forte;
- subtítulo explicativo;
- chamada para ação;
- imagem Hero.png;
- layout equilibrado entre texto e imagem.

Em desktop:

texto de um lado;
imagem do outro.

Em mobile:

texto acima;
imagem abaixo.

A imagem deve possuir:

max-width controlado;
height: auto;
object-fit: contain.

==================================================
9. NOVA SEÇÃO DE ANIMAIS
==================================================

Crie ou refatore a seção responsável pela listagem dos animais.

Essa seção deve ser visualmente mais importante do que as categorias.

O objetivo é permitir que o usuário encontre rapidamente um animal.

Utilize cards modernos.

Desktop:

3 ou 4 cards por linha.

Tablet:

2 cards por linha.

Mobile:

1 card por linha.

Utilize CSS Grid.

==================================================
10. CARD DE ANIMAL
==================================================

Cada card deve possuir uma estrutura semelhante a:

┌─────────────────────────────┐
│                             │
│        FOTO DO ANIMAL       │
│                             │
├─────────────────────────────┤
│ STATUS                      │
│                             │
│ Nome do animal              │
│ Espécie / raça              │
│ 📍 Cidade / Bairro          │
│ 📅 Data                     │
│                             │
│ Recompensa: R$ 500          │
│                             │
│ [ ENTRAR EM CONTATO ]       │
└─────────────────────────────┘

A estrutura deve ser limpa e fácil de escanear.

==================================================
11. FOTO DO ANIMAL
==================================================

As fotos reais cadastradas devem ser priorizadas.

O card deve possuir uma área de imagem consistente.

Exemplo:

.pet-card-image {
    width: 100%;
    height: 220px;
    object-fit: cover;
}

Ajuste o tamanho conforme o layout existente.

Todas as imagens devem possuir:

border-radius

e não devem deformar.

==================================================
12. STATUS
==================================================

Cada animal poderá possuir um status.

Exemplos:

"Perdido"
"Encontrado"
"Para Adoção"
"Resgatado"

O status deve aparecer como Badge.

O estilo deve ser visualmente destacado, mas sem exagero.

Não usar somente cores para transmitir informação.

O texto do status deve estar sempre visível.

==================================================
13. DADOS DO ANIMAL
==================================================

Mostrar no card:

Nome
Espécie
Raça, quando disponível
Cidade
Bairro, quando disponível
Data do desaparecimento/cadastro

Exemplo:

Rex
Cachorro • Labrador
📍 São Paulo, Vila Mariana
📅 08/08/2026

Não inventar dados.

Se algum campo não existir, não exibir informação falsa.

==================================================
14. RECOMPENSA
==================================================

Quando houver recompensa cadastrada:

Mostrar:

"Recompensa: R$ 500"

Deve ser uma informação visualmente destacada.

Quando não houver recompensa:

Não mostrar uma recompensa fictícia.

==================================================
15. CONTATO
==================================================

NÃO deixar números de telefone expostos desnecessariamente em todos os cards.

Utilize um botão:

"Entrar em contato"

ou:

"Ver contato"

O comportamento deve respeitar a estrutura de dados existente.

Se o projeto já possui sistema de contato, preserve-o.

Não criar um sistema de backend novo apenas para essa tarefa.

==================================================
16. FILTROS
==================================================

Preserve o sistema de filtros existente.

Se já houver filtros por:

- espécie;
- categoria;
- localização;
- status;

não remova.

Ajuste somente o layout visual se necessário.

Os filtros devem funcionar bem em:

Desktop
Tablet
Mobile

No mobile, os filtros podem ser empilhados ou organizados em um painel compacto.

==================================================
17. HIERARQUIA VISUAL
==================================================

A página deve seguir aproximadamente esta hierarquia:

HEADER
↓
HERO
↓
CATEGORIAS
↓
FILTROS
↓
ANIMAIS
↓
CHAMADA PARA AÇÃO
↓
FOOTER

Não deixar todas as seções com o mesmo peso visual.

O usuário deve entender rapidamente:

1. O que é o Ache Seu Pet.
2. Como procurar um animal.
3. Quais categorias existem.
4. Quais animais estão cadastrados.
5. Como ajudar ou entrar em contato.

==================================================
18. ESPAÇAMENTO
==================================================

Evite:

- grandes espaços vazios;
- elementos colados;
- cards apertados;
- excesso de padding;
- seções sem relação visual.

Utilize um sistema consistente de espaçamento.

Exemplo:

8px
16px
24px
32px
48px
64px

Adapte ao projeto.

==================================================
19. DESIGN
==================================================

Preservar a identidade visual do Ache Seu Pet.

Cores principais:

Verde
Azul escuro
Laranja
Fundos claros

Manter:

- bordas arredondadas;
- sombras suaves;
- tipografia legível;
- aparência amigável;
- estética relacionada à proteção animal.

Não transformar o site em uma interface genérica.

==================================================
20. MOBILE
==================================================

O site precisa funcionar perfeitamente em:

360px
390px
430px

Não permitir:

- scroll horizontal;
- imagens cortadas;
- textos saindo dos cards;
- botões ultrapassando a tela;
- header quebrado;
- grids comprimidas demais.

==================================================
21. ACESSIBILIDADE
==================================================

Todas as imagens relevantes devem possuir alt.

Botões devem possuir textos claros.

Contraste deve ser suficiente.

Não utilizar somente cor para indicar status.

Os elementos interativos devem possuir áreas de clique adequadas.

==================================================
22. PERFORMANCE
==================================================

Não adicionar bibliotecas desnecessárias.

Não duplicar imagens.

Não transformar PNG em SVG artificialmente.

Não criar arquivos desnecessários.

Utilizar os assets existentes.

==================================================
23. NÃO QUEBRAR O QUE JÁ EXISTE
==================================================

É FUNDAMENTAL preservar:

- navegação;
- filtros;
- JavaScript;
- páginas;
- formulários;
- sistema de animais;
- categorias;
- mapa;
- funcionalidades existentes;
- logos oficiais;
- identidade visual.

Faça uma alteração incremental.

==================================================
24. VALIDAÇÃO FINAL
==================================================

Depois de implementar:

Verifique:

Desktop 1920px
Desktop 1440px
Desktop 1366px
Tablet 1024px
Tablet 768px
Mobile 430px
Mobile 390px
Mobile 360px

Verifique especialmente:

- largura do container;
- tamanho das imagens;
- grid;
- cards;
- Hero;
- categorias;
- filtros;
- botões;
- responsividade.

Procure também por:

404
broken image
undefined
console errors
referências de imagens inexistentes.

Se o Node.js estiver disponível, utilize as ferramentas de validação existentes no projeto.

Se Node.js não estiver disponível, NÃO tente instalar automaticamente.

==================================================
25. EXECUÇÃO
==================================================

Não quero somente uma explicação.

Faça as alterações diretamente no workspace.

Antes de modificar arquivos, analise a estrutura atual.

Depois implemente a refatoração.

Não recrie o projeto do zero.

Não remova funcionalidades.

Não invente dados de animais.

Não invente imagens.

Utilize os assets oficiais existentes.

==================================================
26. RELATÓRIO FINAL
==================================================

Ao terminar, informe:

1. Arquivos modificados.
2. Alterações feitas no layout.
3. Alterações feitas nos cards.
4. Alterações feitas nas imagens.
5. Breakpoints utilizados.
6. Se o Hero foi redimensionado.
7. Se as categorias foram reorganizadas.
8. Se os cards de animais foram reorganizados.
9. Se existem erros no console.
10. Se existem imagens quebradas.
11. Se alguma funcionalidade existente precisou ser preservada sem alteração.
