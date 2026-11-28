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
- Acesso obrigatório por código numérico de 6 dígitos enviado por e-mail, sem senha
- Perfil com nome, avatar privado e estatísticas de participação
- Encerramento de ocorrência de animal perdido como reencontrado e avaliações entre participantes
- Cadastro e divulgação de animais para adoção
- Edição de ocorrências pelo próprio autor
- Área compacta no topo para acompanhar postagens próprias e conversas recentes
- Remoção de postagens próprias
- Chat privado em tempo real entre quem publicou e quem encontrou o animal
- Denúncias privadas de golpes, pedidos de dinheiro, abuso e suspeita de conta invadida
- Página de mapa com marcadores e filtros de status
- Design acessível com HTML semântico e foco visível
- O acesso às páginas do site exige uma sessão autenticada no Supabase

## Configurar Supabase

1. Crie um projeto no Supabase.
2. No terminal, autentique e vincule o CLI ao projeto: `npx supabase login` e `npx supabase link --project-ref SEU_PROJECT_REF`.
3. Execute `npx supabase db push` para aplicar a migration inicial em `supabase/migrations/`. Ela mantém o banco alinhado ao schema atual. Como alternativa, execute `supabase/schema.sql` no SQL Editor do painel.
4. Copie a URL do projeto e a chave pública `anon`/`publishable` para `js/supabase-config.js`.
5. Em Authentication → URL Configuration, configure os endereços permitidos do site.
6. Em Authentication → Providers → Email, configure o tamanho do OTP como 6. Em Email Templates, inclua `{{ .Token }}` nos modelos Magic Link e Confirm signup; o fluxo do site verifica o código, não um link mágico.
7. Configure um provedor SMTP confiável e os limites de envio de e-mail no Supabase antes de publicar para usuários reais.
8. Teste criando uma conta com um e-mail válido. O mesmo formulário entra em contas existentes ou cria uma conta nova após validar o código.

**Nunca use a chave `service_role` no navegador nem a envie ao GitHub.** A chave pública é usada no cliente; a segurança dos dados depende das políticas RLS definidas no schema.

As ocorrências antigas guardadas no `localStorage` não são migradas automaticamente, pois não têm um proprietário autenticado associado. O Supabase precisa estar configurado para entrar no site e usar suas funcionalidades.

Denúncias exigem uma conta autenticada e ficam privadas na tabela `abuse_reports`; a revisão é feita pelo responsável do projeto no painel do Supabase. O site não oferece recompensas nem processa pagamentos.

Os avatares ficam em um bucket privado e são exibidos por URLs temporárias apenas para usuários autenticados. Avaliações de 1 a 5 estrelas só podem ser enviadas uma vez por participante em cada conversa, depois de o tutor marcar a ocorrência como reencontrada; o banco valida essa condição por RLS.

## Adicionar novos parceiros

1. Abra `js/app.js`.
2. Adicione um novo objeto no array `achePetApp.partners`.
3. Atualize `name`, `type`, `city`, `description`, `logo` e `contact`.
