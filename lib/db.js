import { supabase } from './supabase'

// ─── Projects ────────────────────────────────────────────────────────────────

export async function dbGetProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, is_template, is_public, share_token')
    .eq('is_template', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function dbCreateProject(name, isTemplate = false) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, is_template: isTemplate })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function dbRenameProject(id, name) {
  const { error } = await supabase
    .from('projects')
    .update({ name })
    .eq('id', id)

  if (error) throw error
}

export async function dbSetTemplate(id, isTemplate) {
  const { error } = await supabase
    .from('projects')
    .update({ is_template: isTemplate })
    .eq('id', id)

  if (error) throw error
}

export async function dbDeleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function dbGetTemplates() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .eq('is_template', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// Clone template → project mới (content only, không copy versions)
export async function dbCreateFromTemplate(templateId, newName) {
  const { data: steps, error: stepsErr } = await supabase
    .from('steps')
    .select('step_key, content')
    .eq('project_id', templateId)

  if (stepsErr) throw stepsErr

  const { data: newProject, error: projErr } = await supabase
    .from('projects')
    .insert({ name: newName, is_template: false })
    .select()
    .single()

  if (projErr) throw projErr

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

// Duplicate project (content only, không copy versions)
export async function dbDuplicateProject(sourceId, newName) {
  return dbCreateFromTemplate(sourceId, newName)
}

// ─── Steps ───────────────────────────────────────────────────────────────────

export async function dbGetSteps(projectId) {
  const { data, error } = await supabase
    .from('steps')
    .select('step_key, content, versions, updated_at')
    .eq('project_id', projectId)

  if (error) throw error

  const map = {}
  for (const row of (data || [])) {
    map[row.step_key] = {
      content: row.content ?? '',
      versions: row.versions ?? [],
    }
  }
  return map
}

export async function dbUpsertStep(projectId, stepKey, content, versions) {
  const { error } = await supabase
    .from('steps')
    .upsert(
      {
        project_id: projectId,
        step_key: stepKey,
        content,
        versions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,step_key' }
    )

  if (error) throw error
}

export async function dbUpsertAllSteps(projectId, stepsMap) {
  if (!stepsMap || Object.keys(stepsMap).length === 0) return

  const rows = Object.entries(stepsMap).map(([stepKey, val]) => ({
    project_id: projectId,
    step_key: stepKey,
    content: val?.content ?? '',
    versions: val?.versions ?? [],
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('steps')
    .upsert(rows, { onConflict: 'project_id,step_key' })

  if (error) throw error
}

// ─── Apps ─────────────────────────────────────────────────────────────────────

export async function dbGetApps() {
  const { data, error } = await supabase
    .from('apps')
    .select('id, slug, name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function dbCreateApp(name, slug) {
  const { data, error } = await supabase
    .from('apps')
    .insert({ name, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function dbDeleteApp(id) {
  // projects.app_id → SET NULL via FK cascade
  const { error } = await supabase
    .from('apps')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function dbGetAppBySlug(slug) {
  const { data, error } = await supabase
    .from('apps')
    .select('id, slug, name')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

// Projects với app filter
export async function dbGetProjectsWithApp() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, is_template, is_public, share_token, app_id, apps(id, slug, name)')
    .eq('is_template', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function dbSetProjectApp(projectId, appId) {
  // appId có thể là null (unlink)
  const { error } = await supabase
    .from('projects')
    .update({ app_id: appId })
    .eq('id', projectId)

  if (error) throw error
}
