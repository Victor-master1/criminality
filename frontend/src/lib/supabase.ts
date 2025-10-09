/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ltsuvqibdhemagwecayy.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0c3V2cWliZGhlbWFnd2VjYXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDkxODYsImV4cCI6MjA3NTUyNTE4Nn0.mLRkOiywHHAfERD1nae13LJxNgwlRYJ9xtniudoFjts'

export const supabase = createClient(supabaseUrl, supabaseKey)