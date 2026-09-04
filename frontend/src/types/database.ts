import type {
  ApplicationStatus,
  CampusRole,
  Difficulty,
  ListingType,
  Mode,
  TaskStatus,
} from '../lib/constants'

export type Department = {
  id: string
  code: string
  name: string
  created_at: string
}

export type CategoryKind = 'technical' | 'non_technical'

export type Category = {
  id: string
  name: string
  kind: CategoryKind
  created_at: string
}

export type Profile = {
  id: string
  full_name: string
  college_email: string
  campus_role: CampusRole
  department_id: string | null
  roll_or_employee_id: string | null
  program: string | null
  year_of_study: number | null
  designation: string | null
  experience_level: Difficulty | null
  bio: string | null
  headline: string | null
  avatar_url: string | null
  skill_tags: string[]
  linkedin_url: string | null
  portfolio_url: string | null
  is_open_to_work: boolean
  can_host_workshops: boolean
  avg_rating: number
  completed_count?: number
  wallet_balance: number
  is_admin: boolean
  is_suspended: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
  department?: Department | null
}

export type Task = {
  id: string
  poster_id: string
  worker_id: string | null
  listing_type: ListingType
  title: string
  description: string
  category_id: string
  difficulty: Difficulty
  budget: number
  deadline: string | null
  venue: string | null
  mode: Mode | null
  starts_at: string | null
  ends_at: string | null
  max_participants: number | null
  target_roles: CampusRole[] | null
  target_department_id: string | null
  status: TaskStatus
  proof_url: string | null
  created_at: string
  updated_at: string
  category?: Category | null
  poster?: Pick<Profile, 'id' | 'full_name' | 'campus_role' | 'avg_rating' | 'avatar_url' | 'completed_count' | 'college_email'> | null
  worker?: Pick<Profile, 'id' | 'full_name' | 'campus_role' | 'avg_rating' | 'avatar_url' | 'completed_count'> | null
  department?: Department | null
}

export type Application = {
  id: string
  task_id: string
  applicant_id: string
  message: string | null
  status: ApplicationStatus
  created_at: string
  applicant?: Pick<Profile, 'id' | 'full_name' | 'campus_role' | 'avg_rating' | 'headline'> | null
  task?: Pick<Task, 'id' | 'title' | 'status' | 'listing_type' | 'poster_id'> | null
}

export type Review = {
  id: string
  task_id: string
  reviewer_id: string
  reviewee_id: string
  stars: number
  comment: string | null
  created_at: string
  reviewer?: Pick<Profile, 'id' | 'full_name'> | null
}

export type Dispute = {
  id: string
  task_id: string
  raised_by: string
  reason: string
  status: 'open' | 'resolved'
  resolution: string | null
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
  task?: Pick<Task, 'id' | 'title' | 'status'> | null
  raiser?: Pick<Profile, 'id' | 'full_name'> | null
}

export type Message = {
  id: string
  task_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

export type Notification = {
  id: string
  user_id: string
  type: string
  payload: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'full_name'
    | 'bio'
    | 'headline'
    | 'avatar_url'
    | 'skill_tags'
    | 'linkedin_url'
    | 'portfolio_url'
    | 'is_open_to_work'
    | 'experience_level'
    | 'program'
    | 'year_of_study'
    | 'designation'
    | 'roll_or_employee_id'
    | 'department_id'
    | 'onboarding_completed'
  >
>

export type TaskInsert = {
  title: string
  description: string
  category_id: string
  difficulty: Difficulty
  listing_type: ListingType
  budget?: number
  deadline?: string | null
  venue?: string | null
  mode?: Mode | null
  starts_at?: string | null
  ends_at?: string | null
  max_participants?: number | null
  target_roles?: CampusRole[] | null
  target_department_id?: string | null
}
