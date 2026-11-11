-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can read their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- The very first signed-in account may claim the admin role; afterwards nobody else can.
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if exists (select 1 from public.user_roles where role = 'admin') then
    return public.has_role(auth.uid(), 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
  return true;
end;
$$;

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;

revoke execute on function public.claim_first_admin() from public, anon;
grant execute on function public.claim_first_admin() to authenticated;
grant execute on function public.admin_exists() to anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Shared updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  tagline text,
  description text not null default '' check (char_length(description) <= 2000),
  tech text[] not null default '{}',
  image_url text,
  github_url text,
  live_url text,
  project_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "Anyone can view published projects" on public.projects
  for select to anon, authenticated using (published = true);
create policy "Admins can view all projects" on public.projects
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert projects" on public.projects
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update projects" on public.projects
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete projects" on public.projects
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

insert into public.projects (slug, title, tagline, description, tech, sort_order) values
  ('trustmesh', 'TrustMesh', 'Trust for the open-source ecosystem',
   'A trust-focused network concept for the open-source ecosystem, designed to explore contributor credibility, reputation and community trust.',
   array['React','Vite','Tailwind CSS','FastAPI','Python','SQLite'], 1),
  ('ai-study-tutor', 'AI Study Tutor', 'Learning, explained conversationally',
   'An AI-powered learning assistant designed to help students understand academic concepts through conversational explanations.',
   array['React','AI integration','Python','API integration'], 2),
  ('personal-portfolio', 'Personal Portfolio', 'This website',
   'An interactive 3D portfolio showcasing my development skills, creative interests and projects.',
   array['React','TypeScript','Tailwind CSS','Three.js'], 3);

-- Contact messages
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 255 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text not null check (char_length(subject) between 1 and 150),
  message text not null check (char_length(message) between 1 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "Anyone can send a message" on public.contact_messages
  for insert to anon, authenticated with check (is_read = false);
create policy "Admins can read messages" on public.contact_messages
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update messages" on public.contact_messages
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete messages" on public.contact_messages
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
