const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ctqihscgrepkpjajaixj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cWloc2NncmVwa3BqYWphaXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDA5MzAsImV4cCI6MjA5MzkxNjkzMH0.CHqBAdAv3VW3uerAj_KzsoBzwGjcAS4Fn8yHTZqAp5M";

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;