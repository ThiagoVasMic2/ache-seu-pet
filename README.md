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
- Cadastro com nome, e-mail, senha com indicador de força, telefone/WhatsApp opcional e foto
- Login separado por código de 6 dígitos no e-mail; telefone pode ser usado após verificação por SMS
- Perfil com nome, avatar privado, telefone e estatísticas de participação
- Encerramento de ocorrência de animal perdido como reencontrado e avaliações entre participantes
- Cadastro e divulgação de animais para adoção
- Edição de ocorrências pelo próprio autor
- Área compacta no topo para acompanhar postagens próprias e conversas recentes
- Remoção de postagens próprias
- Chat privado em tempo real com avatar e nome, imagens e contatos visíveis apenas aos participantes
- Denúncias privadas de golpes, pedidos de dinheiro, abuso e suspeita de conta invadida
- Página de mapa com marcadores e filtros de status
- Design acessível com HTML semântico e foco visível
- O acesso às páginas do site exige uma sessão autenticada no Supabase

## Configurar Supabase

1. Crie um projeto no Supabase.
2. No terminal, autentique e vincule o CLI ao projeto: `npx supabase login` e `npx supabase link --project-ref SEU_PROJECT_REF`.
3. Execute `npx supabase db push` para aplicar as migrations em `supabase/migrations/`. Se o schema inicial já foi aplicado manualmente, aplique também o conteúdo de `supabase/migrations/20261128171100_accounts_chat_enhancements.sql` no SQL Editor. Para um projeto novo, use `supabase/schema.sql`.
4. Copie a URL do projeto e a chave pública `anon`/`publishable` para `js/supabase-config.js`.
5. Em Authentication → URL Configuration, configure os endereços permitidos do site.
6. Em Authentication → Providers → Email, configure o tamanho do OTP como 6 e mantenha a confirmação de e-mail ativada.
7. Em Authentication → Email Templates, use o assunto `Seu código de acesso ao Ache Seu Pet` e copie o conteúdo de `supabase/templates/auth-otp.html` para os modelos Confirm signup e Magic Link. O template usa `{{ .Token }}` para mostrar o código, não um link mágico.
8. Configure um SMTP próprio e o nome do remetente como `Ache Seu Pet` nas configurações de SMTP do Supabase. Para uma aparência confiável no Gmail, use um domínio verificado com SPF/DKIM; templates personalizados não mudam, sozinhos, o endereço remetente.
9. Configure um provedor SMS em Authentication → Providers para habilitar códigos por telefone e defina nele o remetente “Ache Seu Pet”, quando disponível. O campo de telefone permite escolher o país, formata e valida o número e salva no padrão internacional E.164; essa validação verifica apenas o formato. A confirmação de posse ocorre quando a pessoa informa o código recebido por SMS.
10. Em Authentication → SMS Templates, configure a mensagem, por exemplo: `Ache Seu Pet: seu código de verificação é {{ .Code }}. Não compartilhe este código.`
11. Teste criando uma conta com e-mail, senha e código de confirmação; depois use a opção Entrar para solicitar um novo código. A senha é cadastrada, mas o login do site é por código. Teste também a confirmação por telefone após configurar o provedor SMS.

**Nunca use a chave `service_role` no navegador nem a envie ao GitHub.** A chave pública é usada no cliente; a segurança dos dados depende das políticas RLS definidas no schema.

As ocorrências antigas guardadas no `localStorage` não são migradas automaticamente, pois não têm um proprietário autenticado associado. O Supabase precisa estar configurado para entrar no site e usar suas funcionalidades.

Denúncias exigem uma conta autenticada e ficam privadas na tabela `abuse_reports`; a revisão é feita pelo responsável do projeto no painel do Supabase. O site não oferece recompensas nem processa pagamentos.

Avatares e imagens do chat ficam em buckets privados e são exibidos por URLs temporárias. E-mail e WhatsApp são entregues pelo banco somente aos participantes daquela conversa. Avaliações de 1 a 5 estrelas só podem ser enviadas uma vez por participante em cada conversa, depois de o tutor marcar a ocorrência como reencontrada; o banco valida essa condição por RLS.

## Adicionar novos parceiros

1. Abra `js/app.js`.
2. Adicione um novo objeto no array `achePetApp.partners`.
3. Atualize `name`, `type`, `city`, `description`, `logo` e `contact`.
