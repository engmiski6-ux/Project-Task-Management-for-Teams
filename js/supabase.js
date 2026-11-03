// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 1. Supabase Project Credentials
const SUPABASE_URL = 'https://dburalygntomvxvnzqdf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_k7rMOhz8F18s0Mef5pxlzw_97F0lA5e';

// 2. Export Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);