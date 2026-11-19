# ROTA — configuração Firebase

## Serviços usados

- Firebase Hosting para alojar os ficheiros estáticos.
- Firebase Authentication com e-mail e palavra-passe.
- Cloud Firestore em `eur3` para perfis, motoristas, localizações, reservas e alertas.
- Sem Firebase Storage nesta fase.
- Sem pagamentos online.
- Sem SMS/WhatsApp automático nesta fase.

## Administrador Principal

A conta principal é `octaviomagrelo940@gmail.com`. As regras Firestore reconhecem este e-mail como Principal. A palavra-passe nunca é guardada neste repositório.

Para outros administradores: criar primeiro a conta no Authentication, copiar o UID e autorizar o UID no painel do Principal. O painel apenas grava o perfil; não cria contas Authentication nem altera palavras-passe.

## SOS sem promessas

O botão SOS regista um alerta textual no Firestore quando existe sessão iniciada e abre uma chamada telefónica para `112` (ou para o número configurado no armazenamento local do dispositivo). Se não houver Internet, a chamada ainda pode ser iniciada pelo telemóvel, mas o alerta online pode não ser gravado. Não existe SMS automático, WhatsApp automático ou central de emergência própria.

## Custos

Firebase Authentication por e-mail, Firestore dentro da quota gratuita e Firebase Hosting dentro da quota gratuita não exigem activar Storage nem adicionar cartão para começar. Ainda assim, nenhuma quota gratuita é ilimitada: leituras, escritas, armazenamento Firestore, tráfego e alojamento têm limites. Ultrapassar quotas ou activar produtos pagos pode exigir faturação. O mapa usa tiles públicos do OpenStreetMap, sujeitos à política do fornecedor. Monitorizar quotas no Firebase Console antes de testes grandes.

## Publicação local

Instalar Firebase CLI, iniciar sessão e, na raiz deste projecto, executar:

```bash
firebase use rota-angola
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

A primeira publicação deve ser feita pelo proprietário da conta Firebase. Rever o conteúdo de `firestore.rules` antes de qualquer teste com pessoas reais.
