<div align="center">
  <img src="public/favicon.svg" width="88" height="88" alt="VirtualGameCard" />

  # VirtualGameCard

  **Gift cards gamer com uma experiência rápida, segura e cheia de personalidade.**

  Escolha a plataforma, defina um valor entre **R$ 5 e R$ 250** e acompanhe seus cards em um só lugar.

  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19-9d7cd8?style=for-the-badge&logo=react&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-6db8ad?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-8-e991b2?style=for-the-badge&logo=vite&logoColor=white" />
  </p>

  <p>
    <a href="#-começando">Começar</a> ·
    <a href="#-recursos">Recursos</a> ·
    <a href="#-arquitetura">Arquitetura</a> ·
    <a href="#-integração-com-o-backend">Backend</a> ·
    <a href="#-deploy-gratuito">Deploy gratuito</a>
  </p>
</div>

---

## ✨ Sobre o projeto

O VirtualGameCard é o frontend de uma plataforma de compra e gerenciamento de créditos digitais para jogos. A interface combina uma estética gamer suave, temas claro e escuro, animações e fluxos demonstrativos completos.

O projeto pode ser executado **sem backend**: o modo mock disponibiliza autenticação, compras, checkout, perfil, notificações e suporte diretamente no navegador.

## 🎮 Recursos

- Catálogo para **Steam, PlayStation, Xbox, Nintendo, Google Play e Roblox**.
- Valores de R$ 5 a R$ 250, em intervalos de R$ 5.
- Checkout demonstrativo completo com PIX e cartão.
- Histórico de compras paginado em 20, 50 ou 100 itens.
- Visualização protegida e cópia do código do gift card.
- Perfil com informações da conta, confirmação de e-mail e troca de senha.
- Central de notificações e abertura de chamados de suporte.
- Recuperação e redefinição de senha.
- Temas pastel claro e gamer escuro — o escuro é o padrão.
- Layout responsivo para desktop e dispositivos móveis.
- Carregamento sob demanda das páginas com `React.lazy` e `Suspense`.

## 🚀 Começando

### Requisitos

- Node.js 20 ou superior
- npm 10 ou superior

### Instalação

```bash
git clone <url-do-repositorio>
cd VirtualGameCardFrontend
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:5174](http://localhost:5174).

> No Windows PowerShell, use `Copy-Item .env.example .env.local` no lugar de `cp`.

### Modo demonstração

Para explorar todas as telas sem executar a API:

```env
VITE_API_URL=http://localhost:8090
VITE_USE_MOCKS=true
```

O login mock aceita qualquer e-mail e senha. Como exemplo:

```text
E-mail: jogador@virtualcard.dev
Senha:  Senha@123
```

Compras, preferências e notificações demonstrativas são mantidas localmente. A sessão de autenticação permanece somente durante a aba atual, em `sessionStorage`.

## 🧭 Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Pública | Login e criação de conta |
| `/esqueci-senha` | Pública | Solicitação de recuperação |
| `/redefinir-senha` | Pública | Definição de uma nova senha |
| `/painel` | Protegida | Configuração e compra do game card |
| `/compras` | Protegida | Histórico, paginação e códigos |
| `/perfil` | Protegida | Conta, segurança e atalhos |
| `/ajuda` | Protegida | FAQ e contato com o suporte |

## 🧩 Arquitetura

O frontend utiliza **Feature-Based Architecture**. Cada domínio reúne sua própria interface, API e regras; somente elementos realmente reutilizáveis ficam em `shared`.

```text
src/
├── app/                         # composição, rotas e lazy loading
├── features/
│   ├── auth/                    # autenticação e recuperação
│   ├── home/                    # experiência principal
│   ├── profile/                 # perfil e segurança
│   ├── purchases/               # compras, cards e checkout
│   └── support/                 # ajuda e chamados
└── shared/
    ├── api/                     # client HTTP, contratos e mocks
    ├── catalog/                 # plataformas disponíveis
    ├── components/              # componentes compartilhados
    ├── hooks/                   # comportamentos reutilizáveis
    ├── notifications/           # central de notificações
    ├── styles/                  # design system e estilos globais
    └── theme/                   # temas claro e escuro
