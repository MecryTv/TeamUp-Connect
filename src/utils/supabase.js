const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.DB_URL;
const supabaseKey = process.env.DB_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is not defined");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
