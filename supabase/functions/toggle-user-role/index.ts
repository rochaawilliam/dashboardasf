import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { insertAuditLog } from "../_shared/audit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requesterId = claimsData.claims.sub as string;

    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: requesterId,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, makeAdmin } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userId === requesterId && !makeAdmin) {
      return new Response(
        JSON.stringify({ error: 'Cannot remove your own admin role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email for audit
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email || 'unknown';

    if (makeAdmin) {
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

      if (insertError) {
        console.error('Error adding admin role:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add admin role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (deleteError) {
        console.error('Error removing admin role:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove admin role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Audit log
    await insertAuditLog(supabaseAdmin, {
      table_name: 'user_roles',
      record_id: userId,
      action: 'update',
      old_value: { role: makeAdmin ? 'user' : 'admin' },
      new_value: { role: makeAdmin ? 'admin' : 'user', email: userEmail },
      user_id: requesterId,
      description: makeAdmin
        ? `Usuário promovido a admin: ${userEmail}`
        : `Admin removido: ${userEmail}`,
    });

    return new Response(
      JSON.stringify({ success: true, message: makeAdmin ? 'User promoted to admin' : 'Admin role removed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
