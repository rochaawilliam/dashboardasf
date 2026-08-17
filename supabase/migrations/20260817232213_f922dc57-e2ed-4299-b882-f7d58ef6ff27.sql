UPDATE public.financial_sheet_sources 
SET csv_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7pbmT3trZAd5iIi1N4wWsipyEDuoNlMXXQ_pQcQoshcdYGRlIqfUEDEJwQwNzMQ/pub?output=csv',
    last_synced_at = NULL
WHERE month = 8 AND year = 2026;