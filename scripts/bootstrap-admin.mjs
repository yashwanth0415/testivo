import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.ADMIN_EMAIL || 'thurpatiyashwanth@gmail.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Yash@1234';
const USERNAME = process.env.ADMIN_USERNAME || 'YASHWANTH';
const FULL_NAME = process.env.ADMIN_FULL_NAME || 'Yashwanth Thurpati';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}
if (PASSWORD.length < 8) throw new Error('Admin password must be at least 8 characters.');

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

let user = null;
const { data: listed, error: listError } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
user = listed.users.find((u) => (u.email || '').toLowerCase() === EMAIL.toLowerCase()) || null;

if (!user) {
  const { data, error } = await sb.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { full_name: FULL_NAME, username: USERNAME } });
  if (error) throw error;
  user = data.user;
  console.log(`Created admin auth user: ${EMAIL}`);
} else {
  const { error } = await sb.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true, user_metadata: { ...(user.user_metadata || {}), full_name: FULL_NAME, username: USERNAME } });
  if (error) throw error;
  console.log(`Updated existing admin auth user: ${EMAIL}`);
}

const { error: profileError } = await sb.from('profiles').upsert({ auth_user_id: user.id, email: EMAIL, username: USERNAME, full_name: FULL_NAME, is_admin: true, updated_at: new Date().toISOString() }, { onConflict: 'auth_user_id' });
if (profileError) throw profileError;
console.log('Admin profile is_admin=true.');
console.log(`Login: ${EMAIL}`);
console.log('Password: the ADMIN_PASSWORD value used for this run.');
