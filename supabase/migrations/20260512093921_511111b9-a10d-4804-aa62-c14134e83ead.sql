-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  reminder_email text,
  reminder_phone text,
  onboarded boolean not null default false,
  notify_upcoming boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger language plpgsql
security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- daily_logs
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  study_hours numeric(5,2) not null default 0,
  work_hours numeric(5,2) not null default 0,
  screen_time numeric(5,2) not null default 0,
  mood text check (mood in ('happy','neutral','stressed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);
alter table public.daily_logs enable row level security;
create policy "own logs all" on public.daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger daily_logs_updated before update on public.daily_logs for each row execute function public.set_updated_at();

-- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  duration_minutes integer not null default 0,
  completed boolean not null default false,
  task_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "own tasks all" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();

-- expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  category text not null check (category in ('Food','Travel','Study','Misc')),
  description text,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "own expenses all" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "own notes all" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger notes_updated before update on public.notes for each row execute function public.set_updated_at();

-- planner events
create table public.planner_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.planner_events enable row level security;
create policy "own events all" on public.planner_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'info',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "own notifications all" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_notifications_user_created
  on public.notifications (user_id, created_at desc);