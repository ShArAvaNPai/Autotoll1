-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Profiles Table (Public Profile info for Users & Admins)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'owner')) default 'owner',
  vehicle_plate text, -- Nullable, for owners
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create Admin Audit Log
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Audit Logs
alter table public.audit_logs enable row level security;

create policy "Admins can view all logs"
  on audit_logs for select
  using ( exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));
