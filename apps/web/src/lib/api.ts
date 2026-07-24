import { createClient } from './supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

async function getAuthHeader() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No active session')
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

export async function fetchProjects() {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/projects`, { headers })
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

export async function createProject(data: { name: string, description?: string, rawIdea: string }) {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create project')
  return res.json()
}

export async function getProject(id: string) {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch project')
  return res.json()
}

export async function updateProject(id: string, data: any) {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update project')
  return res.json()
}

export async function deleteProject(id: string) {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers
  })
  if (!res.ok) throw new Error('Failed to delete project')
  return res.json()
}
