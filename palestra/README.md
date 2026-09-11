# Palestra Móveis Planejados

Site institucional da Palestra Móveis Planejados — cozinhas, dormitórios, closets, home office e projetos comerciais sob medida, em Ibaté-SP.

🔗 **Site no ar:** _(adicione aqui o link do GitHub Pages depois de publicar)_

## Sobre o projeto

Site estático (HTML, CSS e JavaScript puros, sem framework), com:

- Seções: hero, categorias interativas, sobre, "por que investir em planejados", como funciona, serviços, portfólio, FAQ, depoimentos e contato
- Modal de orçamento que monta uma mensagem formatada e envia direto pro WhatsApp da empresa
- Tela de carregamento (splash) com o logo se desenhando em SVG animado
- Menu mobile, carrossel de depoimentos, accordion de FAQ, contador animado de estatísticas
- Totalmente responsivo (prioridade pra celular)
- SEO básico: meta tags, Open Graph, dados estruturados (JSON-LD), `robots.txt` e `sitemap.xml`

## Estrutura de arquivos

```
.
├── index.html          # página única do site
├── style.css           # todo o CSS
├── script.js           # toda a interatividade
├── assets/
│   ├── logo.png         # logo (rodapé)
│   ├── logo2.png        # logo (favicon / cabeçalho, quando aplicável)
│   └── hero.png          # imagem de fundo do topo
├── robots.txt
├── sitemap.xml
└── _headers             # regras de cache (só tem efeito na Netlify/Cloudflare Pages)
```

## Rodar localmente

Não precisa de instalação nem build. Só abrir o `index.html` num navegador, ou rodar um servidor local simples:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Publicar

O projeto está pronto pra qualquer hospedagem de site estático (GitHub Pages, Netlify, Vercel, cPanel, etc). Todos os caminhos são relativos, então funciona tanto na raiz do domínio quanto numa subpasta.

**GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / `(root)`.

## Antes de ir pra produção

- [x] CNPJ real (31.016.221/0001-81)
- [x] Endereço completo com número
- [x] Instagram (@palestraplanejados)
- [ ] Confirmar/trocar o domínio usado nas tags `canonical` e `og:url` do `<head>`
- [ ] Trocar as fotos do portfólio (hoje são fotos temporárias do Unsplash) pelas fotos reais dos projetos
- [ ] Confirmar o horário de funcionamento usado nos dados estruturados (JSON-LD)
- [ ] Confirmar e-mail de contato (contato@palestramoveis.com.br é um placeholder)

## Créditos

Desenvolvido por [Creative Codex Studio](https://creativecodexstudio.netlify.app/).
