import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../utils/AppError.js'

type Schemas = {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body)
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params
      next()
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const issues = (err as { issues: Array<{ path: (string | number)[]; message: string }> })
          .issues
        const fields: Record<string, string[]> = {}
        for (const issue of issues) {
          const key = issue.path.join('.') || '_root'
          fields[key] = fields[key] ?? []
          fields[key].push(issue.message)
        }
        return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request', fields))
      }
      next(err)
    }
  }
}
