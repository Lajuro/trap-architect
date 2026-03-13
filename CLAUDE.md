# CLAUDE.md — Instruções para Agentes IA

Este arquivo contém instruções que todo agente de IA (Claude, Copilot, etc.) deve seguir ao trabalhar neste repositório.

## Projeto

**Trap Architect** — Portal web + jogo de plataforma 2D troll onde a comunidade cria, compartilha e joga níveis.

## Stack

- Bun (runtime + package manager)
- Next.js 15 (App Router, `src/` directory)
- React 19, TypeScript 5
- TailwindCSS 4, Shadcn/ui
- Phaser 3 (game engine, texturas procedurais)
- Supabase (PostgreSQL + Auth + RLS)

## Comandos

```bash
bun install          # Instalar dependências
bun run dev          # Dev server (Turbopack)
bun run build        # Build de produção
bun run lint         # ESLint
```

## Convenções

- **UI/texto**: PT-BR
- **Código/variáveis/comentários**: English
- **Commits**: Conventional Commits obrigatório (`feat:`, `fix:`, `chore:`, etc.)
- **Changelog**: Gerado automaticamente pelo Release Please — NUNCA editar manualmente
- **Versão**: NUNCA alterar `package.json` version — Release Please cuida disso

## Estrutura Chave

```
src/
  app/           → Páginas Next.js + API routes
  components/    → Componentes React
  game/          → Phaser 3 (scenes, levels, audio, types, constants)
  lib/           → Supabase clients, utils, ranks
  middleware.ts  → Auth session refresh
supabase/
  schema.sql     → Schema do banco
```

---

## Roadmap: Milestones e Issues (GitHub)

O projeto segue um roadmap rigoroso de milestones no GitHub. Cada milestone contém issues detalhadas que descrevem o trabalho necessário para o v1.0.

### Milestones Completas ✅
- v0.2.0 — Level Editor & Multi-Level (#5-#13)
- v0.3.0 — Authentication & Database (#14-#18)
- v0.4.0 — Community Portal (#19-#23)
- v0.5.0 — Curation, Cosmetics & Polish (#24-#29)

### Milestones Pendentes 🚧

| Milestone | Issues | Foco |
|-----------|--------|------|
| **v0.6.0 — Campaign & Audio** | #30-#36 | 10 fases de campanha + BGM procedural |
| **v0.7.0 — Cloud Save & Cosmetics** | #37-#42 | Shop API, sync DB, trails/death/frames |
| **v0.8.0 — Game Polish & UX** | #43-#49 | Pause menu, thumbnails, rank-up, editor UX, reporting |
| **v0.9.0 — Pre-Launch & v1.0** | #50-#53 | SEO, errors, perf, QA final |

---

## Workflow Obrigatório para Agentes

### 1. Sempre trabalhar com base em issues

Antes de começar qualquer trabalho:
1. **Consultar a milestone atual** — verificar quais issues estão abertas
2. **Ler a issue completa** — entender requisitos, acceptance criteria, dependências
3. **Implementar exatamente o que a issue pede** — não adicionar escopo extra

### 2. Fechar issues ao concluir

Após implementar uma issue com sucesso:
1. **Verificar todos os acceptance criteria** da issue
2. **Rodar `bun run build`** para garantir que compila sem erros
3. **Fechar a issue no GitHub** com um comentário resumindo o que foi feito
4. **Usar o formato**: `gh issue close <número> -c "Implementado em <commit/PR>: <resumo>"`

> ⚠️ **NUNCA deixar uma issue aberta se o trabalho está completo.** Sempre fechar imediatamente após concluir.

### 3. Commits vinculados a issues

Usar referências de issue nos commits quando possível:
```
feat: implement campaign levels 2-4 (#31)
fix: sync cosmetics to Supabase on login (#38)
```

### 4. Ordem de trabalho

Trabalhar nas milestones em ordem sequencial (v0.6.0 → v0.7.0 → v0.8.0 → v0.9.0), respeitando dependências entre issues. Dentro de uma milestone, issues podem ser feitas em qualquer ordem, exceto quando uma depende explicitamente de outra.

### 5. Checklist por tarefa

Para cada issue:
- [ ] Ler a issue completa no GitHub
- [ ] Ler os arquivos afetados antes de editar
- [ ] Implementar incrementalmente (commits pequenos e testáveis)
- [ ] Validar com `bun run build`
- [ ] Commit com Conventional Commits referenciando a issue
- [ ] **Fechar a issue no GitHub**
- [ ] Verificar se a milestone pode ser fechada (todas issues done)

---

## Restrições

- NÃO usar `pages/` router — somente App Router (`app/`)
- NÃO instalar ORMs — usar Supabase client diretamente
- NÃO acessar Supabase do client sem RLS
- NÃO misturar estado React com estado Phaser
- NÃO editar CHANGELOG.md ou versão do package.json
- NÃO introduzir vulnerabilidades — sanitizar inputs, validar dados, RBAC em rotas admin
