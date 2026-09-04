-- Seed departments + categories

insert into public.departments (code, name) values
  ('CSED', 'Computer Science & Engineering'),
  ('ECED', 'Electronics & Communication Engineering'),
  ('EIED', 'Electrical & Instrumentation Engineering'),
  ('MED', 'Mechanical Engineering'),
  ('CED', 'Civil Engineering'),
  ('CHED', 'Chemical Engineering'),
  ('BTD', 'Biotechnology'),
  ('SOM', 'School of Management'),
  ('SHSS', 'School of Humanities & Social Sciences'),
  ('PHYS', 'Physics & Materials Science'),
  ('MATH', 'Mathematics'),
  ('CHEM', 'Chemistry')
on conflict (code) do nothing;

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
  ('Non-Technical (Other)', 'non_technical')
on conflict (name) do nothing;
