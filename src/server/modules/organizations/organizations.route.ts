import { Elysia, t, error } from 'elysia'
import { AllData } from '@libs/data'

import {
  UnionField,
  StringField,
}
  from '@utils/validate'

import { getUser, getOrganization } from '@middlewares/derive'

import {
  getOrganizationByName,
  updateOrganizationData,
  getReviews,
  createReview,
  updateReview,
  deleteReview
}
  from '@modules/organizations/organizations.controller'

import { prisma } from '@utils/db'

export const organizationRouter = new Elysia({ prefix: '/organizations' })
  .guard({
    async beforeHandle() {
      const userData = (await getUser()).data
      const organization = await prisma.organizations.findUnique({
        where: { email: userData?.email },
        select: { name: true }
      })
      const name = organization?.name
      if (!name) return error(404, 'Organization Not Found')
      if (typeof name !== 'string') return error(400, 'Invalid Organization Name')
      const organizationData = (await getOrganization(name)).data
      if (!userData?.TUCMC && (userData?.email !== organizationData.email)) return error(401, 'Unauthorized')
    }
  })
  .get('/:name', async ({ params: { name } }) => {
    return await getOrganizationByName(name)
  },
    {
      params: t.Object({
        name: UnionField(true, 'Invalid Organization Name', Object.keys(AllData.Organizations))
      })
    })
  .patch('/:name', async ({ params: { name }, body }) => {
    return await updateOrganizationData(name, body)
  },
    {
      params: t.Object({
        name: UnionField(true, 'Invalid Organization Name', Object.keys(AllData.Organizations))
      }),
      body: t.Object({
        name: t.String(),
        thainame: t.String(),
        members: t.String(),
        ig: t.String(),
        fb: t.String(),
        others: t.String(),
        activities: t.String(),
        position: t.String(),
        working: t.String(),
        captureimg1: t.File(),
        descimg1: t.String(),
        captureimg2: t.File(),
        descimg2: t.String(),
        captureimg3: t.File(),
        descimg3: t.String()
      }),
    })
  .get('/:name/review', async ({ params: { name } }) => {
    return await getReviews(name)
  }, {
    params: t.Object({
      name: UnionField(true, 'Invalid Organization Name', Object.keys(AllData.Organizations))
    })
  })
  .post('/:name/review', async ({ params: { name }, set }) => {
    const response = await createReview(name)
    if (response?.success) {
      set.status = 201
      return response
    }
  }, {
    params: t.Object({
      name: UnionField(true, 'Invalid Organization Name', Object.keys(AllData.Organizations))
    })
  })
  .patch('/:name/review/:id', async ({ params: { name, id }, body }) => {
    return await updateReview(name, id, body)
  }, {
    params: t.Object({
      name: UnionField(true, 'Invalid Organization Name', Object.keys(AllData.Organizations)),
      id: StringField(true, 'Invalid Review ID')
    }),
    body: t.Object({
      profile: t.File(),
      name: t.String(),
      nick: t.String(),
      gen: t.String(),
      contact: t.String(),
      content: t.String(),
    })
  })
  .delete('/:name/review/:id', async ({ params: { name, id } }) => {
    return await deleteReview(name, id)
  },
    {
      params: t.Object({
        name: UnionField(true, 'Invalid Organization Name', Object.keys(AllData.Organizations)),
        id: StringField(true, 'Invalid Review ID')
      })
    })
