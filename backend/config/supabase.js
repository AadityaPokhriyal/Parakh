const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Warning: Missing SUPABASE_URL or SUPABASE_ANON_KEY. Database saving features will not work."
  );
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

module.exports = supabase;


