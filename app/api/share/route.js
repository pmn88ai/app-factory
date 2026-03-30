import { createClient } from '@supabase/supabase-js'

// Dùng service_role key để bypass RLS khi read public project
// (hoặc anon key cũng được vì đã có RLS policy public read)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token || token.length < 10) {
    return Response.json({ error: 'Token không hợp lệ' }, { status: 400 })
  }

  try {
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, name, is_public, share_token')
      .eq('share_token', token)
      .eq('is_public', true)
      .single()

    if (projErr || !project) {
      return Response.json({ error: 'Không tìm thấy project hoặc đã tắt chia sẻ' }, { status: 404 })
    }

    const { data: steps, error: stepsErr } = await supabase
      .from('steps')
      .select('step_key, content')
      .eq('project_id', project.id)

    if (stepsErr) throw stepsErr

    // Trả về data — KHÔNG bao gồm project.id
    return Response.json({
      name: project.name,
      share_token: project.share_token,
      steps: steps ?? [],
    })
  } catch (err) {
    console.error('Share API error:', err)
    return Response.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
