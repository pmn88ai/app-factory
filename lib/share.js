import { supabase } from './supabase'

// Tạo share token dạng: 21 ký tự alphanumeric (không dùng nanoid để tránh thêm dep)
export function generateShareToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(21)
  crypto.getRandomValues(array)
  return Array.from(array, b => chars[b % chars.length]).join('')
}

// Bật sharing: tạo token nếu chưa có, set is_public = true
export async function dbEnableSharing(projectId) {
  const token = generateShareToken()

  const { data, error } = await supabase
    .from('projects')
    .update({ share_token: token, is_public: true })
    .eq('id', projectId)
    .select('share_token')
    .single()

  if (error) throw error
  return data.share_token
}

// Tắt sharing: is_public = false (giữ token để không broken link ngay)
export async function dbDisableSharing(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({ is_public: false })
    .eq('id', projectId)

  if (error) throw error
}

// Lấy project + steps qua share_token (public, không cần auth)
// Dùng service-side query — gọi từ API route để không lộ project.id ra client
export async function dbGetPublicProject(token) {
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, name, is_public, share_token')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (projErr || !project) return null

  const { data: steps, error: stepsErr } = await supabase
    .from('steps')
    .select('step_key, content')
    .eq('project_id', project.id)

  if (stepsErr) return null

  // Trả về — KHÔNG expose project.id
  return {
    name: project.name,
    share_token: project.share_token,
    steps: steps ?? [],
  }
}

// Fork: clone project public về thành project của user hiện tại
export async function dbForkProject(token, newName) {
  // 1. Fetch public project (chỉ cần step content)
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, name')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (projErr || !project) throw new Error('Project không tồn tại hoặc không public.')

  const { data: steps, error: stepsErr } = await supabase
    .from('steps')
    .select('step_key, content')
    .eq('project_id', project.id)

  if (stepsErr) throw stepsErr

  // 2. Tạo project mới cho user hiện tại (trigger tự set user_id = auth.uid())
  const { data: newProject, error: newProjErr } = await supabase
    .from('projects')
    .insert({ name: newName, is_template: false, is_public: false })
    .select()
    .single()

  if (newProjErr) throw newProjErr

  // 3. Insert steps — fresh, không copy versions
  if (steps && steps.length > 0) {
    const rows = steps.map(s => ({
      project_id: newProject.id,
      step_key: s.step_key,
      content: s.content ?? '',
      versions: [],
      updated_at: new Date().toISOString(),
    }))
    const { error: insertErr } = await supabase.from('steps').insert(rows)
    if (insertErr) throw insertErr
  }

  return newProject
}
