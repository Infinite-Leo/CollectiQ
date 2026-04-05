import { supabaseAdmin } from './config/supabase.js';

// Fixed UUID for dev club — always the same so auth.js can reference it
export const DEV_CLUB_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const DEV_EVENT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

/**
 * Seeds the database with initial data if it doesn't exist.
 * Called once at startup.
 *
 * In production: Skipped (DB should already be seeded)
 * In development: Creates seed data if DB is empty
 */
export async function seedDevData() {
    // Skip seeding if no Supabase configured
    if (!process.env.SUPABASE_URL) {
        console.log('⚠️  Skipping DB seed — no Supabase URL configured');
        return;
    }

    // Skip seeding in production to avoid re-initializing data
    if (process.env.NODE_ENV === 'production') {
        console.log('ℹ️  Production mode: skipping seed (database pre-initialized)');
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
            console.log('✅ Dev club already exists - skipping seed');
        }
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        // Don't crash server on seed failure
    }
}
