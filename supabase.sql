-- Eternal Pratas — schema em português (mix + campeonato 1v1)
-- Escrita só via service_role nas APIs. RLS ligado, sem políticas públicas.

create or replace function public.parse_score(v jsonb)
returns int
language sql
immutable
as $$
  select case
    when v is null or v = 'null'::jsonb then null
    when jsonb_typeof(v) = 'number' then trunc((v #>> '{}')::numeric)::int
    when btrim(coalesce(v #>> '{}', '')) = '' then null
    when (v #>> '{}') ~ '^-?[0-9]+(\.[0-9]+)?$' then trunc((v #>> '{}')::numeric)::int
    else null
  end;
$$;

create or replace function public.score_text(v int)
returns text
language sql
immutable
as $$
  select coalesce(v::text, '');
$$;

-- ── Mix / comunidade ──────────────────────────────────────

create table if not exists public.temporada (
  id text primary key,
  atualizado date,
  nome text not null default 'Mix 2026',
  partidas int not null default 0,
  vitorias int not null default 0,
  derrotas int not null default 0,
  rounds int not null default 0,
  rating_medio numeric,
  resumo_partidas jsonb not null default '[]'::jsonb
);

create table if not exists public.jogadores (
  id text primary key,
  nick text not null,
  nome text not null default '',
  foto_url text not null default '',
  cor text not null default '#3ec7ff',
  steam64 text not null default '',
  tag text not null default '',
  status text not null default '',
  jogo text not null default '',
  ordem int not null default 0,
  painel jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.mapas (
  id text primary key,
  nome text not null,
  imagem_url text not null
);

create table if not exists public.partidas (
  id text primary key,
  data date,
  hora text not null default '',
  mapa_id text references public.mapas(id) on delete set null,
  mapa_nome text not null default '',
  interna boolean not null default false,
  time_a text not null default '',
  time_b text not null default '',
  placar_a int not null default 0,
  placar_b int not null default 0,
  placar_a_tr int,
  placar_a_ct int,
  placar_b_tr int,
  placar_b_ct int,
  resultado_a text not null default '',
  resultado_b text not null default '',
  atualizado_em timestamptz not null default now()
);

create table if not exists public.partida_jogadores (
  id bigint generated always as identity primary key,
  partida_id text not null references public.partidas(id) on delete cascade,
  jogador_id text references public.jogadores(id) on delete set null,
  lado text not null check (lado in ('a', 'b')),
  nick_na_partida text not null default '',
  abates int,
  mortes int,
  assistencias int,
  dano int,
  adr numeric,
  adr_diff numeric,
  hltv numeric,
  kast int,
  abates_abertura int,
  abates_troca int
);

create index if not exists partida_jogadores_partida_idx on public.partida_jogadores (partida_id);

-- ── Campeonato 1v1 ────────────────────────────────────────

create table if not exists public.campeonato (
  id text primary key,
  titulo text not null,
  semana int not null default 1,
  rotulo_semana text not null default 'Semana 1',
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campeonato_elenco (
  id text primary key,
  nick text not null,
  cor text not null default '#3ec7ff',
  foto_url text not null default '',
  ordem int not null default 0,
  jogador_id text references public.jogadores(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campeonato_series (
  id text primary key,
  fase text not null check (fase in ('liga', 'playoff')),
  rodada int,
  numero int,
  nome text,
  subtitulo text,
  melhor_de int not null default 3,
  jogador1_id text references public.campeonato_elenco(id) on delete set null,
  jogador2_id text references public.campeonato_elenco(id) on delete set null,
  folga_id text references public.campeonato_elenco(id) on delete set null,
  origem_a jsonb,
  origem_b jsonb,
  mapas_j1 int,
  mapas_j2 int,
  abates_j1 int,
  mortes_j1 int,
  abates_j2 int,
  mortes_j2 int,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campeonato_semanas (
  id bigint generated always as identity primary key,
  semana int not null unique,
  rotulo text not null,
  campeao_id text references public.campeonato_elenco(id) on delete set null,
  vice_id text references public.campeonato_elenco(id) on delete set null,
  ultimo_id text references public.campeonato_elenco(id) on delete set null,
  colocacao jsonb not null default '{}'::jsonb,
  desempenho jsonb not null default '{}'::jsonb,
  encerrada_em timestamptz not null default now()
);

create table if not exists public.campeonato_semana_stats (
  semana_id bigint not null references public.campeonato_semanas(id) on delete cascade,
  jogador_id text not null references public.campeonato_elenco(id) on delete cascade,
  vitorias int not null default 0,
  derrotas int not null default 0,
  abates int not null default 0,
  mortes int not null default 0,
  primary key (semana_id, jogador_id)
);

create table if not exists public.campeonato_estado (
  id text primary key,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

create index if not exists campeonato_series_fase_idx
  on public.campeonato_series (fase, rodada, numero);

alter table public.temporada enable row level security;
alter table public.jogadores enable row level security;
alter table public.mapas enable row level security;
alter table public.partidas enable row level security;
alter table public.partida_jogadores enable row level security;
alter table public.campeonato enable row level security;
alter table public.campeonato_elenco enable row level security;
alter table public.campeonato_series enable row level security;
alter table public.campeonato_semanas enable row level security;
alter table public.campeonato_semana_stats enable row level security;
alter table public.campeonato_estado enable row level security;

insert into public.campeonato (id, titulo, semana, rotulo_semana)
values ('main', 'CAMPEONATO 1v1 — ETERNAL PRATAS (CLOSED)', 1, 'Semana 1')
on conflict (id) do nothing;

insert into public.campeonato_estado (id, dados)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.temporada (id, nome)
values ('main', 'Mix 2026')
on conflict (id) do nothing;

insert into public.campeonato_elenco (id, nick, cor, ordem) values
  ('s4mlz', 's4mlz', '#3ec7ff', 1),
  ('fury', 'fury', '#4f7dff', 2),
  ('bill', 'bill', '#7b8cff', 3),
  ('khastz', 'khastz', '#2a6dff', 4),
  ('cadu', 'cadu', '#5ad0ff', 5)
on conflict (id) do nothing;

insert into public.campeonato_series (
  id, fase, rodada, numero, melhor_de, jogador1_id, jogador2_id, folga_id
) values
  ('g1',  'liga', 1, 1,  3, 's4mlz', 'fury',   'cadu'),
  ('g2',  'liga', 1, 2,  3, 'bill',  'khastz', 'cadu'),
  ('g3',  'liga', 2, 3,  3, 's4mlz', 'bill',   'khastz'),
  ('g4',  'liga', 2, 4,  3, 'fury',  'cadu',   'khastz'),
  ('g5',  'liga', 3, 5,  3, 's4mlz', 'khastz', 'fury'),
  ('g6',  'liga', 3, 6,  3, 'bill',  'cadu',   'fury'),
  ('g7',  'liga', 4, 7,  3, 's4mlz', 'cadu',   'bill'),
  ('g8',  'liga', 4, 8,  3, 'fury',  'khastz', 'bill'),
  ('g9',  'liga', 5, 9,  3, 'fury',  'bill',   's4mlz'),
  ('g10', 'liga', 5, 10, 3, 'khastz','cadu',   's4mlz')
on conflict (id) do nothing;

insert into public.campeonato_series (
  id, fase, numero, nome, subtitulo, melhor_de, origem_a, origem_b
) values
  ('sf1',  'playoff', 1, 'Semifinal 1',  '1º × 4º',                 3, '{"type":"seed","n":1}'::jsonb, '{"type":"seed","n":4}'::jsonb),
  ('sf2',  'playoff', 2, 'Semifinal 2',  '2º × 3º',                 3, '{"type":"seed","n":2}'::jsonb, '{"type":"seed","n":3}'::jsonb),
  ('uf',   'playoff', 3, 'Final Upper',  'vencedores',              3, '{"type":"winner","of":"sf1"}'::jsonb, '{"type":"winner","of":"sf2"}'::jsonb),
  ('rep1', 'playoff', 4, 'Lower 1',      'perdedores das semis',    3, '{"type":"loser","of":"sf1"}'::jsonb, '{"type":"loser","of":"sf2"}'::jsonb),
  ('rf',   'playoff', 5, 'Final Lower',  'lower × perdedor upper',  3, '{"type":"winner","of":"rep1"}'::jsonb, '{"type":"loser","of":"uf"}'::jsonb),
  ('gf',   'playoff', 6, 'Grande Final', 'MD5',                     5, '{"type":"winner","of":"uf"}'::jsonb, '{"type":"winner","of":"rf"}'::jsonb)
on conflict (id) do nothing;

create or replace function public.carregar_campeonato()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.campeonato%rowtype;
begin
  select * into t from public.campeonato where id = 'main';
  if not found then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'title', t.titulo,
    'week', t.semana,
    'weekLabel', t.rotulo_semana,
    'updatedAt', t.atualizado_em,
    'players', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.nick,
          'color', p.cor,
          'photo', p.foto_url
        ) order by p.ordem, p.nick
      )
      from public.campeonato_elenco p
    ), '[]'::jsonb),
    'league', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'round', m.rodada,
          'no', m.numero,
          'p1', m.jogador1_id,
          'p2', m.jogador2_id,
          'bye', m.folga_id,
          'bestOf', m.melhor_de,
          'w1', public.score_text(m.mapas_j1),
          'w2', public.score_text(m.mapas_j2),
          'k1', public.score_text(m.abates_j1),
          'd1', public.score_text(m.mortes_j1),
          'k2', public.score_text(m.abates_j2),
          'd2', public.score_text(m.mortes_j2)
        ) order by m.numero
      )
      from public.campeonato_series m
      where m.fase = 'liga'
    ), '[]'::jsonb),
    'playoffs', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'name', m.nome,
          'sub', m.subtitulo,
          'bestOf', m.melhor_de,
          'sourceA', m.origem_a,
          'sourceB', m.origem_b,
          'w1', public.score_text(m.mapas_j1),
          'w2', public.score_text(m.mapas_j2),
          'k1', public.score_text(m.abates_j1),
          'd1', public.score_text(m.mortes_j1),
          'k2', public.score_text(m.abates_j2),
          'd2', public.score_text(m.mortes_j2)
        ) order by m.numero nulls last, m.id
      )
      from public.campeonato_series m
      where m.fase = 'playoff'
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'week', w.semana,
          'label', w.rotulo,
          'champion', w.campeao_id,
          'runnerUp', w.vice_id,
          'last', w.ultimo_id,
          'finish', w.colocacao,
          'stats', w.desempenho,
          'date', w.encerrada_em
        ) order by w.semana
      )
      from public.campeonato_semanas w
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.salvar_campeonato(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p jsonb;
  m jsonb;
  h jsonb;
  sort_i int := 0;
  week_row public.campeonato_semanas%rowtype;
  stat_key text;
  stat_val jsonb;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'payload inválido';
  end if;

  insert into public.campeonato (id, titulo, semana, rotulo_semana, atualizado_em)
  values (
    'main',
    coalesce(payload->>'title', 'CAMPEONATO 1v1 — ETERNAL PRATAS (CLOSED)'),
    coalesce(nullif(payload->>'week', '')::int, 1),
    coalesce(payload->>'weekLabel', 'Semana 1'),
    now()
  )
  on conflict (id) do update set
    titulo = excluded.titulo,
    semana = excluded.semana,
    rotulo_semana = excluded.rotulo_semana,
    atualizado_em = now();

  for p in select value from jsonb_array_elements(coalesce(payload->'players', '[]'::jsonb))
  loop
    sort_i := sort_i + 1;
    insert into public.campeonato_elenco (id, nick, cor, foto_url, ordem, atualizado_em)
    values (
      p->>'id',
      coalesce(nullif(p->>'name', ''), p->>'id'),
      coalesce(nullif(p->>'color', ''), '#3ec7ff'),
      coalesce(p->>'photo', ''),
      sort_i,
      now()
    )
    on conflict (id) do update set
      nick = excluded.nick,
      cor = excluded.cor,
      foto_url = excluded.foto_url,
      ordem = excluded.ordem,
      atualizado_em = now();
  end loop;

  for m in select value from jsonb_array_elements(coalesce(payload->'league', '[]'::jsonb))
  loop
    insert into public.campeonato_series (
      id, fase, rodada, numero, melhor_de, jogador1_id, jogador2_id, folga_id,
      mapas_j1, mapas_j2, abates_j1, mortes_j1, abates_j2, mortes_j2, atualizado_em
    )
    values (
      m->>'id',
      'liga',
      public.parse_score(m->'round'),
      public.parse_score(m->'no'),
      coalesce(public.parse_score(m->'bestOf'), 3),
      nullif(m->>'p1', ''),
      nullif(m->>'p2', ''),
      nullif(m->>'bye', ''),
      public.parse_score(m->'w1'),
      public.parse_score(m->'w2'),
      public.parse_score(m->'k1'),
      public.parse_score(m->'d1'),
      public.parse_score(m->'k2'),
      public.parse_score(m->'d2'),
      now()
    )
    on conflict (id) do update set
      fase = 'liga',
      rodada = excluded.rodada,
      numero = excluded.numero,
      melhor_de = excluded.melhor_de,
      jogador1_id = excluded.jogador1_id,
      jogador2_id = excluded.jogador2_id,
      folga_id = excluded.folga_id,
      mapas_j1 = excluded.mapas_j1,
      mapas_j2 = excluded.mapas_j2,
      abates_j1 = excluded.abates_j1,
      mortes_j1 = excluded.mortes_j1,
      abates_j2 = excluded.abates_j2,
      mortes_j2 = excluded.mortes_j2,
      atualizado_em = now();
  end loop;

  for m in select value from jsonb_array_elements(coalesce(payload->'playoffs', '[]'::jsonb))
  loop
    insert into public.campeonato_series (
      id, fase, nome, subtitulo, melhor_de, origem_a, origem_b,
      mapas_j1, mapas_j2, abates_j1, mortes_j1, abates_j2, mortes_j2, atualizado_em
    )
    values (
      m->>'id',
      'playoff',
      m->>'name',
      m->>'sub',
      coalesce(public.parse_score(m->'bestOf'), 3),
      m->'sourceA',
      m->'sourceB',
      public.parse_score(m->'w1'),
      public.parse_score(m->'w2'),
      public.parse_score(m->'k1'),
      public.parse_score(m->'d1'),
      public.parse_score(m->'k2'),
      public.parse_score(m->'d2'),
      now()
    )
    on conflict (id) do update set
      fase = 'playoff',
      nome = excluded.nome,
      subtitulo = excluded.subtitulo,
      melhor_de = excluded.melhor_de,
      origem_a = excluded.origem_a,
      origem_b = excluded.origem_b,
      mapas_j1 = excluded.mapas_j1,
      mapas_j2 = excluded.mapas_j2,
      abates_j1 = excluded.abates_j1,
      mortes_j1 = excluded.mortes_j1,
      abates_j2 = excluded.abates_j2,
      mortes_j2 = excluded.mortes_j2,
      atualizado_em = now();
  end loop;

  delete from public.campeonato_semanas w
  where not exists (
    select 1
    from jsonb_array_elements(coalesce(payload->'history', '[]'::jsonb)) h2
    where public.parse_score(h2->'week') = w.semana
  );

  for h in select value from jsonb_array_elements(coalesce(payload->'history', '[]'::jsonb))
  loop
    insert into public.campeonato_semanas (
      semana, rotulo, campeao_id, vice_id, ultimo_id, colocacao, desempenho, encerrada_em
    )
    values (
      public.parse_score(h->'week'),
      coalesce(h->>'label', 'Semana'),
      nullif(h->>'champion', ''),
      nullif(h->>'runnerUp', ''),
      nullif(h->>'last', ''),
      coalesce(h->'finish', '{}'::jsonb),
      coalesce(h->'stats', '{}'::jsonb),
      coalesce(nullif(h->>'date', '')::timestamptz, now())
    )
    on conflict (semana) do update set
      rotulo = excluded.rotulo,
      campeao_id = excluded.campeao_id,
      vice_id = excluded.vice_id,
      ultimo_id = excluded.ultimo_id,
      colocacao = excluded.colocacao,
      desempenho = excluded.desempenho,
      encerrada_em = excluded.encerrada_em
    returning * into week_row;

    delete from public.campeonato_semana_stats where semana_id = week_row.id;

    for stat_key, stat_val in select key, value from jsonb_each(coalesce(h->'stats', '{}'::jsonb))
    loop
      insert into public.campeonato_semana_stats (semana_id, jogador_id, vitorias, derrotas, abates, mortes)
      values (
        week_row.id,
        stat_key,
        coalesce(public.parse_score(stat_val->'w'), 0),
        coalesce(public.parse_score(stat_val->'l'), 0),
        coalesce(public.parse_score(stat_val->'k'), 0),
        coalesce(public.parse_score(stat_val->'d'), 0)
      );
    end loop;
  end loop;

  insert into public.campeonato_estado (id, dados, atualizado_em)
  values ('main', payload, now())
  on conflict (id) do update set dados = excluded.dados, atualizado_em = now();

  return public.carregar_campeonato();
end;
$$;

-- Aliases para o site camp-x1 antigo no mesmo projeto Supabase
create or replace function public.load_camp_state()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.carregar_campeonato();
$$;

create or replace function public.save_camp_state(payload jsonb)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.salvar_campeonato(payload);
$$;

grant execute on function public.parse_score(jsonb) to service_role;
grant execute on function public.score_text(int) to service_role;
grant execute on function public.carregar_campeonato() to service_role;
grant execute on function public.salvar_campeonato(jsonb) to service_role;
grant execute on function public.load_camp_state() to service_role;
grant execute on function public.save_camp_state(jsonb) to service_role;

-- Copiar estado vivo do schema inglês (camp-x1) para as tabelas em português
do $$
begin
  if to_regclass('public.players') is not null then
    insert into public.campeonato_elenco (id, nick, cor, foto_url, ordem, criado_em, atualizado_em)
    select id, name, color, photo_url, sort_order, created_at, updated_at
    from public.players
    on conflict (id) do update set
      nick = excluded.nick,
      cor = excluded.cor,
      foto_url = excluded.foto_url,
      ordem = excluded.ordem,
      atualizado_em = excluded.atualizado_em;
  end if;

  if to_regclass('public.tournaments') is not null then
    insert into public.campeonato (id, titulo, semana, rotulo_semana, atualizado_em)
    select id, title, week, week_label, updated_at from public.tournaments
    on conflict (id) do update set
      titulo = excluded.titulo,
      semana = excluded.semana,
      rotulo_semana = excluded.rotulo_semana,
      atualizado_em = excluded.atualizado_em;
  end if;

  if to_regclass('public.matches') is not null then
    insert into public.campeonato_series (
      id, fase, rodada, numero, nome, subtitulo, melhor_de,
      jogador1_id, jogador2_id, folga_id, origem_a, origem_b,
      mapas_j1, mapas_j2, abates_j1, mortes_j1, abates_j2, mortes_j2, atualizado_em
    )
    select
      id,
      case when stage = 'league' then 'liga' else 'playoff' end,
      round, match_no, name, subtitle, best_of,
      player1_id, player2_id, bye_id, source_a, source_b,
      maps_p1, maps_p2, kills_p1, deaths_p1, kills_p2, deaths_p2, updated_at
    from public.matches
    on conflict (id) do update set
      fase = excluded.fase,
      rodada = excluded.rodada,
      numero = excluded.numero,
      nome = excluded.nome,
      subtitulo = excluded.subtitulo,
      melhor_de = excluded.melhor_de,
      jogador1_id = excluded.jogador1_id,
      jogador2_id = excluded.jogador2_id,
      folga_id = excluded.folga_id,
      origem_a = excluded.origem_a,
      origem_b = excluded.origem_b,
      mapas_j1 = excluded.mapas_j1,
      mapas_j2 = excluded.mapas_j2,
      abates_j1 = excluded.abates_j1,
      mortes_j1 = excluded.mortes_j1,
      abates_j2 = excluded.abates_j2,
      mortes_j2 = excluded.mortes_j2,
      atualizado_em = excluded.atualizado_em;
  end if;

  if to_regclass('public.weeks') is not null then
    insert into public.campeonato_semanas (
      semana, rotulo, campeao_id, vice_id, ultimo_id, colocacao, desempenho, encerrada_em
    )
    select week, label, champion_id, runner_up_id, last_id, finish, stats, closed_at
    from public.weeks
    on conflict (semana) do update set
      rotulo = excluded.rotulo,
      campeao_id = excluded.campeao_id,
      vice_id = excluded.vice_id,
      ultimo_id = excluded.ultimo_id,
      colocacao = excluded.colocacao,
      desempenho = excluded.desempenho,
      encerrada_em = excluded.encerrada_em;
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-jogadores',
  'fotos-jogadores',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos jogadores leitura publica" on storage.objects;
create policy "fotos jogadores leitura publica"
  on storage.objects for select
  using (bucket_id = 'fotos-jogadores');
