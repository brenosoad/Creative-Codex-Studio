# BlinkBio
_by Creative Codex_

Plataforma de link na bio com imagem: um template, uma pasta por cliente e painel do criador.

- `index.html`: template único. `?c=<slug>` carrega `clients/<slug>/config.json`.
- `clients/<slug>/`: config e imagens de cada cliente.
- `painel/`: painel do criador (acesso com `BLINKBIO_ADMIN_KEY`).
- `api/track.js`, `api/stats.js`: contagem de cliques (Upstash Redis).

## Variáveis de ambiente (Vercel)
- `KV_REST_API_URL` e `KV_REST_API_TOKEN` (já existem no projeto do site) (Marketplace → Upstash Redis, geradas sozinhas)
- `BLINKBIO_ADMIN_KEY` (sua chave do painel)

## Novo cliente
Copie `clients/sancaporai`, edite `config.json` e as imagens. Cada cliente usa `"analytics": "/api/blinkbio/track"`.

## Teste local
`npx vercel dev` (variáveis em `.env.local`).
