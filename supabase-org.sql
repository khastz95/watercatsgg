-- WATERCATSGG — organização (elenco, jogos, acessos)
-- 5 titulares + 2 reservas + 1 coach. Independente do campeonato 1v1.

create table if not exists public.org_elenco (
  id text primary key,
  papel text not null check (papel in ('titular', 'reserva', 'coach')),
  ordem int not null default 0,
  nick text not null default '',
  nome text not null default '',
  idade int,
  foto_url text not null default '',
  posicao text not null default '',
  pais text not null default 'Brasil',
  nivel_gc int,
  nivel_faceit int,
  rating_premier int,
  steam64 text not null default '',
  bio text not null default '',
  rating numeric,
  kd numeric,
  kast numeric,
  taxa_hs numeric,
  adr numeric,
  kpr numeric,
  dpr numeric,
  partidas int not null default 0,
  vitorias int not null default 0,
  derrotas int not null default 0,
  abates int not null default 0,
  mortes int not null default 0,
  assistencias int not null default 0,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.org_conexoes (
  id bigint generated always as identity primary key,
  elenco_id text not null references public.org_elenco(id) on delete cascade,
  tipo text not null,
  url text not null default '',
  rotulo text not null default ''
);

create index if not exists org_conexoes_elenco_idx on public.org_conexoes (elenco_id);

create table if not exists public.org_jogos (
  id text primary key,
  data date,
  hora text not null default '',
  adversario text not null default '',
  adversario_logo text not null default '',
  campeonato text not null default '',
  formato text not null default 'MD3',
  mapas text not null default '',
  status text not null default 'agendado' check (status in ('agendado', 'ao_vivo', 'encerrado')),
  placar_casa int,
  placar_fora int,
  streaming_url text not null default '',
  notas text not null default '',
  ordem int not null default 0,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.org_escalacao (
  jogo_id text not null references public.org_jogos(id) on delete cascade,
  elenco_id text not null references public.org_elenco(id) on delete cascade,
  papel text not null default 'titular' check (papel in ('titular', 'reserva', 'coach')),
  ordem int not null default 0,
  primary key (jogo_id, elenco_id)
);

create table if not exists public.org_usuarios (
  id text primary key,
  usuario text not null unique,
  senha_hash text not null,
  nome text not null default '',
  papel text not null default 'membro' check (papel in ('admin', 'membro')),
  criado_em timestamptz not null default now()
);

create table if not exists public.org_sessoes (
  token text primary key,
  usuario_id text not null references public.org_usuarios(id) on delete cascade,
  expira_em timestamptz not null,
  criado_em timestamptz not null default now()
);

create index if not exists org_sessoes_expira_idx on public.org_sessoes (expira_em);

alter table public.org_elenco enable row level security;
alter table public.org_conexoes enable row level security;
alter table public.org_jogos enable row level security;
alter table public.org_escalacao enable row level security;
alter table public.org_usuarios enable row level security;
alter table public.org_sessoes enable row level security;

insert into public.org_elenco (id, papel, ordem, posicao) values
  ('t1', 'titular', 1, 'IGL'),
  ('t2', 'titular', 2, 'Entry'),
  ('t3', 'titular', 3, 'AWPer'),
  ('t4', 'titular', 4, 'Lurker'),
  ('t5', 'titular', 5, 'Support'),
  ('r1', 'reserva', 6, 'Rifler'),
  ('r2', 'reserva', 7, 'Rifler'),
  ('coach', 'coach', 8, 'Coach')
on conflict (id) do nothing;
