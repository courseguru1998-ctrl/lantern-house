-- Run once in the SQL Editor of a NEW Supabase project.
-- There is one house/project per installation. Membership is granted by the owner.
create table public.project_members (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.project_members enable row level security;
revoke all on public.project_members from anon, authenticated;
grant select on public.project_members to authenticated;
create policy members_read_self on public.project_members for select to authenticated using (user_id = (select auth.uid()));
create function public.is_project_member() returns boolean language sql stable security invoker set search_path = public as $$
 select exists(select 1 from public.project_members where user_id = (select auth.uid()));
$$;
revoke all on function public.is_project_member() from public;
grant execute on function public.is_project_member() to authenticated;
create table public.review_records (
 id uuid primary key,
 kind text not null check(kind in ('note','view','scheme','decision','spec','publication')),
 title text not null check(length(title) between 1 and 140),
 body text not null default '' check(length(body)<=4000),
 data jsonb not null default '{}'::jsonb check(jsonb_typeof(data)='object'),
 status text not null default 'open' check(status in ('open','review','approved','resolved')),
 user_id uuid not null references auth.users(id),
 author text not null,
 created timestamptz not null default now(),
 updated timestamptz not null default now(),
 revision integer not null default 1 check(revision>0)
);
create index review_records_created on public.review_records(created desc);
alter table public.review_records enable row level security;
revoke all on public.review_records from anon, authenticated;
grant select,insert on public.review_records to authenticated;
grant update(status,updated,revision) on public.review_records to authenticated;
create policy records_read_members on public.review_records for select to authenticated using(public.is_project_member());
create policy records_insert_own on public.review_records for insert to authenticated with check(public.is_project_member() and user_id=(select auth.uid()));
create policy records_update_own on public.review_records for update to authenticated using(public.is_project_member() and user_id=(select auth.uid())) with check(public.is_project_member() and user_id=(select auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('review-images','review-images',false,650000,array['image/jpeg']);
create policy images_read_members on storage.objects for select to authenticated using(bucket_id='review-images' and public.is_project_member());
create policy images_insert_own on storage.objects for insert to authenticated with check(bucket_id='review-images' and public.is_project_member() and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy images_delete_own on storage.objects for delete to authenticated using(bucket_id='review-images' and public.is_project_member() and (storage.foldername(name))[1]=(select auth.uid())::text);
-- After creating each user in Authentication > Users, run this separately:
-- insert into public.project_members(user_id) values ('USER-UUID-FROM-AUTHENTICATION');
