import { Elysia, t } from 'elysia'
import swagger from '@elysiajs/swagger'
import { authRouter } from '@modules/auth/auth.route'
import { clubRouter } from '@modules/clubs/clubs.route'
import { organizationRouter } from '@modules/organizations/organizations.route'
import { programRouter } from '@modules/programs/programs.route'
import { giftedRouter } from '@modules/gifted/gifted.route'
import { rolesRouter } from '@modules/roles/roles.route'
import { GlobalGuard } from '@middlewares/globalguard'


export const elysiaApp = new Elysia({ prefix: '/api' })
    .use(swagger)
    .use(GlobalGuard)
    .use(authRouter)
    .use(clubRouter)
    .use(organizationRouter)
    .use(programRouter)
    .use(giftedRouter)
    .use(rolesRouter)

export type TElysiaApp = typeof elysiaApp
