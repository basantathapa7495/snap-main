-- Keep the legacy publication date in sync with scheduled publishing.
select cron.unschedule('publish-due-school-notices');
select cron.schedule('publish-due-school-notices', '* * * * *',
  $$update public.notices
      set status = 'published',
          published_at = scheduled_at,
          publish_date = (scheduled_at at time zone 'Asia/Kathmandu')::date,
          updated_at = now()
    where status = 'scheduled' and scheduled_at <= now()$$
);
