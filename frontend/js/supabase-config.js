/*
 * Aldijos — configuração do cliente Supabase.
 *
 * A "publishable key" é segura para expor publicamente (é isso que significa
 * "publishable"/antiga "anon public"): a segurança real vem das políticas de
 * Row Level Security definidas no esquema (ver supabase/migrations/), nunca
 * do segredo desta chave. A "secret key" NUNCA deve aparecer aqui.
 */
window.SUPABASE_URL = 'https://qafvvcbywshdncbrwiot.supabase.co';
window.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_wLshfV0JoSpLfWLScfFWkw_vTDe5y42';
