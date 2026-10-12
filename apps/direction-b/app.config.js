// Dynamic config on top of app.json.
// The Supabase URL and anon (publishable) key may live in an untracked
// .env.local next to this file instead of being committed:
//   REVIVEX_SUPABASE_URL=https://<ref>.supabase.co
//   REVIVEX_SUPABASE_ANON_KEY=<anon or publishable key>
// Values already set in app.json win. For EAS builds, set the same names as
// EAS environment variables. Never put a service-role or secret key here.
module.exports = ({ config }) => {
  const extra = config.extra ?? {};
  return {
    ...config,
    extra: {
      ...extra,
      supabaseUrl: extra.supabaseUrl || process.env.REVIVEX_SUPABASE_URL || '',
      supabaseAnonKey: extra.supabaseAnonKey || process.env.REVIVEX_SUPABASE_ANON_KEY || '',
    },
  };
};
