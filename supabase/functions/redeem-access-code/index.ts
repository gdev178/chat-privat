import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;
const CODE_LENGTH = 16;

interface RedeemRequest {
    accessCode: string;
    displayName?: string;
}

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function generateSecureCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint8Array(CODE_LENGTH);
    crypto.getRandomValues(array);
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += chars[array[i] % chars.length];
    }
    return code;
}

async function hashCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return 'unknown';
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    
    if (!entry) {
        rateLimitMap.set(ip, { count: 1, firstAttempt: now });
        return true;
    }
    
    const windowMs = ATTEMPT_WINDOW_MINUTES * 60 * 1000;
    if (now - entry.firstAttempt > windowMs) {
        rateLimitMap.set(ip, { count: 1, firstAttempt: now });
        return true;
    }
    
    if (entry.count >= MAX_ATTEMPTS) {
        return false;
    }
    
    entry.count++;
    return true;
}

Deno.serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const clientIP = getClientIP(req);
    
    if (!checkRateLimit(clientIP)) {
        return new Response(
            JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const body: RedeemRequest = await req.json();
        const { accessCode, displayName } = body;

        if (!accessCode || typeof accessCode !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Access code is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (accessCode.length < 8 || accessCode.length > 32) {
            return new Response(
                JSON.stringify({ error: 'Invalid access code format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const codeHash = await hashCode(accessCode.toUpperCase());

        const { data: accessCodeRecord, error: codeError } = await supabase
            .from('access_codes')
            .select('id, user_id, expires_at, used_at, revoked_at')
            .eq('code_hash', codeHash)
            .single();

        if (codeError || !accessCodeRecord) {
            return new Response(
                JSON.stringify({ error: 'Invalid access code' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (accessCodeRecord.used_at) {
            return new Response(
                JSON.stringify({ error: 'Access code has already been used' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (accessCodeRecord.revoked_at) {
            return new Response(
                JSON.stringify({ error: 'Access code has been revoked' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (accessCodeRecord.expires_at && new Date(accessCodeRecord.expires_at) < new Date()) {
            return new Response(
                JSON.stringify({ error: 'Access code has expired' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, is_active, role')
            .eq('id', accessCodeRecord.user_id)
            .single();

        if (profileError || !profile || !profile.is_active) {
            return new Response(
                JSON.stringify({ error: 'Account not found or inactive' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (profile.role !== 'user') {
            return new Response(
                JSON.stringify({ error: 'Invalid account type' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateAccessToken(
            accessCodeRecord.user_id
        );

        if (sessionError || !sessionData) {
            return new Response(
                JSON.stringify({ error: 'Failed to create session' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { error: updateError } = await supabase
            .from('access_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('id', accessCodeRecord.id);

        if (updateError) {
            console.error('Failed to mark code as used:', updateError);
        }

        if (displayName) {
            await supabase
                .from('profiles')
                .update({ display_name: displayName })
                .eq('id', accessCodeRecord.user_id);
        }

        return new Response(
            JSON.stringify({
                success: true,
                session: sessionData,
                userId: accessCodeRecord.user_id
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Redeem error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});