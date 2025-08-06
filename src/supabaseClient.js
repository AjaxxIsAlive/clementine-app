import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcbnhyddgqubljgmhciq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYm5oeWRkZ3F1YmxqZ21oY2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTQ3MDgsImV4cCI6MjA2OTk5MDcwOH0.Oveg5i-HihVKOyu6_jOSgDmnraVwIRMKh_BlstIJTj8';

export const supabase = createClient(supabaseUrl, supabaseKey);