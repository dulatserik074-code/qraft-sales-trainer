drop policy if exists members_manage on public.organization_members;
drop policy if exists members_manage_owner on public.organization_members;
drop policy if exists members_manage_admin on public.organization_members;

create policy members_manage_owner on public.organization_members
  for all using (
    public.has_org_role(organization_id, array['owner']::public.member_role[])
  ) with check (
    public.has_org_role(organization_id, array['owner']::public.member_role[])
  );

create policy members_manage_admin on public.organization_members
  for all using (
    role <> 'owner'
    and public.has_org_role(organization_id, array['admin']::public.member_role[])
  ) with check (
    role <> 'owner'
    and public.has_org_role(organization_id, array['admin']::public.member_role[])
  );
