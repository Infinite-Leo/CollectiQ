import { supabaseAdmin } from './config/supabase.js';

// Fixed UUID for dev club — always the same so auth.js can reference it
export const DEV_CLUB_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const DEV_EVENT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

/**
 * Seeds the database with initial data if it doesn't exist.
 * Called once at startup.
 */
export async function seedDevData() {
    if (!process.env.SUPABASE_URL) {
        console.log('⚠️  Skipping DB seed — no Supabase URL configured');
        return;
    }

    try {
        // Check if dev club exists
        const { data: existingClub } = await supabaseAdmin
            .from('clubs')
            .select('id')
            .eq('id', DEV_CLUB_ID)
            .single();

        if (!existingClub) {
            console.log('🌱 Seeding development data...');

            // Update the audit function to handle clubs correctly
            await supabaseAdmin.rpc('exec_sql', {
                sql: `
CREATE OR REPLACE FUNCTION audit_log_fn()
RETURNS TRIGGER AS $$
DECLARE
    audit_club_id UUID;
BEGIN
    -- Special handling for clubs table: club_id is the id field
    IF TG_TABLE_NAME = 'clubs' THEN
        audit_club_id := COALESCE(NEW.id, OLD.id);
    ELSE
        audit_club_id := COALESCE(NEW.club_id, OLD.club_id);
    END IF;

    INSERT INTO audit_logs (
        club_id, user_id, table_name, record_id,
        action, old_data, new_data, created_at
    ) VALUES (
        audit_club_id,
        COALESCE(
            current_setting('app.current_user_id', true)::uuid,
            NULL
        ),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        now()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
                `
            });

            // Temporarily disable audit trigger for seeding
            await supabaseAdmin.rpc('exec_sql', {
                sql: 'ALTER TABLE clubs DISABLE TRIGGER trg_clubs_audit;'
            });

            // Create club
            const { error: clubErr } = await supabaseAdmin
                .from('clubs')
                .upsert({
                    id: DEV_CLUB_ID,
                    name: 'Durga Nagar Club',
                    slug: 'durga-nagar-club',
                    address: '24 Pally Road, Durga Nagar',
                    city: 'Kolkata',
                    state: 'West Bengal',
                    pincode: '700032',
                    phone: '9876543210',
                }, { onConflict: 'id' });

            // Re-enable audit trigger
            await supabaseAdmin.rpc('exec_sql', {
                sql: 'ALTER TABLE clubs ENABLE TRIGGER trg_clubs_audit;'
            });

            if (clubErr) {
                console.error('❌ Failed to seed club:', clubErr.message);
                return;
            }

            // Create active event
            const { error: eventErr } = await supabaseAdmin
                .from('events')
                .upsert({
                    id: DEV_EVENT_ID,
                    club_id: DEV_CLUB_ID,
                    name: 'Durga Puja 2026',
                    description: 'Annual Durga Puja collection drive',
                    start_date: '2026-09-01',
                    end_date: '2026-10-31',
                    status: 'active',
                    target_amount: 500000,
                }, { onConflict: 'id' });

            if (eventErr) {
                console.error('❌ Failed to seed event:', eventErr.message);
                return;
            }

            console.log('✅ Development data seeded: Club + Event created');
        } else {
            console.log('✅ Dev club already exists');
        }
    } catch (err) {
        console.error('❌ Seed error:', err.message);
    }
}
