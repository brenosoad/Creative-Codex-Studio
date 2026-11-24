# BlinkBio
_by Creative Codex_

Plataforma de link na bio com imagem: um template, uma página por cliente, editor e painel de resultados.

- `index.html`: template único. `?c=<slug>` carrega o cliente (banco primeiro, `clients/<slug>/config.json` como reserva).
- `painel/`: painel do criador. Aba **Resultados** (cliques, origem, horários) e aba **Clientes** (editor com prévia, upload de fotos e publicação na hora).
- `api/blinkbio/`: `track` (cliques), `stats` (resultados), `clients` (config dos clientes), `img` (fotos). Banco: Redis (`KV_REST_API_*` ou `UPSTASH_REDIS_REST_*`).
- `clients/`: clientes antigos em arquivo. Ao salvar no editor, a versão do banco passa a valer.

## Chave do painel
`BLINKBIO_ADMIN_KEY` (variável de ambiente). Sem ela, vale a chave definida em `api/blinkbio/_auth.js`.

## Novo cliente
Painel → Clientes → Novo cliente → preencher → Salvar e publicar.
