// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO SUPABASE
const supabaseUrl = 'https://jvuwtfcbdymukausnrag.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dXd0ZmNiZHltdWthdXNucmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDY4OTUsImV4cCI6MjA3OTEyMjg5NX0.B3RQYyXwYA-59b7mTaxYo0vEH_TNo9devLO8AiO4cxw'

export const supabase = createClient(supabaseUrl, supabaseKey)