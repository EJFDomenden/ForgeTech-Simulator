import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// TODO: Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://ugikcueacvxshchdwzgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnaWtjdWVhY3Z4c2hjaGR3emd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDMwMDYsImV4cCI6MjA5MTkxOTAwNn0.y2E_GWhVTBtShcbMXYUFX1pcNE0xDYiX2nHMEZ8J5Fg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches components from public.hardware_components based on category.
 * @param {string} categoryName - e.g., 'Dummy RAM', 'Memory Chip', 'SPD', 'Transistor'
 * @returns {Promise<Array>} Array of component objects
 */
export async function fetchComponentsByCategory(categoryName) {
    try {
        // Start the base query
        let query = supabase
            .from('hardware_components')
            .select('name_id, brand, name, model_file_path, specs, category');

        // Only apply the category filter if the user didn't select "All"
        if (categoryName !== 'All') {
            query = query.eq('category', categoryName);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`ForgeTech DB Error fetching ${categoryName}:`, error.message);
        return [];
    }
}


async function testSupabaseTable() {
    console.log('🚀 Initiating Supabase connection test...');

    // 2. Define the table you want to test
    const tableName = 'hardware_components';

    try {
        // 3. Perform a simple query
        // .select('*') fetches data, .limit(1) tests the connection with minimal load
        const { data, error, status } = await supabase
            .from(tableName)
            .select('*')
            .limit(5);

        // 4. Handle errors from the Supabase API
        if (error) {
            throw error;
        }

        // 5. Success output
        console.log(`✅ Success! Status Code: ${status}`);
        console.log(`--- Data from [${tableName}] ---`);
        
        if (data && data.length > 0) {
            console.table(data);
        } else {
            console.log('Connection successful, but the table is currently empty.');
        }

    } catch (err) {
        console.error('❌ Connection Failed:');
        console.error(`Message: ${err.message}`);
        console.error(`Hint: ${err.hint || 'Check your Table Name and RLS policies.'}`);
    }
}