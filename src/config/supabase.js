import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dlmjxpaxjfafgbjkqjoj.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbWp4cGF4amZhZmdianFxam9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NTMzNDMsImV4cCI6MjA1MTMyOTM0M30.D5MKV7OuFJKL6oiIAfGnVrPvyQUdTKUwRDWfM4b7GVU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
