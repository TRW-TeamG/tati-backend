import { ExecutionContext, createParamDecorator } from '@nestjs/common'

import { User } from '../db'

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest()
  return request.user as User
})
