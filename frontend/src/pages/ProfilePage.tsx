import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Badge, Button, EmptyState, Input, Label, Spinner, Textarea } from '../components/ui'
import { useProfile, useUpdateProfile } from '../features/profiles/api'
import { CAMPUS_ROLE_LABELS, DIFFICULTIES, DIFFICULTY_LABELS, type CampusRole, type Difficulty } from '../lib/constants'
import { Select } from '../components/ui/Select'

export function ProfilePage() {
  const { id } = useParams<{ id?: string }>()
  const { user, profile: me, refreshProfile } = useAuth()
  const profileId = id ?? user?.id
  const isOwn = !!user && profileId === user.id
  const { data: profile, isLoading, error } = useProfile(profileId)
  const update = useUpdateProfile()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [experience, setExperience] = useState<Difficulty>('beginner')
  const [openToWork, setOpenToWork] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name)
    setHeadline(profile.headline ?? '')
    setBio(profile.bio ?? '')
    setSkills((profile.skill_tags ?? []).join(', '))
    setLinkedin(profile.linkedin_url ?? '')
    setPortfolio(profile.portfolio_url ?? '')
    setExperience((profile.experience_level as Difficulty) ?? 'beginner')
    setOpenToWork(profile.is_open_to_work)
  }, [profile])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (error || !profile) {
    return <EmptyState title="Profile not found" />
  }

  const save = async () => {
    setMsg(null)
    try {
      await update.mutateAsync({
        id: profile.id,
        patch: {
          full_name: fullName,
          headline: headline || null,
          bio: bio || null,
          skill_tags: skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          linkedin_url: linkedin || null,
          portfolio_url: portfolio || null,
          experience_level: experience,
          is_open_to_work: openToWork,
        },
      })
      await refreshProfile()
      setEditing(false)
      setMsg('Saved')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest-900">{profile.full_name}</h1>
          <p className="mt-1 text-sm text-muted">{profile.college_email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{CAMPUS_ROLE_LABELS[profile.campus_role as CampusRole]}</Badge>
            {profile.department && <Badge tone="muted">{profile.department.code}</Badge>}
            {profile.experience_level && (
              <Badge tone="teal">
                {DIFFICULTY_LABELS[profile.experience_level as Difficulty]}
              </Badge>
            )}
            <Badge tone="accent">{Number(profile.avg_rating).toFixed(1)} ★</Badge>
            {profile.is_open_to_work && <Badge tone="success">Open to work</Badge>}
            {isOwn && me?.is_admin && <Badge tone="warn">Admin</Badge>}
          </div>
        </div>
        {isOwn && !editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit profile
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="mt-8 space-y-4">
          {profile.headline && <p className="text-lg text-forest-800">{profile.headline}</p>}
          {profile.bio && <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{profile.bio}</p>}
          {profile.skill_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skill_tags.map((s) => (
                <Badge key={s} tone="muted">
                  {s}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} className="text-teal-600 hover:underline" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} className="text-teal-600 hover:underline" target="_blank" rel="noreferrer">
                Portfolio
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Headline</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <Label>Skills (comma-separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
          <div>
            <Label>Experience</Label>
            <Select value={experience} onChange={(e) => setExperience(e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>LinkedIn URL</Label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
          <div>
            <Label>Portfolio URL</Label>
            <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={openToWork}
              onChange={(e) => setOpenToWork(e.target.checked)}
            />
            Open to work
          </label>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={update.isPending}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {msg && <p className="mt-4 text-sm text-muted">{msg}</p>}
    </div>
  )
}
