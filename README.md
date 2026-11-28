# Ache Seu Pet

Plataforma web para conectar pessoas, tutores, voluntários, centros de adoção e serviços de proteção animal.

## Objetivo

O projeto oferece uma experiência moderna para encontrar animais perdidos, registrar animais encontrados, apoiar resgates, divulgar casos de adoção e criar uma rede de parceiros.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript moderno (ES6+)
- Leaflet.js + OpenStreetMap para mapa (página de mapa)
- Supabase Auth, Postgres, Row Level Security e Realtime para contas e conversas

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

1. Configure o Supabase conforme a seção abaixo.
2. Sirva o projeto por HTTP local (por exemplo, com a extensão Live Server do VS Code); não abra `index.html` como `file://`.
3. Abra o endereço local no navegador.

## Funcionalidades

- Header responsivo com menu mobile
- Página inicial com hero, busca rápida, categorias, adição de cards e parceiros
- Busca de animais com filtros por tipo, situação, cidade e raio
- Cadastro de ocorrências associado à conta autenticada
- Edição de ocorrências pelo próprio autor
- Área compacta no topo para acompanhar postagens próprias e conversas recentes
- Remoção de postagens próprias
- Chat privado em tempo real entre quem publicou e quem encontrou o animal
- Denúncias privadas de golpes, pedidos de dinheiro, abuso e suspeita de conta invadida
- Página de mapa com marcadores e filtros de status
- Design acessível com HTML semântico e foco visível
- Sem Supabase configurado, ocorrências são salvas apenas no navegador atual e não ficam públicas

## Configurar Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor do projeto, execute `supabase/schema.sql`. O script cria as tabelas, políticas RLS, publicação Realtime, bucket público de fotos e a fila privada de denúncias. Se já executou uma versão anterior, execute novamente para aplicar as atualizações.
3. Copie a URL do projeto e a chave pública `anon`/`publishable` para `js/supabase-config.js`.
4. Em Authentication → URL Configuration, adicione o endereço local e o domínio publicado à lista de URLs permitidas para redirecionamento.
5. Teste criando uma conta com e-mail válido. Se a confirmação de e-mail estiver habilitada, confirme a mensagem antes de entrar.

**Nunca use a chave `service_role` no navegador nem a envie ao GitHub.** A chave pública é usada no cliente; a segurança dos dados depende das políticas RLS definidas no schema.

As ocorrências antigas guardadas no `localStorage` não são migradas automaticamente, pois não têm um proprietário autenticado associado. Sem Supabase, ocorrências e fotos ficam apenas no navegador atual.

Denúncias exigem uma conta autenticada e ficam privadas na tabela `abuse_reports`; a revisão é feita pelo responsável do projeto no painel do Supabase. O site não oferece recompensas nem processa pagamentos.

## Adicionar novos parceiros

1. Abra `js/app.js`.
2. Adicione um novo objeto no array `achePetApp.partners`.
3. Atualize `name`, `type`, `city`, `description`, `logo` e `contact`.
