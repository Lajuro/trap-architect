-- ============================================================
-- Trap Architect — Supabase Database Schema
-- Run this in the Supabase SQL editor to set up all tables.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Profiles table (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text not null unique,
  photo_url text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  -- Creator stats
  levels_published int not null default 0,
  total_plays int not null default 0,
  total_likes int not null default 0,
  creator_coins int not null default 0,
  creator_rank int not null default 0,
  devs_choice_count int not null default 0,
  -- Player stats
  levels_completed int not null default 0,
  total_deaths int not null default 0,
  total_coins int not null default 0,
  time_played int not null default 0,
  -- Cosmetics
  equipped_skin text not null default 'default',
  equipped_trail text not null default '',
  equipped_death_effect text not null default '',
  equipped_frame text not null default '',
  unlocked_cosmetics text[] not null default '{}',
  -- Campaign progress (cloud save)
  campaign_progress jsonb not null default '{}',
  campaign_completed boolean not null default false
);

-- RLS: Users can read all profiles, update only their own
alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- Levels table
-- ============================================================
create table if not exists public.levels (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  subtitle text,
  bg_color text not null default '#5c94fc',
  music text not null default 'level1',
  grid_w int not null,
  grid_h int not null,
  tiles jsonb not null,
  entities jsonb not null default '[]',
  trolls jsonb not null default '[]',
  player_start jsonb not null default '{"x": 3, "y": 12}',
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default false,
  plays int not null default 0,
  likes int not null default 0,
  difficulty real not null default 0,
  featured boolean not null default false,
  featured_category text
);

-- Indexes for common queries
create index levels_author_idx on public.levels(author_id);
create index levels_published_idx on public.levels(published) where published = true;
create index levels_featured_idx on public.levels(featured) where featured = true;
create index levels_created_at_idx on public.levels(created_at desc);
create index levels_plays_idx on public.levels(plays desc);
create index levels_likes_idx on public.levels(likes desc);

-- RLS
alter table public.levels enable row level security;

create policy "Published levels are publicly readable"
  on public.levels for select
  using (published = true or auth.uid() = author_id);

create policy "Authors can insert own levels"
  on public.levels for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own levels"
  on public.levels for update
  using (auth.uid() = author_id);

create policy "Authors can delete own levels"
  on public.levels for delete
  using (auth.uid() = author_id);

-- ============================================================
-- Level likes (one per user per level)
-- ============================================================
create table if not exists public.level_likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  level_id uuid references public.levels(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

alter table public.level_likes enable row level security;

create policy "Likes are publicly readable"
  on public.level_likes for select
  using (true);

create policy "Users can insert own likes"
  on public.level_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on public.level_likes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Level plays (records each play session)
-- ============================================================
create table if not exists public.level_plays (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  level_id uuid references public.levels(id) on delete cascade not null,
  completed boolean not null default false,
  deaths int not null default 0,
  coins int not null default 0,
  time_ms int not null default 0,
  created_at timestamptz not null default now()
);

create index level_plays_level_idx on public.level_plays(level_id);
create index level_plays_user_idx on public.level_plays(user_id);

alter table public.level_plays enable row level security;

create policy "Plays are publicly readable"
  on public.level_plays for select
  using (true);

create policy "Users can insert plays"
  on public.level_plays for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', 'Jogador_' || left(new.id::text, 8))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Function: increment level play count + update difficulty
-- ============================================================
create or replace function public.record_play(
  p_level_id uuid,
  p_user_id uuid,
  p_completed boolean,
  p_deaths int,
  p_coins int,
  p_time_ms int
)
returns void as $$
begin
  -- Insert play record
  insert into public.level_plays (level_id, user_id, completed, deaths, coins, time_ms)
  values (p_level_id, p_user_id, p_completed, p_deaths, p_coins, p_time_ms);

  -- Update level play count
  update public.levels
  set plays = plays + 1,
      difficulty = (
        select case
          when count(*) = 0 then 0
          else 1.0 - (count(*) filter (where completed) * 1.0 / count(*))
        end
        from public.level_plays
        where level_id = p_level_id
      )
  where id = p_level_id;

  -- Update author stats
  update public.profiles
  set total_plays = total_plays + 1
  where id = (select author_id from public.levels where id = p_level_id);

  -- Update player stats
  if p_user_id is not null then
    update public.profiles
    set total_deaths = total_deaths + p_deaths,
        total_coins = total_coins + p_coins,
        time_played = time_played + p_time_ms,
        levels_completed = levels_completed + case when p_completed then 1 else 0 end
    where id = p_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Function: toggle level like
-- ============================================================
create or replace function public.toggle_like(p_level_id uuid, p_user_id uuid)
returns boolean as $$
declare
  already_liked boolean;
begin
  select exists(
    select 1 from public.level_likes where level_id = p_level_id and user_id = p_user_id
  ) into already_liked;

  if already_liked then
    delete from public.level_likes where level_id = p_level_id and user_id = p_user_id;
    update public.levels set likes = likes - 1 where id = p_level_id;
    update public.profiles set total_likes = total_likes - 1
    where id = (select author_id from public.levels where id = p_level_id);
    return false;
  else
    insert into public.level_likes (level_id, user_id) values (p_level_id, p_user_id);
    update public.levels set likes = likes + 1 where id = p_level_id;
    update public.profiles set total_likes = total_likes + 1
    where id = (select author_id from public.levels where id = p_level_id);
    return true;
  end if;
end;
$$ language plpgsql security definer;