```

### Princípios adotados

- Hooks chamados apenas no topo de componentes ou outros hooks.
- Efeitos globais sempre restaurados no cleanup.
- Custom hooks representam comportamentos reutilizáveis, como bloqueio de scroll e tratamento do ESC.
- Rotas separadas em chunks para reduzir o JavaScript inicial.
- Componentes específicos permanecem dentro da feature proprietária.
- Autorização e validações críticas nunca dependem apenas do frontend.

## 🔌 Integração com o backend

Para consumir a API real:

```env
VITE_API_URL=http://localhost:8090
VITE_USE_MOCKS=false
```

O contrato completo de endpoints, payloads, paginação e erros está em [`docs/backend-contract.md`](docs/backend-contract.md).

O backend correspondente deve executar em `http://localhost:8090` ou liberar no CORS a origem configurada para o frontend.

## 🌍 Deploy gratuito

Este frontend já está preparado para GitHub Pages usando o workflow
[`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml).

### 1. Configurar o GitHub Pages

No repositório do frontend, abra:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Depois disso, todo push em `main` ou `master` publica o build automaticamente.

### 2. Configurar a URL da API

No repositório do frontend, crie uma variável:

```text
Settings → Secrets and variables → Actions → Variables → New repository variable
```

| Nome | Valor |
|---|---|
| `VITE_API_URL` | URL pública da API no Render, exemplo `https://virtualgamecard-api.onrender.com` |

O workflow também define:

```text
GITHUB_PAGES=true
VITE_USE_MOCKS=false
```

Com `GITHUB_PAGES=true`, o Vite usa automaticamente o caminho
`/VirtualGameCardFrontend/`, que é o formato padrão do GitHub Pages para este repositório.

### 3. SPA fallback

O workflow copia `dist/index.html` para `dist/404.html`. Isso permite abrir ou atualizar rotas como:

```text
https://lbss9.github.io/VirtualGameCardFrontend/perfil
https://lbss9.github.io/VirtualGameCardFrontend/compras
```

sem cair em erro 404 do GitHub Pages.

### 4. CORS no backend

Como a aplicação usa refresh token em cookie `HttpOnly`, o backend precisa liberar exatamente a origem do GitHub Pages:

```text
Cors__AllowedOrigins__0=https://lbss9.github.io
```

Não coloque `/VirtualGameCardFrontend` nessa variável. CORS usa somente origem: protocolo + domínio + porta.

## 🔐 Segurança

- Mocks são habilitados somente em desenvolvimento.
- A sessão atual não é persistida em `localStorage`.
- Senhas demonstrativas não são armazenadas em texto puro.
- Conteúdo externo não é inserido com `dangerouslySetInnerHTML`.
- O client trata erros da API por um contrato padronizado.
- Em produção, a evolução recomendada é autenticação por cookie `HttpOnly`, `Secure` e `SameSite`, acompanhada de proteção CSRF no backend.

> O frontend melhora a experiência e reduz riscos, mas preços, pagamentos, propriedade das compras e permissões devem sempre ser validados no servidor.

## 🛠️ Scripts

| Comando | Função |
|---|---|
| `npm run dev` | Inicia o servidor local na porta 5174 |
| `npm run build` | Valida TypeScript e gera o build de produção |
| `npm run lint` | Verifica React, hooks, acessibilidade e imports |
| `npm run preview` | Serve localmente o build gerado |

Antes de entregar uma alteração:

```bash
npm run lint
npm run build
npm audit --audit-level=high
```

## 🎨 Identidade visual

O design combina tons de lilás, rosa, azul e menta com cartões translúcidos, profundidade suave e microinterações. As logos das plataformas ficam em [`public/platforms`](public/platforms), junto das respectivas atribuições.

## 📜 Licença e uso

Este projeto é **público apenas para fins de portfólio, demonstração e revisão de código**.
Ele **não é open source**.

Nenhuma permissão é concedida para copiar, baixar, clonar, modificar, distribuir, hospedar,
comercializar ou criar trabalhos derivados sem autorização prévia e expressa do autor.

Consulte a licença proprietária em [`LICENSE`](LICENSE).

---

<div align="center">
  <strong>VirtualGameCard</strong><br />
  <sub>Escolha. Jogue. Divirta-se. ✦</sub>
</div>
