/**
 * Minimal local stand-in for the Supabase endpoints the apps use, for running
 * the live sync spec without a project (npm run e2e:mock). In-memory, one
 * process. NOT a security boundary and NOT a substitute for the real-project
 * run: it emulates owner-only row access and the updated_at/deleted_at
 * behaviour of db/schema.sql, nothing more.
 *
 * Implements: auth signup, password and refresh-token grants, user, logout;
 * PostgREST-style GET (eq, gt, is.null, order, limit, select), POST upsert
 * (on_conflict), PATCH, DELETE, with JSON or single-object responses.
 *
 * Usage: node e2e/mock-supabase.mjs [port]   (default 54329)
 */
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.argv[2] ?? 54329);
const users = new Map(); // email -> { id, email, password, createdAt }
const tables = new Map(); // table -> Map(key -> row)
let lastStamp = 0;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Range, X-Total-Count',
};

/** Postgres-style timestamptz with microseconds, strictly increasing. */
function stamp() {
  let ms = Date.now();
  if (ms <= lastStamp) ms = lastStamp + 1;
  lastStamp = ms;
  const micro = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return new Date(ms).toISOString().replace('Z', `${micro}+00:00`);
}

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
function tokenFor(user) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp })}.mock`;
}
function userFromToken(header) {
  const token = (header ?? '').replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return [...users.values()].find((user) => user.id === claims.sub) ?? null;
  } catch {
    return null;
  }
}
function userJson(user) {
  return {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: user.createdAt,
    created_at: user.createdAt,
    updated_at: user.createdAt,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
  };
}
function session(user) {
  const refresh = randomUUID();
  user.refreshTokens = [...(user.refreshTokens ?? []), refresh];
  return { access_token: tokenFor(user), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: refresh, user: userJson(user) };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
async function readBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function tableRows(name) {
  if (!tables.has(name)) tables.set(name, new Map());
  return tables.get(name);
}
function ownerColumn(table) {
  return table === 'profiles' ? 'id' : 'user_id';
}
function applyFilters(rows, params) {
  let out = rows;
  for (const [column, raw] of params) {
    if (['select', 'order', 'limit', 'on_conflict', 'columns'].includes(column)) continue;
    const dot = raw.indexOf('.');
    const op = raw.slice(0, dot);
    const value = raw.slice(dot + 1);
    if (op === 'eq') out = out.filter((row) => String(row[column]) === value);
    else if (op === 'gt') out = out.filter((row) => row[column] != null && Date.parse(row[column]) > Date.parse(value));
    else if (op === 'lt') out = out.filter((row) => row[column] != null && Date.parse(row[column]) < Date.parse(value));
    else if (op === 'is' && value === 'null') out = out.filter((row) => row[column] == null);
  }
  const order = params.get('order');
  if (order) {
    const [column, direction] = order.split('.');
    out = [...out].sort((a, b) => (String(a[column]) < String(b[column]) ? -1 : String(a[column]) > String(b[column]) ? 1 : 0) * (direction === 'desc' ? -1 : 1));
  }
  const limit = params.get('limit');
  if (limit) out = out.slice(0, Number(limit));
  return out;
}
function project(rows, select) {
  if (!select || select === '*') return rows;
  const columns = select.split(',').map((column) => column.trim());
  return rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column] ?? null])));
}
function respondRows(req, res, rows, status = 200) {
  const single = (req.headers.accept ?? '').includes('vnd.pgrst.object');
  if (!single) return send(res, status, rows);
  if (rows.length !== 1) return send(res, 406, { code: 'PGRST116', message: `JSON object requested, multiple (or no) rows returned`, details: `The result contains ${rows.length} rows` });
  return send(res, status, rows[0]);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    if (path === '/health') return send(res, 200, { ok: true });

    // ---------- auth ----------
    if (path === '/auth/v1/signup' && req.method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email ?? '').toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { code: 400, error_code: 'validation_failed', msg: 'Unable to validate email address: invalid format' });
      if (users.has(email)) return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
      const user = { id: randomUUID(), email, password: body.password, createdAt: new Date().toISOString() };
      users.set(email, user);
      tableRows('profiles').set(user.id, { id: user.id, username: null, display_name: '', bio: '', avatar_url: null, created_at: stamp(), updated_at: stamp() });
      return send(res, 200, session(user));
    }
    if (path === '/auth/v1/token' && req.method === 'POST') {
      const body = await readBody(req);
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        const user = users.get(String(body.email ?? '').toLowerCase());
        if (!user || user.password !== body.password) return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        return send(res, 200, session(user));
      }
      if (grant === 'refresh_token') {
        const user = [...users.values()].find((candidate) => (candidate.refreshTokens ?? []).includes(body.refresh_token));
        if (!user) return send(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
        return send(res, 200, session(user));
      }
      return send(res, 400, { msg: 'unsupported grant_type' });
    }
    if (path === '/auth/v1/user' && req.method === 'GET') {
      const user = userFromToken(req.headers.authorization);
      return user ? send(res, 200, userJson(user)) : send(res, 401, { msg: 'invalid JWT' });
    }
    if (path === '/auth/v1/logout') return send(res, 204);

    // ---------- rest ----------
    const rest = /^\/rest\/v1\/([a-z_]+)$/.exec(path);
    if (!rest) return send(res, 404, { message: `mock has no route for ${req.method} ${path}` });
    const table = rest[1];
    const user = userFromToken(req.headers.authorization);
    if (!user) return send(res, 401, { message: 'mock requires a signed-in user' });
    const owner = ownerColumn(table);
    const store = tableRows(table);
    const own = () => [...store.values()].filter((row) => row[owner] === user.id);

    if (req.method === 'GET') {
      return respondRows(req, res, project(applyFilters(own(), url.searchParams), url.searchParams.get('select')));
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const input = Array.isArray(body) ? body : [body];
      const conflict = (url.searchParams.get('on_conflict') ?? '').split(',').filter(Boolean);
      const merge = (req.headers.prefer ?? '').includes('merge-duplicates');
      const written = [];
      for (const row of input) {
        if (row[owner] !== user.id) return send(res, 403, { code: '42501', message: 'new row violates row-level security policy' });
        const key = conflict.length ? conflict.map((column) => row[column]).join('|') : randomUUID();
        const existing = store.get(key);
        if (existing && !merge) return send(res, 409, { code: '23505', message: 'duplicate key value violates unique constraint' });
        const now = stamp();
        const next = { ...(existing ?? { id: randomUUID(), created_at: now }), ...row, updated_at: now };
        store.set(key, next);
        written.push(next);
      }
      const wantsRows = (req.headers.prefer ?? '').includes('return=representation');
      return wantsRows ? respondRows(req, res, project(written, url.searchParams.get('select')), 201) : send(res, 201);
    }
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const matches = applyFilters(own(), url.searchParams);
      const now = stamp();
      for (const row of matches) Object.assign(row, body, { updated_at: now });
      const wantsRows = (req.headers.prefer ?? '').includes('return=representation');
      return wantsRows ? respondRows(req, res, project(matches, url.searchParams.get('select'))) : send(res, 204);
    }
    if (req.method === 'DELETE') {
      const matches = new Set(applyFilters(own(), url.searchParams));
      for (const [key, row] of store) if (matches.has(row)) store.delete(key);
      return send(res, 204);
    }
    return send(res, 405, { message: 'method not allowed' });
  } catch (error) {
    return send(res, 500, { message: String(error?.message ?? error) });
  }
});

server.listen(port, '127.0.0.1', () => console.log(`mock supabase on http://127.0.0.1:${port}`));
