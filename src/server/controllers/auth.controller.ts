import { google, lucia } from "@libs/auth";
import { prisma } from '@utils/db'
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { CustomError } from "@utils/error";

export const createAuthUrl = () => {
  try {
    const codeVerifier = generateCodeVerifier();
    const state = generateState();
    const scope = ['email', 'profile']
    cookies().set("codeVerifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    cookies().set("state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    const authUrl = google.createAuthorizationURL(state, codeVerifier, scope, process.env.HOSTED_DOMAIN);
    return { success: true, url: authUrl.toString()}
    
  } catch (err) {
    return { success: false, error: err }
  }
}

export const getGoogleUser = async (req: Request) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const hd = url.searchParams.get('hd')

    if(!code || !state || !hd) {
      console.error('Not found code, state or hd')
      return new Response('Invalid request', { status: 400 })
    }

    const codeVerifier = cookies().get('codeVerifier')?.value
    const savedState = cookies().get('state')?.value

    if(!codeVerifier || !savedState) {
      throw new CustomError('CodeVerifier or State not found', 400)
    }

    if(state !== savedState) {
      throw new CustomError('State mismatch', 400)
    }

    const tokens = await google.validateAuthorizationCode(code, codeVerifier)
    const accessToken = tokens.accessToken()
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    const googleData = (await googleResponse.json()) as {
      id: string,
      email: string,
      name: string,
      picture: string
    }

    let userId: string
    
    const existingUser = await prisma.user.findUnique({
      where: { email: googleData.email }
    })
    if(existingUser) {
      userId = existingUser.id
    } else {
      const studentId = googleData.email.slice(2, googleData.email.indexOf('@'))
      const user = await prisma.user.create({
        data: {
          studentId: studentId,
          email: googleData.email,
          name: googleData.name,
          picture: googleData.picture,
        }
      })
      userId = user.id
    }
    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

    return new Response('Login success', { status: 200 })

  } catch (error) {
    throw new CustomError('Internal Server Error', 500)
  }
}

export const Logout = async () => {  
  const sessionCookie = lucia.createBlankSessionCookie()
  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  return { success: true, message: 'Logout success' }
}
