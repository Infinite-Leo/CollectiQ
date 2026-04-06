import { supabaseAdmin } from '../config/supabase.js';

const LEGACY_ROLE_MAP = {
    owner: 'president',
    admin: 'secretary',
    viewer: 'cashier',
};

const DEFAULT_AUTO_ROLE = 'collector';

export function normalizeRole(role) {
    return LEGACY_ROLE_MAP[role] || role || null;
}

function getDisplayName(authUser) {
    return authUser.user_metadata?.full_name
        || authUser.user_metadata?.name
        || authUser.email?.split('@')[0]
        || 'User';
}

function extractRoleName(roleRelation) {
    if (!roleRelation) return null;
    if (Array.isArray(roleRelation)) return roleRelation[0]?.name || null;
    return roleRelation.name || null;
}

async function getAppUserByAuthUid(authUid) {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, phone, is_active')
        .eq('auth_uid', authUid)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function ensureAppUser(authUser) {
    const existing = await getAppUserByAuthUid(authUser.id);
    if (existing) return existing;

    const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
            auth_uid: authUser.id,
            full_name: getDisplayName(authUser),
            email: authUser.email || null,
        })
        .select('id, full_name, email, phone, is_active')
        .single();

    if (!error) return data;

    if (error.code === '23505') {
        const retried = await getAppUserByAuthUid(authUser.id);
        if (retried) return retried;
    }

    throw error;
}

async function getMembership(appUserId) {
    const { data, error } = await supabaseAdmin
        .from('club_members')
        .select('club_id, joined_at, roles(name)')
        .eq('user_id', appUserId)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        clubId: data.club_id,
        role: normalizeRole(extractRoleName(data.roles)),
    };
}

async function autoAssignFirstClubMembership(appUserId) {
    // Get the first club (ordered by creation date)
    const { data: club, error: clubError } = await supabaseAdmin
        .from('clubs')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (clubError) throw clubError;
    if (!club) return null;

    const { data: role, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', DEFAULT_AUTO_ROLE)
        .single();

    if (roleError) throw roleError;

    const { error: insertError } = await supabaseAdmin
        .from('club_members')
        .insert({
            club_id: club.id,
            user_id: appUserId,
            role_id: role.id,
        });

    if (insertError && insertError.code !== '23505') {
        throw insertError;
    }

    return getMembership(appUserId);
}

async function syncAppMetadata(authUser, membership) {
    if (!membership) return false;

    const currentClubId = authUser.app_metadata?.club_id || null;
    const currentRole = authUser.app_metadata?.role || null;

    if (currentClubId === membership.clubId && currentRole === membership.role) {
        return false;
    }

    const nextAppMetadata = {
        ...(authUser.app_metadata || {}),
        club_id: membership.clubId,
        role: membership.role,
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        app_metadata: nextAppMetadata,
    });

    if (error) throw error;

    authUser.app_metadata = data.user?.app_metadata || nextAppMetadata;
    return true;
}

export async function resolveUserContext(authUser, options = {}) {
    const { autoAssignIfSingleClub = false } = options;
    const appUser = await ensureAppUser(authUser);

    let membership = await getMembership(appUser.id);
    let membershipCreated = false;

    if (!membership && autoAssignIfSingleClub) {
        membership = await autoAssignFirstClubMembership(appUser.id);
        membershipCreated = Boolean(membership);
    }

    const appMetadataUpdated = await syncAppMetadata(authUser, membership);
    const fallbackRole = normalizeRole(authUser.app_metadata?.role);
    const fallbackClubId = authUser.app_metadata?.club_id || null;

    return {
        authUser,
        appUser,
        appUserId: appUser.id,
        clubId: membership?.clubId || fallbackClubId,
        userRole: membership?.role || fallbackRole,
        membership,
        membershipCreated,
        appMetadataUpdated,
    };
}
