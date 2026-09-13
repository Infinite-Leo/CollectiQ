// MUST be first — loads .env before any module that reads process.env
import './env.js';
import { supabaseAdmin } from './config/supabase.js';

// Fixed UUID for dev club — always the same so auth.js can reference it
export const DEV_CLUB_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const DEV_EVENT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
export const DEV_PRESIDENT_USER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const DEV_PRESIDENT_AUTH_UID = 'f2345678-9012-3456-7890-abcdefabcdef';

export const DEMO_ACCOUNTS = [
    {
        role: 'president',
        roleTitle: 'Club President',
        name: 'Amitava Mukherjee',
        email: 'president@collectiq.com',
        password: 'Password@123',
        phone: '9830011111',
        icon: '👑',
        badge: 'Executive Admin',
        scope: 'Full Control & Financial Approvals',
        redirect: '/dashboard',
        description: 'Highest executive oversight, target management, expense approvals, and analytics.',
    },
    {
        role: 'secretary',
        roleTitle: 'General Secretary',
        name: 'Debashis Roy',
        email: 'secretary@collectiq.com',
        password: 'Password@123',
        phone: '9830022222',
        icon: '📋',
        badge: 'Operations Lead',
        scope: 'Member Ledger & Communications',
        redirect: '/dashboard',
        description: 'Operations management, member directories, collection drives, and event logistics.',
    },
    {
        role: 'cashier',
        roleTitle: 'Finance Cashier',
        name: 'Subhashish Ghosh',
        email: 'cashier@collectiq.com',
        password: 'Password@123',
        phone: '9830033333',
        icon: '💰',
        badge: 'Finance Desk',
        scope: 'Cash Counters & Daily Reconciliations',
        redirect: '/finance',
        description: 'Cash counter operations, payment reconciliations, ledger verifications, and finance desk.',
    },
    {
        role: 'collector',
        roleTitle: 'Field Collector',
        name: 'Rahul Chakraborty',
        email: 'collector@collectiq.com',
        password: 'Password@123',
        phone: '9830044444',
        icon: '📱',
        badge: 'Field PWA',
        scope: 'Mobile Collection & QR Receipts',
        redirect: '/collector',
        description: 'Door-to-door Puja collection, instant digital receipts, QR passes, and offline syncing.',
    },
];

/**
 * Seeds and synchronizes the 4 SRS demo accounts in Supabase Auth & public DB tables.
 * Guaranteed idempotent and self-healing.
 */
export async function seedDemoAccounts() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️  Skipping demo accounts seed — missing Supabase credentials');
        return;
    }

    try {
        console.log('🌱 Checking & provisioning demo role accounts...');

        // 1. Fetch available roles from public.roles
        const { data: roles, error: rolesErr } = await supabaseAdmin
            .from('roles')
            .select('id, name');

        if (rolesErr || !roles) {
            console.error('❌ Failed to fetch roles for demo accounts:', rolesErr?.message);
            return;
        }

        const roleMap = Object.fromEntries(roles.map(r => [r.name, r.id]));

        // 2. Fetch existing auth users list
        const { data: authData, error: authListErr } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 100,
        });

        const existingAuthUsers = authData?.users || [];

        for (const account of DEMO_ACCOUNTS) {
            const roleId = roleMap[account.role];
            if (!roleId) {
                console.warn(`⚠️ Role "${account.role}" not found in database roles table`);
                continue;
            }

            const existingAuth = existingAuthUsers.find(
                u => u.email?.toLowerCase() === account.email.toLowerCase()
            );

            let authUserId;

            if (existingAuth) {
                authUserId = existingAuth.id;
                // Ensure correct password, confirmed email, and app metadata
                await supabaseAdmin.auth.admin.updateUserById(authUserId, {
                    password: account.password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: account.name,
                        role_title: account.roleTitle,
                    },
                    app_metadata: {
                        role: account.role,
                        club_id: DEV_CLUB_ID,
                    },
                });
            } else {
                // Create auth user
                const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                    email: account.email,
                    password: account.password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: account.name,
                        role_title: account.roleTitle,
                    },
                    app_metadata: {
                        role: account.role,
                        club_id: DEV_CLUB_ID,
                    },
                });

                if (createErr) {
                    console.error(`❌ Failed to create auth user for ${account.email}:`, createErr.message);
                    continue;
                }
                authUserId = created.user.id;
            }

            // 3. Ensure user exists in public.users
            const { data: existingAppUser } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('auth_uid', authUserId)
                .maybeSingle();

            let appUserId;

            if (existingAppUser) {
                appUserId = existingAppUser.id;
                await supabaseAdmin
                    .from('users')
                    .update({
                        full_name: account.name,
                        email: account.email,
                        phone: account.phone,
                        is_active: true,
                    })
                    .eq('id', appUserId);
            } else {
                const { data: newAppUser, error: insertUserErr } = await supabaseAdmin
                    .from('users')
                    .insert({
                        auth_uid: authUserId,
                        full_name: account.name,
                        email: account.email,
                        phone: account.phone,
                        is_active: true,
                    })
                    .select('id')
                    .single();

                if (insertUserErr) {
                    console.error(`❌ Failed to insert public.users for ${account.email}:`, insertUserErr.message);
                    continue;
                }
                appUserId = newAppUser.id;
            }

            // 4. Ensure club membership with the exact role in public.club_members
            const { data: existingMember } = await supabaseAdmin
                .from('club_members')
                .select('id, role_id')
                .eq('club_id', DEV_CLUB_ID)
                .eq('user_id', appUserId)
                .maybeSingle();

            if (existingMember) {
                if (existingMember.role_id !== roleId) {
                    await supabaseAdmin
                        .from('club_members')
                        .update({ role_id: roleId })
                        .eq('id', existingMember.id);
                }
            } else {
                const { error: memberInsertErr } = await supabaseAdmin
                    .from('club_members')
                    .insert({
                        club_id: DEV_CLUB_ID,
                        user_id: appUserId,
                        role_id: roleId,
                    });

                if (memberInsertErr && memberInsertErr.code !== '23505') {
                    console.error(`❌ Failed to link club membership for ${account.email}:`, memberInsertErr.message);
                }
            }

            console.log(`✅ Demo account ready: ${account.icon} ${account.roleTitle} (${account.email})`);
        }

        console.log('✨ All 4 demo role accounts verified and synced successfully.');
    } catch (err) {
        console.error('❌ Error during demo accounts seeding:', err.message);
    }
}

/**
 * Seeds the database with initial data if it doesn't exist.
 * Called once at startup.
 */
export async function seedDevData() {
    // Skip seeding if no Supabase configured
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

        // Ensure a dev president user exists (FK for donations in dev mode)
        const { error: presidentErr } = await supabaseAdmin
            .from('users')
            .upsert({
                id: DEV_PRESIDENT_USER_ID,
                auth_uid: DEV_PRESIDENT_AUTH_UID,
                full_name: 'Dev President',
                phone: '9000000000',
                email: 'president@durganagar.com',
                is_active: true,
            }, { onConflict: 'id' });

        if (presidentErr) {
            console.error('❌ Failed to seed dev president user:', presidentErr.message);
        }

        // Always ensure demo role accounts are seeded and ready
        await seedDemoAccounts();
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        // Don't crash server on seed failure
    }
}

