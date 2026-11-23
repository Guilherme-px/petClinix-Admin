[🇧🇷 Português](README.pt-br.md) | [🇺🇸 English](README.md)

# PetClinix Admin

**🔗 Demo ao Vivo:** [https://petclinix-admin.vercel.app](https://petclinix-admin.vercel.app)
_(Nota: A aplicação consome a API pública hospedada no plano gratuito do Render — a primeira requisição após um período de inatividade pode levar ~50 segundos para completar)_

## 🔑 Conta de Demonstração

Uma conta de demonstração compartilhada está disponível para que recrutadores, revisores e qualquer pessoa avaliando este projeto faça login como administrador de uma clínica e explore toda a plataforma sem precisar configurar nada:

| Campo        | Valor                   |
| ------------ | ----------------------- |
| **E-mail**   | `user.test@email.com`   |
| **Senha**    | `Senha@Teste123`        |

> Por favor, use esta conta com responsabilidade — evite alterações destrutivas grandes para que a experiência de demonstração permaneça intacta para o próximo visitante.

O PetClinix Admin é o front-end web do **PetClinix**, um MVP de SaaS multi-tenant para clínicas veterinárias, projetado e implementado como um projeto de portfólio público para demonstrar práticas de engenharia de front-end: arquitetura em camadas no cliente, UI orientada a componentes, TypeScript estrito e uma cultura de testes que espelha toda a árvore de código-fonte.

Este repositório representa o **estágio público de MVP** do front-end do produto.
Seu propósito é exibir a fundação do lado cliente da plataforma, incluindo o design em camadas, a integração com a API do PetClinix e os primeiros fluxos de negócio centrais.

A API do backend, sua modelagem de domínio e a estratégia geral do produto estão documentadas no repositório da API. Você pode explorar a API em produção através do Swagger UI: [https://petclinix.onrender.com/swagger/index.html](https://petclinix.onrender.com/swagger/index.html).

---

## Propósito

Este front-end foi construído para demonstrar como o pensamento arquitetural do backend se traduz no lado cliente, com um forte foco em:

- Camadas inspiradas na Clean Architecture (domain, application, infrastructure)
- Design de UI orientado a componentes
- TypeScript estrito em todo o código
- Injeção de dependência centralizada (container singleton)
- Tratamento global de erros HTTP mapeado para os error codes da API
- Padrões reativos de composição (composables do Vue, stores do Pinia)
- Testabilidade como preocupação de primeira classe

Em vez de um protótipo rápido, o objetivo é uma fundação de cliente sustentável que possa suportar o crescimento futuro do produto.

---

## Visão do Produto

O PetClinix visa fornecer às clínicas veterinárias uma plataforma centralizada para gerenciar suas operações diárias, equipe, pets, tutores, agendamentos, assinaturas e fluxos de trabalho clínicos.

O web app Admin é onde a equipe da clínica vive no dia a dia: é a superfície onde a equipe gerencia a agenda, cadastra tutores e pets, mantém o catálogo de serviços e controla o plano de assinatura.

No estágio de MVP, o front-end foca em validar os fluxos operacionais centrais da plataforma sobre a API pública.

---

## Escopo do MVP Público

O front-end do MVP público cobre os fluxos de trabalho essenciais da plataforma, incluindo:

- Autenticação (login, esqueci a senha, redefinição de senha)
- Gerenciamento de sessão JWT com refresh token e logout automático
- Calendário e agendamento de consultas
- Gerenciamento de funcionários com limites por plano
- Cadastro de tutores
- Cadastro de pets
- Gerenciamento do catálogo de serviços
- Gerenciamento de perfil (dados do usuário e da clínica)
- Fluxo de assinatura Stripe (redirecionamento para checkout e portal de cobrança)

Este escopo é intencionalmente amplo o suficiente para representar uma fatia vertical realista do produto, ainda sendo limitado a um MVP adequado para demonstração pública.

---

## Arquitetura

O front-end aplica um design em camadas inspirado na Clean Architecture ao lado cliente, mantendo a UI desacoplada dos detalhes de HTTP e tornando cada camada testável de forma independente.

- **`domain/`** — modelos de negócio puros e contratos de repositório. Sem conhecimento de framework ou HTTP.
- **`application/`** — serviços que orquestram casos de uso sobre os contratos de repositório.
- **`infrastructure/`** — cliente HTTP (axios), implementações dos repositórios, DTOs e um container de injeção de dependência singleton.
- **Camada de UI** — páginas, layouts, componentes e composables que consomem os serviços da aplicação.
- **`stores/`** — store Pinia para estado de autenticação e sessão.

### Estrutura atual do projeto

```text
src/
├── application/
│   └── services/              # Orquestração de casos de uso (auth, staff, tutores, pets, agendamentos...)
├── assets/                    # Estilos, ícones e ilustrações estáticas
├── components/
│   ├── appointments/          # Dialog de detalhes do agendamento, legenda de status
│   ├── auth/                  # Formulário de login
│   ├── common/                # DataTable, ConfirmDialog, EmptyState, ListPageLayout
│   ├── forms/                 # Dialogs de formulário de Staff, Tutor, Pet, Service e Appointment
│   ├── profile/               # Formulários de perfil de usuário e clínica
│   └── AppLogo.vue
├── composables/               # Lógica reativa reutilizável (data tables, calendário, portal de cobrança, limite de staff...)
├── domain/
│   ├── models/                # Modelos de negócio como a UI os enxerga
│   └── repositories/          # Contratos de repositório (interfaces)
├── infrastructure/
│   ├── dtos/                  # Formatos de requisição/resposta da API
│   ├── http/                  # Axios HttpClient, refresh de token, error handler
│   ├── repositories/          # Implementações de repositório sobre HTTP
│   └── container.ts           # Container de DI singleton
├── layouts/
│   └── AdminLayout.vue        # Shell autenticado do app (navegação, menu de assinatura)
├── pages/
│   ├── auth/                  # Login, Esqueci a Senha, Redefinir Senha
│   ├── AppointmentsPage.vue
│   ├── PetPage.vue
│   ├── ProfilePage.vue
│   ├── ServicesPage.vue
│   ├── StaffPage.vue
│   └── TutorPage.vue
├── router/                    # Rotas e guards de navegação (auth, apenas admin, apenas convidado)
├── stores/                    # Store Pinia (auth/sessão)
├── utils/                     # Formatadores e helpers
└── __tests__/                 # Testes unitários espelhando a árvore src/ (50+ arquivos de spec)
```

---

## Stack Tecnológica

- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Biblioteca de UI:** Quasar 2 (componentes Material, notificações, dialogs)
- **Gerenciamento de Estado:** Pinia
- **Roteamento:** Vue Router (guards de navegação, rotas com lazy loading)
- **Linguagem:** TypeScript (estrito)
- **Build Tool:** Vite
- **Cliente HTTP:** Axios (interceptors para injeção de JWT e refresh de token)
- **Calendário:** FullCalendar
- **Pagamentos:** Stripe (redirecionamento de checkout e portal de cobrança)
- **Testes Unitários:** Vitest, @vue/test-utils, happy-dom, coverage v8
- **Testes E2E:** Cypress
- **Lint & Formatação:** ESLint, oxlint, oxfmt
- **Gerenciador de Pacotes:** Bun
- **Deploy:** Vercel (rewrites para SPA)

---

## Pré-requisitos

Antes de começar, garanta que você tenha o seguinte instalado em sua máquina:

1. **Node.js 22.18.0**
    - A versão exata está fixada no campo `engines` do `package.json`.
    - Download: [https://nodejs.org](https://nodejs.org)

2. **Bun**
    - Usado como gerenciador de pacotes e executor de scripts.
    - Download: [https://bun.sh](https://bun.sh)

3. **Uma API do PetClinix em execução**
    - Ou uma instância local (veja o README do repositório da API: Docker Compose para o PostgreSQL mais `dotnet run`), ou
    - A API de demonstração pública em [https://petclinix.onrender.com](https://petclinix.onrender.com).

---

## Iniciando

Siga estes passos para configurar e rodar o projeto localmente.

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/petclinix-admin.git
cd petclinix-admin
```

### 2. Instale as dependências

```bash
bun install
```

### 3. Configure a URL da API

A aplicação lê a URL base da API da variável de ambiente `VITE_API_URL` e usa `http://localhost:5180` como fallback quando ela não está definida.

Crie um arquivo `.env.local` na raiz do projeto apontando para a API que você deseja usar:

```bash
# API local (Docker Compose + dotnet run, veja o README do repositório da API)
VITE_API_URL=http://localhost:5180

# Ou a API de demonstração pública
# VITE_API_URL=https://petclinix.onrender.com
```

### 4. Rode a Aplicação

```bash
bun dev
```

Uma vez em execução, abra seu navegador e navegue até `http://localhost:5173`, então faça login com a [conta de demonstração](#-conta-de-demonstração) (ao apontar para a API pública) ou com a sua própria clínica registrada localmente.

### 5. Build de Produção

```bash
bun run build
```

O projeto está pronto para deploy na Vercel: o arquivo `vercel.json` já contém os rewrites de SPA, e a variável de ambiente `VITE_API_URL` deve ser configurada nas configurações do projeto na Vercel.

---

## Testes

O projeto contém uma suíte abrangente de testes unitários que espelha toda a árvore `src/`, além do tooling do Cypress para testes de ponta a ponta. Os testes unitários são rápidos, totalmente isolados e não exigem a API, banco de dados ou Docker.

### Rodar Testes Unitários

```bash
bun test:unit
```

### Rodar Testes Unitários com Cobertura

```bash
bun test:coverage
```

### Rodar Testes E2E

O Cypress roda contra o servidor de desenvolvimento do Vite:

```bash
bun test:e2e:dev
```

Também é possível testar o build de produção antes do deploy:

```bash
bun run build
bun test:e2e
```

---

## Roteiro

- [x] Telas de autenticação (Login, Esqueci a Senha, Redefinir Senha)
- [x] Sessão JWT com refresh token, renovação automática e logout global ao expirar
- [x] Guards de rota (rotas protegidas, apenas convidado e apenas admin)
- [x] Layout admin com navegação e acesso ao portal de cobrança
- [x] Gerenciamento de agendamentos (FullCalendar, dialog de formulário, ciclo de status, dialog de detalhes)
- [x] Gerenciamento de funcionários (CRUD, contador de uso do plano, soft delete, ações de erro de limite do plano)
- [x] Gerenciamento de tutores (CRUD, busca, paginação)
- [x] Gerenciamento de pets (CRUD, vinculados a tutores)
- [x] Gerenciamento do catálogo de serviços (CRUD)
- [x] Gerenciamento de perfil (dados do usuário e da clínica)
- [x] Integração com Stripe (redirecionamento de checkout de assinatura e portal de cobrança)
- [x] Tratamento centralizado de erros HTTP mapeado para os error codes da API
- [x] Suíte de testes unitários espelhando toda a árvore de código-fonte (Vitest + coverage)
- [x] Tooling de E2E com Cypress configurado
- [ ] Expandir a cobertura de testes de ponta a ponta (Cypress)

---

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
