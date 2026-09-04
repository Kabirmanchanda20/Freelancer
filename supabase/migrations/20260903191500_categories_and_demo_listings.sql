-- Campus-relevant categories + demo listings for browse feed

alter table public.categories
  add column if not exists kind text not null default 'non_technical'
  check (kind in ('technical', 'non_technical'));

-- Reset demo task data (keeps users/profiles intact)
delete from public.notifications;
delete from public.reviews;
delete from public.disputes;
delete from public.messages;
delete from public.applications;
delete from public.tasks;

delete from public.user_interests;
delete from public.user_category_stats;
delete from public.categories;

insert into public.categories (name, kind) values
  ('Frontend', 'technical'),
  ('Backend', 'technical'),
  ('GitHub & Open Source', 'technical'),
  ('Machine Learning', 'technical'),
  ('Data Science', 'technical'),
  ('DevOps & Cloud', 'technical'),
  ('Mobile Apps', 'technical'),
  ('Technical (Other)', 'technical'),
  ('Tutoring & Academics', 'non_technical'),
  ('Design & Creative', 'non_technical'),
  ('Content & Writing', 'non_technical'),
  ('Research Help', 'non_technical'),
  ('Lab & Project Support', 'non_technical'),
  ('Campus Errands', 'non_technical'),
  ('Mentorship & Career', 'non_technical'),
  ('Workshops & Events', 'non_technical'),
  ('Non-Technical (Other)', 'non_technical');

-- Demo listings (uses existing faculty/UG profiles from seed runs)
insert into public.tasks (
  poster_id, listing_type, title, description, category_id, difficulty,
  deadline, venue, mode, starts_at, ends_at, max_participants, target_department_id, status
)
select
  p.id,
  v.listing_type,
  v.title,
  v.description,
  c.id,
  v.difficulty,
  v.deadline,
  v.venue,
  v.mode,
  v.starts_at,
  v.ends_at,
  v.max_participants,
  d.id,
  'open'
from (values
  ('fac191038@thapar.edu', 'gig', 'Fix React component re-renders', 'Need help debugging unnecessary re-renders in a React + TypeScript dashboard. Session can be online.', 'Frontend', 'intermediate', now() + interval '5 days', null, null, null, null, null, 'CSED'),
  ('fac191038@thapar.edu', 'gig', 'Express API route review', 'Review REST routes, middleware order, and error handling for a Node.js backend before deployment.', 'Backend', 'intermediate', now() + interval '7 days', null, null, null, null, null, 'CSED'),
  ('fac191038@thapar.edu', 'project', 'Campus hackathon team — GitHub workflow', 'Building a 48-hour hackathon project. Looking for someone comfortable with Git branching, PRs, and README docs.', 'GitHub & Open Source', 'beginner', now() + interval '10 days', 'Innovation Lab', 'hybrid', null, null, null, 'CSED'),
  ('wfac1119@thapar.edu', 'workshop', 'Intro to Machine Learning with Python', 'Hands-on workshop covering NumPy, pandas, and a simple scikit-learn classifier. Bring your laptop.', 'Machine Learning', 'beginner', null, 'Online — Zoom', 'online', now() + interval '3 days', now() + interval '3 days 2 hours', 40, 'CSED'),
  ('wfac1119@thapar.edu', 'workshop', 'Git & GitHub for beginners', 'Learn commits, branches, pull requests, and how to contribute to open source without breaking main.', 'GitHub & Open Source', 'beginner', null, 'Seminar Hall A', 'in_person', now() + interval '5 days', now() + interval '5 days 90 minutes', 60, 'CSED'),
  ('poster20260903190927@thapar.edu', 'mentorship', 'Resume + LinkedIn review for tech internships', '30-minute review of your resume and LinkedIn profile with actionable feedback for SWE internships.', 'Mentorship & Career', 'beginner', now() + interval '14 days', null, 'online', null, null, null, 'SOM'),
  ('poster20260903190927@thapar.edu', 'gig', 'DBMS query optimization tutoring', 'One-on-one tutoring for SQL joins, indexing basics, and query plans ahead of mid-semester exam.', 'Tutoring & Academics', 'intermediate', now() + interval '4 days', 'Library study room', 'in_person', null, null, null, 'CSED'),
  ('dept20260903190927@thapar.edu', 'gig', 'Design fest poster (A3 print-ready)', 'Need a clean poster for department tech fest. Brand colors and logo assets will be shared.', 'Design & Creative', 'beginner', now() + interval '6 days', null, null, null, null, null, 'CSED'),
  ('dept20260903190927@thapar.edu', 'project', 'IoT lab data logger — backend integration', 'Help connect ESP32 sensor readings to a PostgreSQL database via a small Node API.', 'Backend', 'advanced', now() + interval '12 days', 'EIED Lab', 'hybrid', null, null, null, 'EIED'),
  ('fac191038@thapar.edu', 'gig', 'Research paper LaTeX formatting', 'Format a 6-page conference paper in IEEE template. Figures and bibliography included.', 'Research Help', 'intermediate', now() + interval '8 days', null, 'online', null, null, null, 'PHYS'),
  ('wfac1119@thapar.edu', 'gig', 'Flutter UI polish for campus app', 'Improve spacing, typography, and dark mode on an existing Flutter prototype.', 'Mobile Apps', 'intermediate', now() + interval '9 days', null, 'online', null, null, null, 'CSED'),
  ('fac191038@thapar.edu', 'mentorship', 'Breaking into ML research on campus', 'PhD-path mentorship: how to find guides, read papers, and pick a first project topic.', 'Machine Learning', 'advanced', now() + interval '20 days', null, 'online', null, null, null, 'CSED'),
  ('dept20260903190927@thapar.edu', 'gig', 'Event day volunteer coordination', 'Help coordinate volunteers and checklists for a half-day department symposium.', 'Campus Errands', 'beginner', now() + interval '3 days', 'Main auditorium', 'in_person', null, null, null, 'SHSS'),
  ('poster20260903190927@thapar.edu', 'project', 'Dockerize a full-stack capstone project', 'Need help writing Dockerfile + docker-compose for React frontend, Express API, and Postgres.', 'DevOps & Cloud', 'advanced', now() + interval '11 days', null, 'online', null, null, null, 'CSED'),
  ('wfac1119@thapar.edu', 'gig', 'Blog post editing for tech club newsletter', 'Edit and tighten two 800-word articles about campus projects for monthly newsletter.', 'Content & Writing', 'beginner', now() + interval '5 days', null, 'online', null, null, null, 'SHSS'),
  ('fac191038@thapar.edu', 'workshop', 'Data visualization with Python', 'Workshop on matplotlib and seaborn for academic plots. Sample datasets provided.', 'Data Science', 'intermediate', null, 'Lab 204', 'in_person', now() + interval '7 days', now() + interval '7 days 2 hours', 35, 'MATH')
) as v(poster_email, listing_type, title, description, category_name, difficulty, deadline, venue, mode, starts_at, ends_at, max_participants, dept_code)
join public.profiles p on p.college_email = v.poster_email
join public.categories c on c.name = v.category_name
left join public.departments d on d.code = v.dept_code;
