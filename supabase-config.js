const SUPABASE_URL = 'https://ugikcueacvxshchdwzgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnaWtjdWVhY3Z4c2hjaGR3emd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDMwMDYsImV4cCI6MjA5MTkxOTAwNn0.y2E_GWhVTBtShcbMXYUFX1pcNE0xDYiX2nHMEZ8J5Fg';

// Initialize Supabase client
// The CDN script exposes the global 'supabase' object with createClient
// We must name our instance something else (e.g. supabaseClient) so we don't clobber it.
let supabaseClient = null;

if (typeof supabase !== 'undefined' && supabase.createClient) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase client initialized');
} else {
  console.error('❌ Supabase library failed to load from CDN');
}