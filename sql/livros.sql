-- Trabalho 3: Catálogo de Livros de Programação
-- Rode este script inteiro no Supabase em: SQL Editor > New query > Run

-- ===== Tabela de livros =====
create table public.livros (
  id bigint generated always as identity primary key,
  titulo text not null check (char_length(titulo) between 1 and 150),
  autor text check (char_length(autor) <= 120),
  linguagem text check (char_length(linguagem) <= 60),
  nivel text check (nivel in ('Iniciante', 'Intermediário', 'Avançado')),
  -- Título + autor em minúsculas e sem acentos, calculado pelo banco.
  -- É nesta coluna que a busca procura ("programacao" encontra "Programação").
  texto_busca text generated always as (
    translate(
      lower(titulo || ' ' || coalesce(autor, '')),
      'áàâãäéèêëíìîïóòôõöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn'
    )
  ) stored,
  created_at timestamptz not null default now()
);

-- ===== Tabela de avaliações (cada livro pode ter várias) =====
create table public.avaliacoes (
  id bigint generated always as identity primary key,
  -- Ao excluir um livro, as avaliações dele são excluídas junto
  livro_id bigint not null references public.livros (id) on delete cascade,
  nota_didatica smallint check (nota_didatica between 1 and 5),
  nota_exemplos smallint check (nota_exemplos between 1 and 5),
  nota_exercicios smallint check (nota_exercicios between 1 and 5),
  -- Média só das notas preenchidas (fica vazia se nenhuma nota foi dada)
  media numeric(3, 2) generated always as (
    (coalesce(nota_didatica, 0) + coalesce(nota_exemplos, 0) + coalesce(nota_exercicios, 0))::numeric
    / nullif(
      (nota_didatica is not null)::int
      + (nota_exemplos is not null)::int
      + (nota_exercicios is not null)::int,
      0
    )
  ) stored,
  recomenda boolean,
  comentario text check (char_length(comentario) <= 500),
  avaliador text check (char_length(avaliador) <= 80),
  created_at timestamptz not null default now()
);

create index avaliacoes_livro_id_idx on public.avaliacoes (livro_id);

-- ===== Visão com o resumo de cada livro (usada na busca e nos destaques) =====
create view public.livros_resumo
with (security_invoker = true) as
select
  l.id,
  l.titulo,
  l.autor,
  l.linguagem,
  l.nivel,
  l.texto_busca,
  l.created_at,
  count(a.id)::int as qtd_avaliacoes,
  round(avg(a.media), 2) as media,
  (count(a.id) filter (where a.recomenda))::int as qtd_recomenda,
  count(a.recomenda)::int as qtd_respostas_recomenda
from public.livros l
left join public.avaliacoes a on a.livro_id = l.id
group by l.id;

-- ===== Permissões para o papel anônimo (chave pública do site) =====
grant select, insert, update, delete on public.livros to anon;
grant select, insert, update, delete on public.avaliacoes to anon;
grant select on public.livros_resumo to anon;

-- ===== Row Level Security (obrigatório: a chave fica visível no GitHub Pages) =====
alter table public.livros enable row level security;
alter table public.avaliacoes enable row level security;

create policy "Consultar livros" on public.livros for select to anon using (true);
create policy "Cadastrar livros" on public.livros for insert to anon with check (true);
create policy "Alterar livros" on public.livros for update to anon using (true) with check (true);
create policy "Excluir livros" on public.livros for delete to anon using (true);

create policy "Consultar avaliações" on public.avaliacoes for select to anon using (true);
create policy "Cadastrar avaliações" on public.avaliacoes for insert to anon with check (true);
create policy "Alterar avaliações" on public.avaliacoes for update to anon using (true) with check (true);
create policy "Excluir avaliações" on public.avaliacoes for delete to anon using (true);

-- ===== Dados de exemplo (opcional) =====
insert into public.livros (titulo, autor, linguagem, nivel) values
  ('Use a Cabeça! Java', 'Kathy Sierra e Bert Bates', 'Java', 'Iniciante'),
  ('Lógica de Programação e Algoritmos com JavaScript', 'Edécio Fernando Iepsen', 'JavaScript', 'Iniciante'),
  ('Código Limpo', 'Robert C. Martin', 'Boas Práticas', 'Intermediário');

insert into public.avaliacoes
  (livro_id, nota_didatica, nota_exemplos, nota_exercicios, recomenda, comentario, avaliador)
values
  (1, 5, 4, 4, true, 'Linguagem leve e cheia de figuras, ótimo para começar em orientação a objetos.', 'Ana'),
  (1, 4, 4, 3, true, null, 'Bruno'),
  (2, 4, 5, 5, true, 'Muitos exercícios resolvidos passo a passo.', 'Carla'),
  (3, 4, 4, 2, false, 'Mais para ler depois de já saber programar.', null);
