-- =============================================================================
-- BSBRA Digital Platform — 06 · Search & reporting (Requirement 26)
-- All objects run with the caller's privileges (security invoker), so Row
-- Level Security decides what each visitor can find.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Global search across news, pages, publications, yards, vessels & compliance.
-- Matches English and Bangla text with ILIKE (trigram-indexed) and ranks by
-- trigram similarity, boosting title matches.
-- -----------------------------------------------------------------------------
create or replace function public.global_search(q text, max_results integer default 40)
returns table (
  kind        text,
  id          uuid,
  slug        text,
  title_en    text,
  title_bn    text,
  snippet_en  text,
  snippet_bn  text,
  meta        text,
  rank        real
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with term as (
    select
      trim(q) as t,
      '%' || replace(replace(replace(trim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat
  ),
  hits as (
    select 'post'::text as kind, p.id, p.slug, p.title_en, p.title_bn,
           p.excerpt_en as snippet_en, p.excerpt_bn as snippet_bn, p.type::text as meta,
           greatest(similarity(p.title_en, t.t), similarity(coalesce(p.title_bn, ''), t.t))
             + case when p.title_en ilike t.pat or p.title_bn ilike t.pat then 1 else 0 end as rank
      from posts p, term t
     where p.status = 'published'
       and (p.title_en ilike t.pat or p.title_bn ilike t.pat
            or p.excerpt_en ilike t.pat or p.excerpt_bn ilike t.pat
            or p.body_en ilike t.pat or p.body_bn ilike t.pat)

    union all
    select 'page', g.id, g.slug, g.title_en, g.title_bn, g.summary_en, g.summary_bn, null,
           greatest(similarity(g.title_en, t.t), similarity(coalesce(g.title_bn, ''), t.t))
             + case when g.title_en ilike t.pat or g.title_bn ilike t.pat then 1 else 0 end
      from pages g, term t
     where g.status = 'published'
       and (g.title_en ilike t.pat or g.title_bn ilike t.pat
            or g.summary_en ilike t.pat or g.summary_bn ilike t.pat
            or g.body_en ilike t.pat or g.body_bn ilike t.pat)

    union all
    select 'document', d.id, null, d.title_en, d.title_bn, d.description_en, d.description_bn,
           d.category || coalesce(' · ' || d.year::text, ''),
           greatest(similarity(d.title_en, t.t), similarity(coalesce(d.title_bn, ''), t.t))
             + case when d.title_en ilike t.pat or d.title_bn ilike t.pat then 1 else 0 end
      from documents d, term t
     where d.status = 'published'
       and (d.title_en ilike t.pat or d.title_bn ilike t.pat
            or d.description_en ilike t.pat or d.description_bn ilike t.pat)

    union all
    select 'yard', y.id, y.slug, y.name_en, y.name_bn, y.address_en, y.address_bn, y.status,
           greatest(similarity(y.name_en, t.t), similarity(coalesce(y.name_bn, ''), t.t))
             + case when y.name_en ilike t.pat or y.name_bn ilike t.pat then 1 else 0 end
      from yards y, term t
     where y.is_published
       and (y.name_en ilike t.pat or y.name_bn ilike t.pat or y.owner_company ilike t.pat
            or y.address_en ilike t.pat or y.address_bn ilike t.pat)

    union all
    select 'vessel', v.id, null, v.vessel_name, null,
           concat_ws(' · ', 'IMO ' || v.imo_number, v.flag, v.recycling_year::text), null, v.vessel_type,
           similarity(v.vessel_name, t.t)
             + case when v.vessel_name ilike t.pat or v.imo_number = t.t then 1 else 0 end
      from vessels v, term t
     where v.is_published
       and (v.vessel_name ilike t.pat or v.former_names ilike t.pat
            or v.imo_number = t.t or v.flag ilike t.pat)

    union all
    select 'compliance', c.id, null, c.title_en, c.title_bn, c.summary_en, c.summary_bn, c.category,
           greatest(similarity(c.title_en, t.t), similarity(coalesce(c.title_bn, ''), t.t))
             + case when c.title_en ilike t.pat or c.title_bn ilike t.pat then 1 else 0 end
      from compliance_items c, term t
     where c.is_published
       and (c.title_en ilike t.pat or c.title_bn ilike t.pat
            or c.summary_en ilike t.pat or c.summary_bn ilike t.pat)
  )
  select h.kind, h.id, h.slug, h.title_en, h.title_bn, h.snippet_en, h.snippet_bn, h.meta, h.rank::real
    from hits h, term t
   where char_length(t.t) >= 2
   order by h.rank desc, h.title_en
   limit least(greatest(max_results, 1), 100);
$$;

grant execute on function public.global_search(text, integer) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Reporting views
-- -----------------------------------------------------------------------------

-- Vessels recycled per year, derived from the vessel database.
create or replace view public.vessel_year_summary
with (security_invoker = true) as
select
  v.recycling_year            as year,
  count(*)::integer           as vessels,
  coalesce(sum(v.ldt), 0)     as total_ldt,
  count(distinct v.yard_id)::integer as yards
from public.vessels v
where v.is_published and v.recycling_year is not null
group by v.recycling_year;

-- Vessel mix by type.
create or replace view public.vessel_type_summary
with (security_invoker = true) as
select
  v.vessel_type,
  count(*)::integer        as vessels,
  coalesce(sum(v.ldt), 0)  as total_ldt
from public.vessels v
where v.is_published
group by v.vessel_type;

-- Yard-wise totals.
create or replace view public.yard_vessel_summary
with (security_invoker = true) as
select
  y.id                         as yard_id,
  y.slug,
  y.name_en,
  y.name_bn,
  y.status,
  count(v.id)::integer         as vessels,
  coalesce(sum(v.ldt), 0)      as total_ldt,
  max(v.beaching_date)         as last_beaching
from public.yards y
left join public.vessels v on v.yard_id = y.id and v.is_published
where y.is_published
group by y.id;

grant select on public.vessel_year_summary, public.vessel_type_summary, public.yard_vessel_summary
  to anon, authenticated;
