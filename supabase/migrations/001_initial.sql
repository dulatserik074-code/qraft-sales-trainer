create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.member_role as enum ('owner', 'admin', 'manager', 'seller');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  locale text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'seller',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email citext not null,
  role public.member_role not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  name text not null,
  category text,
  description text,
  specifications jsonb not null default '{}',
  packaging text,
  min_order numeric check (min_order > 0),
  currency text not null default 'RUB',
  stock_status text,
  lead_time text,
  payment_terms text,
  max_discount numeric not null default 0,
  min_price numeric,
  benefits text[],
  limitations text[],
  analog_skus text[],
  related_skus text[],
  competitor_differences text[],
  forbidden_promises text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, sku)
);

create table public.product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  min_quantity numeric not null check (min_quantity > 0),
  price numeric not null check (price >= 0),
  unique (product_id, min_quantity)
);

create table public.company_sales_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  rules jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.buyer_personas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  public_data jsonb not null default '{}',
  secret_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.training_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  persona_id uuid references public.buyer_personas(id),
  title text not null,
  channel text not null,
  difficulty text not null,
  mode text not null default 'training',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid not null references public.training_scenarios(id),
  user_id uuid not null references public.profiles(id),
  assigned_by uuid references public.profiles(id),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid references public.training_scenarios(id),
  user_id uuid not null references public.profiles(id),
  provider text not null default 'scenario',
  status text not null default 'active',
  language text not null default 'ru',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  sync_version bigint not null default 1
);

create table public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  role text not null check (role in ('buyer', 'seller')),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.session_state (
  session_id uuid primary key references public.training_sessions(id) on delete cascade,
  encrypted_state text not null,
  updated_at timestamptz not null default now()
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.training_sessions(id) on delete cascade,
  total_score int not null check (total_score between 0 and 100),
  outcome text,
  summary jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  criterion text not null,
  score int not null,
  max_score int not null,
  evidence jsonb not null default '[]',
  recommendation text
);

create table public.coaching_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  session_id uuid references public.training_sessions(id),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.skill_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  skill text not null,
  score numeric not null,
  session_id uuid references public.training_sessions(id),
  created_at timestamptz not null default now()
);

create table public.ai_usage_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id),
  provider text not null,
  operation text not null,
  status text not null,
  tokens int default 0,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index products_org_search_idx
  on public.products
  using gin (to_tsvector('simple', coalesce(sku, '') || ' ' || coalesce(name, '') || ' ' || coalesce(description, '')));
create index sessions_user_started_idx on public.training_sessions(user_id, started_at desc);
create index messages_session_created_idx on public.session_messages(session_id, created_at);
create index skills_user_created_idx on public.skill_history(user_id, created_at desc);

create function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members member
    where member.organization_id = target_org and member.user_id = auth.uid()
  );
$$;

create function public.has_org_role(target_org uuid, allowed_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members member
    where member.organization_id = target_org
      and member.user_id = auth.uid()
      and member.role = any(allowed_roles)
  );
$$;

create function public.can_access_session(target_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.training_sessions session
    where session.id = target_session
      and (
        session.user_id = auth.uid()
        or public.has_org_role(session.organization_id, array['owner', 'admin', 'manager']::public.member_role[])
      )
  );
$$;

