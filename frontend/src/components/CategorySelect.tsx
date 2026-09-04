import { type SelectHTMLAttributes } from 'react'
import { Select } from './ui/Select'
import type { Category } from '../types/database'

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  categories: Category[]
  placeholder?: string
}

export function CategorySelect({ categories, placeholder = 'All categories', ...props }: Props) {
  const technical = categories.filter((c) => c.kind === 'technical')
  const nonTechnical = categories.filter((c) => c.kind === 'non_technical')

  return (
    <Select {...props}>
      <option value="">{placeholder}</option>
      {technical.length > 0 && (
        <optgroup label="Technical">
          {technical.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}
      {nonTechnical.length > 0 && (
        <optgroup label="Non-technical">
          {nonTechnical.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}
      {technical.length === 0 &&
        nonTechnical.length === 0 &&
        categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
    </Select>
  )
}
