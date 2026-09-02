<p align="center">
  <img src="assets/logo.png" alt="Eternal Pratas" width="180">
</p>

<h1 align="center">Eternal Pratas</h1>

<p align="center">
  <strong>Organização brasileira de Counter-Strike 2</strong><br>
  Site oficial do time — elenco, jogos e área interna.
</p>

<p align="center">
  <a href="https://eternalpratasgg.vercel.app"><img src="https://img.shields.io/badge/site-eternalpratasgg.vercel.app-3ec7ff?style=flat-square" alt="Site"></a>
  <a href="https://eternalpratasgg.vercel.app/elenco"><img src="https://img.shields.io/badge/elenco-público-122033?style=flat-square" alt="Elenco"></a>
  <a href="https://eternalpratasgg.vercel.app/jogos"><img src="https://img.shields.io/badge/jogos-agenda-122033?style=flat-square" alt="Jogos"></a>
</p>

<p align="center">
  <a href="https://eternalpratasgg.vercel.app">Abrir o site</a>
  ·
  <a href="https://discord.gg/et6N2Y3pJj">Discord</a>
  ·
  <a href="https://steamcommunity.com/groups/eternalpratas">Steam</a>
</p>

---

## O que é

Site da **Eternal Pratas**: lineup de CS2, perfis dos jogadores, agenda de jogos e um campeonato 1v1 interno.

| Público | Interno |
| --- | --- |
| Início, elenco, perfis, jogos, organização | Login, painel do time, campeonato 1v1 |

O 1v1 **não aparece no menu público**. Só quem tem acesso entra.

## Stack

- HTML, CSS e JavaScript
- APIs em Vercel Serverless
- Postgres no [Supabase](https://supabase.com)
- Deploy contínuo na [Vercel](https://vercel.com)

## Estrutura

```
├── index.html              Início
├── elenco.html             Lineup
├── jogador.html            Perfil (stats, ranks, conexões)
├── jogos.html              Agenda e escalação
├── sobre.html              Organização
├── entrar.html             Login
├── admin.html              Painel (elenco, jogos, acessos)
├── 1v1/                    Campeonato interno
├── api/                    Sessão, org, 1v1, fotos
├── lib/                    Supabase, auth, elenco
├── css/  js/  assets/
├── supabase.sql            Schema do campeonato 1v1
└── supabase-org.sql        Schema do elenco e dos jogos
```

## Setup local

1. Clone o repositório e copie as variáveis:

   ```bash
   cp .env.example .env
   ```

2. Preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EDIT_PIN` e `ADMIN_USERNAME`.

3. No Supabase, rode `supabase.sql` (1v1) e `supabase-org.sql` (time), se ainda não estiver no banco.

4. Suba o site (Vercel CLI ou qualquer static server na raiz). As rotas `/api/*` só funcionam no ambiente Vercel.

```bash
npx vercel dev
```

### Variáveis

| Variável | Uso |
| --- | --- |
| `SUPABASE_URL` | Projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | API (nunca no frontend) |
| `EDIT_PIN` | Senha do admin / bootstrap de login |
| `ADMIN_USERNAME` | Usuário admin (padrão: `admin`) |
| `DATABASE_URL` | Opcional — aplicar SQL via `npm run org` |

Não commite `.env` nem `.env.local`.

## Painel

Depois do login em `/entrar`, o admin abre `/admin` para:

- cadastrar os 5 titulares, 2 reservas e o coach
- foto, nick, nome, idade, posição, GC / Faceit / Premier
- stats (rating, K/D, KAST, HS%, ADR…)
- conexões (Steam, Faceit, redes)
- jogos e escalação
- criar acessos para o 1v1

## Licença

O código deste repositório é da Eternal Pratas. Marca, logo e identidade visual não podem ser reutilizados sem autorização. Veja [LICENSE](LICENSE).
