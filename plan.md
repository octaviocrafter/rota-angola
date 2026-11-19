# Plano — ROTA

## Abordagem
PWA estática, mobile-first e fácil de explicar, com HTML/CSS/JavaScript separados. A página inicial funciona como painel de entrada com pesquisa de destino, mapa Leaflet/OpenStreetMap de Angola, com Luanda como área inicial, cartões de motoristas aprovados no Firestore, aviso de segurança, SOS honesto, partilha de viagem, instalação e alternador claro/escuro. Firebase Hosting aloja o site; Authentication gere contas; Firestore guarda apenas texto, estados, reservas, localização e alertas. Não se usa Storage, fotos ou pagamentos nesta fase.

## Estrutura
- `index.html`: entrada, mapa, pesquisa e ações principais.
- `css/style.css`: design responsivo, azul escuro, laranja de segurança, modo claro/escuro.
- `js/app.js`: navegação, pesquisa, tema, modais e dados de interface.
- `js/map.js`: Leaflet, pontos de Angola, geolocalização e estimativas demonstrativas.
- `js/auth.js`: Authentication real e perfis textuais no Firestore.
- `js/admin.js`: painel administrativo protegido e aprovação de transportes.
- `js/sos.js`: chamada SOS e registo textual opcional no Firestore.
- `js/install.js`: evento `beforeinstallprompt` e instruções de instalação.
- `db/`: schema SQL legado, configuração Firebase pública e módulo Firestore.
- `firestore.rules` + `firebase.json`: regras e publicação Firebase.
- `pages/`: cadastros, painéis e ajuda.
- `manifest.json` + `sw.js`: instalação e cache offline.

## Direção visual
**Mobilidade cívica premium**: navegação em cartões assimétricos, tipografia Manrope/system, contraste alto, azul noite para confiança e laranja vivo exclusivamente para SOS/avisos. Motivos: linha de rota pontilhada, pílulas de estado GPS e marcador circular ROTA. Interações rápidas, com foco em toque.

## Limites conscientes
Os links do Facebook foram conservados como referências de origem, mas não puderam ser descarregados sem autenticação. Foram criados assets locais provisórios para a experiência não depender de um post externo. A integração Firebase aguarda as chaves do projeto.
