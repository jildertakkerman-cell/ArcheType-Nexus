/**
 * Supabase Configuration for Gameplay Tags
 * 
 * To enable gameplay tags in card popups:
 * 1. Get your credentials from: https://supabase.com/dashboard/project/_/settings/api
 * 2. Replace the placeholder values below with your actual project URL and anon key
 * 3. Ensure the Supabase CDN is loaded BEFORE this script
 * 
 * The anon key is safe to expose in frontend code when Row Level Security (RLS) is enabled.
 */
window.SUPABASE_CONFIG = {
    // Your Supabase project URL (e.g., 'https://yourproject.supabase.co')
    url: 'https://pdvrdrmmykbznmojacwp.supabase.co',

    // Your Supabase anon/public key (safe for frontend with RLS enabled)
    anonKey: 'sb_publishable_ia1JW1tEjKQgUFe2ni5WQA_qgBU45JZ'
};

// Note: If these values are empty, the card loader will silently skip the tags feature
// and continue working normally without gameplay tags.
