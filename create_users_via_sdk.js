#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function createUsers() {
  console.log('==========================================');
  console.log('Creating users via Supabase Admin API');
  console.log('==========================================\n');

  const users = [
    {
      email: 'michael.silva@startcup-amf.com',
      password: 'MSEvaluator@2025!',
      user_metadata: {
        name: 'Michael Silva',
        role: 'evaluator'
      }
    },
    {
      email: 'bruna.leao@startcup-amf.com',
      password: 'BLEvaluator@2025!',
      user_metadata: {
        name: 'Bruna Leao',
        role: 'evaluator'
      }
    },
    {
      email: 'outsiders@startcup-amf.com',
      password: 'Outsiders@9930!',
      user_metadata: {
        name: 'Outsiders',
        role: 'team'
      }
    }
  ];

  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}...`);

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata
      });

      if (error) {
        console.error(`✗ Error creating ${user.email}:`, error.message);
      } else {
        console.log(`✓ Created ${user.email} (ID: ${data.user.id})`);

        // If evaluator, also add to evaluators table
        if (user.user_metadata.role === 'evaluator') {
          const { data: evalData, error: evalError } = await supabase
            .from('evaluators')
            .insert({
              id: data.user.id,
              name: user.user_metadata.name,
              email: user.email,
              specialty: user.user_metadata.name.includes('Bruna') ? 'Avaliadora' : 'Avaliador',
              is_online: false,
              role: 'evaluator',
              created_at: new Date()
            });

          if (evalError) {
            console.error(`  Warning: Could not add to evaluators table:`, evalError.message);
          } else {
            console.log(`  ✓ Added to evaluators table`);
          }
        }
      }
    } catch (err) {
      console.error(`✗ Exception creating ${user.email}:`, err.message);
    }
  }

  // Update team
  console.log(`\nUpdating team: Mosaico → Outsiders...`);
  try {
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: 'Outsiders',
        email: 'outsiders@startcup-amf.com'
      })
      .eq('name', 'Mosaico');

    if (error) {
      console.error(`✗ Error updating team:`, error.message);
    } else {
      console.log(`✓ Updated team (${data.length} rows affected)`);
    }
  } catch (err) {
    console.error(`✗ Exception updating team:`, err.message);
  }

  console.log('\n==========================================');
  console.log('Operation completed!');
  console.log('==========================================');
}

createUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
