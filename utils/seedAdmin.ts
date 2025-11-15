import { supabase, supabaseService } from '../src/services/supabase';

// Placeholder service key - replace with real one
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Real service role key

const serviceClient = supabaseService(SERVICE_KEY);

async function seedAdmin() {
  try {
    // Assume schema updated manually: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
    console.log('Assuming schema updated: profiles.role column added');

    // Create admin user
    const { data: adminUser, error: userError } = await serviceClient.auth.admin.createUser({
      email: 'admin@upsc.ai',
      password: 'admin123',
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (userError) throw userError;

    // Upsert profile with role
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({
        id: adminUser.user.id,
        username: 'admin',
        full_name: 'Admin User',
        role: 'admin',
        updated_at: new Date().toISOString()
      });
    if (profileError) throw profileError;

    console.log('✅ Admin seeded: admin@upsc.ai / admin123 (role: admin)');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

seedAdmin();