create function public.can_access_evaluation(target_evaluation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.evaluations evaluation
    where evaluation.id = target_evaluation
      and public.can_access_session(evaluation.session_id)
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.create_organization(organization_name text, organization_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if length(trim(organization_name)) < 2 then raise exception 'invalid organization name'; end if;
  if organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid organization slug'; end if;

  insert into public.organizations (name, slug)
  values (trim(organization_name), organization_slug)
  returning id into created_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (created_id, auth.uid(), 'owner');
  return created_id;
end;
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.member_role[]) from public;
revoke all on function public.can_access_session(uuid) from public;
revoke all on function public.can_access_evaluation(uuid) from public;
revoke all on function public.create_organization(text, text) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.can_access_session(uuid) to authenticated;
grant execute on function public.can_access_evaluation(uuid) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.invitations enable row level security;
alter table public.products enable row level security;
alter table public.product_price_tiers enable row level security;
alter table public.company_sales_rules enable row level security;
alter table public.buyer_personas enable row level security;
alter table public.training_scenarios enable row level security;
alter table public.training_assignments enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_messages enable row level security;
alter table public.session_state enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_criteria enable row level security;
alter table public.coaching_recommendations enable row level security;
alter table public.skill_history enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.audit_events enable row level security;

create policy organizations_read on public.organizations
  for select using (public.is_org_member(id));
create policy organizations_manage on public.organizations
  for update using (public.has_org_role(id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_org_role(id, array['owner', 'admin']::public.member_role[]));

create policy profiles_read on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.organization_members mine
      join public.organization_members theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
        and mine.role in ('owner', 'admin', 'manager')
    )
  );
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy members_read on public.organization_members
  for select using (public.is_org_member(organization_id));
create policy members_manage_owner on public.organization_members
  for all using (public.has_org_role(organization_id, array['owner']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner']::public.member_role[]));
create policy members_manage_admin on public.organization_members
  for all using (
    role <> 'owner'
    and public.has_org_role(organization_id, array['admin']::public.member_role[])
  ) with check (
    role <> 'owner'
    and public.has_org_role(organization_id, array['admin']::public.member_role[])
  );

create policy invitations_manage on public.invitations
  for all using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]));

create policy products_read on public.products
  for select using (public.is_org_member(organization_id));
create policy products_manage on public.products
  for all using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]));

create policy product_tiers_read on public.product_price_tiers
  for select using (
    exists (select 1 from public.products product where product.id = product_id and public.is_org_member(product.organization_id))
  );
create policy product_tiers_manage on public.product_price_tiers
  for all using (
    exists (select 1 from public.products product where product.id = product_id and public.has_org_role(product.organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  ) with check (
    exists (select 1 from public.products product where product.id = product_id and public.has_org_role(product.organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  );

create policy sales_rules_read on public.company_sales_rules
  for select using (public.is_org_member(organization_id));
create policy sales_rules_manage on public.company_sales_rules
  for all using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]));

create policy personas_read on public.buyer_personas
  for select using (public.is_org_member(organization_id));
create policy personas_manage on public.buyer_personas
  for all using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]));

create policy scenarios_read on public.training_scenarios
  for select using (public.is_org_member(organization_id));
create policy scenarios_manage on public.training_scenarios
  for all using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]));

create policy assignments_read on public.training_assignments
  for select using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[])
  );
create policy assignments_manage on public.training_assignments
  for all using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[]));

create policy sessions_read on public.training_sessions
  for select using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[])
  );
create policy sessions_insert_self on public.training_sessions
  for insert with check (user_id = auth.uid() and public.is_org_member(organization_id));
create policy sessions_update on public.training_sessions
  for update using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[])
  ) with check (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[])
  );

create policy messages_read on public.session_messages
  for select using (public.can_access_session(session_id));
create policy messages_insert on public.session_messages
  for insert with check (public.can_access_session(session_id));

create policy session_state_access on public.session_state
  for all using (public.can_access_session(session_id))
  with check (public.can_access_session(session_id));

create policy evaluations_read on public.evaluations
  for select using (public.can_access_session(session_id));
create policy evaluation_criteria_read on public.evaluation_criteria
  for select using (public.can_access_evaluation(evaluation_id));

create policy coaching_read on public.coaching_recommendations
  for select using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[])
  );
create policy skill_history_read on public.skill_history
  for select using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[])
  );
create policy ai_usage_read on public.ai_usage_events
  for select using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.member_role[])
  );
create policy audit_read on public.audit_events
  for select using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));
