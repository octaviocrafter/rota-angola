# ROTA — configuração Firebase

## Arquitectura de publicação

- GitHub `octaviocrafter/rota-angola`, branch `main`, como código-fonte.
- Firebase Hosting do projecto `rota-angola` como alojamento final.
- GitHub Actions para publicar automaticamente cada push na branch `main`.
- Firebase Authentication com e-mail e palavra-passe.
- Cloud Firestore em `eur3` para perfis, motoristas, localizações, reservas e alertas.
- O `firebase.json` usa a raiz do repositório como `public`, por isso o `index.html` permanece na raiz.
- Os links locais usam caminhos relativos para evitar erros de subpastas durante testes.
- Sem pagamentos online.
- Sem SMS/WhatsApp automático nesta fase.

## Storage e plano Spark

O Storage não pode ser activado no plano Spark actual. A documentação oficial do Firebase informa que o Cloud Storage requer o plano Blaze; no Spark, os buckets e chamadas ao Storage ficam indisponíveis. Por isso o código actual não importa nem usa Storage. Para activar Storage mais tarde, será necessário associar uma conta de faturação e rever as regras; isso não é necessário para o Hosting, Authentication e Firestore desta fase.

## Administrador Principal

A conta principal é `octaviomagrelo940@gmail.com`. As regras Firestore reconhecem este e-mail como Principal. A palavra-passe nunca é guardada neste repositório.

Para outros administradores: criar primeiro a conta no Authentication, copiar o UID e autorizar o UID no painel do Principal. O painel apenas grava o perfil; não cria contas Authentication nem altera palavras-passe.

## SOS sem promessas

O botão SOS regista um alerta textual no Firestore quando existe sessão iniciada e abre uma chamada telefónica para `112` (ou para o número configurado no armazenamento local do dispositivo). Se não houver Internet, a chamada ainda pode ser iniciada pelo telemóvel, mas o alerta online pode não ser gravado. Não existe SMS automático, WhatsApp automático ou central de emergência própria.

## Custos

Firebase Authentication por e-mail, Firestore dentro da quota gratuita e Firebase Hosting dentro da quota gratuita não exigem activar Storage nem adicionar cartão para começar. Ainda assim, nenhuma quota gratuita é ilimitada: leituras, escritas, armazenamento Firestore, tráfego e alojamento têm limites. Ultrapassar quotas ou activar produtos pagos pode exigir faturação. O mapa usa tiles públicos do OpenStreetMap, sujeitos à política do fornecedor. Monitorizar quotas no Firebase Console antes de testes grandes.

## Segredo necessário no GitHub

O workflow `.github/workflows/deploy-firebase-hosting.yml` publica para o canal `live` e precisa do segredo de repositório `FIREBASE_SERVICE_ACCOUNT`. Esse segredo deve conter o JSON de uma conta de serviço com permissão de deploy no Firebase Hosting. Nunca colocar esse JSON no código nem enviá-lo numa conversa.

O Firebase recomenda executar `firebase init hosting:github`, que cria a conta de serviço, guarda a chave como segredo GitHub e escreve o workflow. Como alternativa, o segredo pode ser criado manualmente nas definições do repositório e o workflow que já está neste projecto pode ser usado.

## Publicação manual apenas para configuração inicial

Instalar Firebase CLI, iniciar sessão e, na raiz deste projecto, executar:

```bash
firebase use rota-angola
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

Depois de o segredo estar configurado, não será necessário executar `firebase deploy` no telemóvel: cada `push` para `main` dispara o workflow automático.

A primeira publicação deve ser feita pelo proprietário da conta Firebase. Rever o conteúdo de `firestore.rules` antes de qualquer teste com pessoas reais.
