-- Atomic upsert + increment for daily_metrics columns.
-- Called from /api/vc/sync to update funnel counts as dispositions arrive.
-- Uses INSERT ... ON CONFLICT so concurrent webhook calls don't race.

CREATE OR REPLACE FUNCTION public.increment_daily_metric(
  p_client_id uuid,
  p_date      date,
  p_platform  text,
  p_column    text,
  p_amount    integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed_columns text[] := ARRAY[
    'leads_count', 'contacted_count', 'qualified_count',
    'booked_count', 'closed_count', 'disqualified_count',
    'no_answer_count', 'voicemail_count'
  ];
BEGIN
  -- Guard against SQL injection via dynamic column name
  IF NOT (p_column = ANY(allowed_columns)) THEN
    RAISE EXCEPTION 'Column % is not an allowed metric column', p_column;
  END IF;

  INSERT INTO public.daily_metrics (client_id, date, platform)
  VALUES (p_client_id, p_date, p_platform)
  ON CONFLICT (client_id, date, platform) DO NOTHING;

  EXECUTE format(
    'UPDATE public.daily_metrics SET %I = COALESCE(%I, 0) + $1
     WHERE client_id = $2 AND date = $3 AND platform = $4',
    p_column, p_column
  ) USING p_amount, p_client_id, p_date, p_platform;
END;
$$;

-- Only callable by service role (used in server-side API routes)
REVOKE ALL ON FUNCTION public.increment_daily_metric FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_daily_metric TO service_role;
