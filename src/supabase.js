import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lwxfaiageezlybtwddmo.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3eGZhaWFnZWV6bHlidHdkZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTc4ODMsImV4cCI6MjA5NTI3Mzg4M30.iDCg9fOtQPzR-aW4uTtK4EI3GDCXpPS5ycB5T69QHUI";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);