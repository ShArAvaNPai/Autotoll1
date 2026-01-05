
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fansthlshdyvugoznogw.supabase.co';
const supabaseKey = 'sb_publishable_b8ncxS4KxLoamYuD4NGxTw_GG8GRdhn';

export const supabase = createClient(supabaseUrl, supabaseKey);
