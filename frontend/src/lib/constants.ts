export const CAMPUS_ROLES = [
  'ug_student',
  'mtech',
  'phd',
  'faculty',
  'staff',
  'department',
] as const

export type CampusRole = (typeof CAMPUS_ROLES)[number]

export const CAMPUS_ROLE_LABELS: Record<CampusRole, string> = {
  ug_student: 'UG Student',
  mtech: 'M.Tech',
  phd: 'PhD',
  faculty: 'Faculty',
  staff: 'Staff',
  department: 'Department / Club',
}

export const LISTING_TYPES = ['gig', 'workshop', 'project', 'mentorship'] as const

export type ListingType = (typeof LISTING_TYPES)[number]

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  gig: 'Gig',
  workshop: 'Workshop',
  project: 'Project',
  mentorship: 'Mentorship',
}

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const TASK_STATUSES = [
  'open',
  'assigned',
  'submitted',
  'completed',
  'disputed',
  'cancelled',
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  submitted: 'Submitted',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
}

export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const MODES = ['in_person', 'online', 'hybrid'] as const

export type Mode = (typeof MODES)[number]

export const MODE_LABELS: Record<Mode, string> = {
  in_person: 'In person',
  online: 'Online',
  hybrid: 'Hybrid',
}

export const WORKSHOP_HOST_ROLES: CampusRole[] = ['faculty', 'department', 'phd']

export const PAGE_SIZE = 12
