# Ache Seu Pet

Plataforma web para conectar pessoas, tutores, voluntários, centros de adoção e serviços de proteção animal.

## Objetivo

O projeto oferece uma experiência moderna para encontrar animais perdidos, registrar animais encontrados, apoiar resgates, divulgar casos de adoção e criar uma rede de parceiros.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript moderno (ES6+)
- Leaflet.js + OpenStreetMap para mapa (página de mapa)

## Estrutura de pastas

/ache-seu-pet
- /assets
  - /images
  - /logo
- /css
- /js
- /pages
- index.html
- README.md

## Como executar

1. Abra o diretório do projeto no Visual Studio Code.
2. Abra `index.html` no navegador.

## Funcionalidades

- Header responsivo com menu mobile
- Página inicial com hero, busca rápida, categorias, adição de cards e parceiros
- Busca de animais com filtros por tipo, situação, cidade e raio
- Página de cadastro de ocorrência com validação básica
- Página de mapa com marcadores e filtros de status
- Uso de `localStorage` para armazenar ocorrências temporárias
- Design acessível com HTML semântico e foco visível

## Arquitetura futura

O projeto está preparado para receber backend com:

- Node.js
- Express
- PostgreSQL ou MongoDB
- Autenticação e autorização
- API de mapas e geolocalização
- Upload seguro de imagens

## Adicionar novos animais

1. Abra `js/app.js`.
2. Adicione um novo objeto no array `achePetApp.animals`.
3. Preencha `id`, `name`, `species`, `status`, `city`, `state`, `region`, `date`, `image` e demais campos.

## Adicionar novos parceiros

1. Abra `js/app.js`.
2. Adicione um novo objeto no array `achePetApp.partners`.
3. Atualize `name`, `type`, `city`, `description`, `logo` e `contact`.
