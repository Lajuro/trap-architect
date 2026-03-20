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
  equipped_title text not null default 'novato',
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
  featured_category text,
  thumbnail text,
  -- v0.6+ columns
  tags text[] not null default '{}',
  theme text not null default 'default',
  background_tiles jsonb,
  avg_rating real not null default 0,
  rating_count int not null default 0,
  weekly_challenge_date date
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
-- Table: level_reports
-- ============================================================
create table if not exists public.level_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  level_id uuid references public.levels(id) not null,
  reason text not null,
  description text,
  status text default 'pending' not null,
  created_at timestamptz default now(),
  unique(user_id, level_id)
);

alter table public.level_reports enable row level security;

-- Users can insert their own reports
create policy "Users can create reports" on public.level_reports
  for insert with check (auth.uid() = user_id);

-- Users can read their own reports
create policy "Users can read own reports" on public.level_reports
  for select using (auth.uid() = user_id);

-- Admins can read all reports
create policy "Admins can read all reports" on public.level_reports
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and creator_rank = 99)
  );

-- Admins can update reports
create policy "Admins can update reports" on public.level_reports
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and creator_rank = 99)
  );

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

  -- Update level play count and difficulty (only calculated with 10+ plays)
  update public.levels
  set plays = plays + 1,
      difficulty = (
        select case
          when count(*) < 10 then -1
          else
            (1.0 - (count(*) filter (where completed) * 1.0 / count(*))) * 0.8
            + least(
                coalesce(avg(deaths) filter (where completed), 0) / 20.0,
                0.3
              ) * 0.2
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

-- ============================================================
-- Level ratings (1-5 stars, one per user per level)
-- ============================================================
create table if not exists public.level_ratings (
  user_id uuid references public.profiles(id) on delete cascade not null,
  level_id uuid references public.levels(id) on delete cascade not null,
  stars int not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

alter table public.level_ratings enable row level security;

create policy "Ratings are publicly readable"
  on public.level_ratings for select using (true);

create policy "Authenticated users can rate"
  on public.level_ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rating"
  on public.level_ratings for update
  using (auth.uid() = user_id);

-- Function: rate a level and update averages
create or replace function public.rate_level(p_level_id uuid, p_user_id uuid, p_stars int)
returns void as $$
begin
  insert into public.level_ratings (level_id, user_id, stars)
  values (p_level_id, p_user_id, p_stars)
  on conflict (user_id, level_id) do update set stars = p_stars;

  update public.levels set
    avg_rating = (select avg(stars)::real from public.level_ratings where level_id = p_level_id),
    rating_count = (select count(*) from public.level_ratings where level_id = p_level_id)
  where id = p_level_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- User achievements
-- ============================================================
create table if not exists public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "Achievements are publicly readable"
  on public.user_achievements for select using (true);

create policy "System can insert achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Level collections
-- ============================================================
create table if not exists public.collections (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_levels (
  collection_id uuid references public.collections(id) on delete cascade not null,
  level_id uuid references public.levels(id) on delete cascade not null,
  position int not null default 0,
  added_at timestamptz not null default now(),
  primary key (collection_id, level_id)
);

alter table public.collections enable row level security;
alter table public.collection_levels enable row level security;

create policy "Collections are publicly readable"
  on public.collections for select using (true);

create policy "Owners can manage collections"
  on public.collections for all
  using (auth.uid() = owner_id);

create policy "Collection levels are publicly readable"
  on public.collection_levels for select using (true);

create policy "Collection owners can manage levels"
  on public.collection_levels for all
  using (
    auth.uid() = (select owner_id from public.collections where id = collection_id)
  );

-- Tags index for filtering
create index levels_tags_idx on public.levels using gin(tags);
create index levels_avg_rating_idx on public.levels(avg_rating desc);

-- ============================================================
-- Admin: banned_at column for user banning
-- ============================================================
alter table public.profiles add column if not exists banned_at timestamptz;

-- Admin policies: allow admins to read all levels (including unpublished)
create policy "Admins can read all levels" on public.levels
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and creator_rank = 99)
  );

-- Admin policies: allow admins to update any profile (rank, ban)
create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and creator_rank = 99)
  );

-- Admin policies: allow admins to update any level (hide, feature, weekly)
create policy "Admins can update any level" on public.levels
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and creator_rank = 99)
  );

-- ============================================================
-- Race Rooms: 1v1 versus mode
-- ============================================================
create table if not exists public.race_rooms (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  level_id uuid references public.levels(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  guest_id uuid references public.profiles(id) on delete set null,
  status text not null default 'waiting',
  winner_id uuid references public.profiles(id) on delete set null,
  host_time_ms int,
  guest_time_ms int,
  host_deaths int,
  guest_deaths int,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);

create index race_rooms_code_idx on public.race_rooms(code);
create index race_rooms_status_idx on public.race_rooms(status) where status in ('waiting', 'ready', 'racing');

alter table public.race_rooms enable row level security;

-- Anyone can read rooms they are part of
create policy "Players can read their rooms"
  on public.race_rooms for select
  using (auth.uid() = host_id or auth.uid() = guest_id);

-- Authenticated users can create rooms
create policy "Authenticated users can create rooms"
  on public.race_rooms for insert
  with check (auth.uid() = host_id);

-- Players in a room can update it (join, finish)
create policy "Players can update their rooms"
  on public.race_rooms for update
  using (auth.uid() = host_id or auth.uid() = guest_id);
