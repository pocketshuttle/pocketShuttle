import LoginButton from '@/components/auth/login-button'
import ParentViewData from '@/components/parent-view/parentdata'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import React from 'react'

const TeacherView = async () => {
    const user = await getUserSession()
    // If no user session, redirect to login
    if (!user || typeof user.id !== 'string') {
        return (
            <div className="flex items-center justify-center">
                <div>
                    User session is not available. Please log in.
                    <LoginButton>
                        <Button size={"lg"}>Login</Button>
                    </LoginButton>
                </div>
            </div>
        )
    }

    return (
        <div>
            <ParentViewData userId={user?.id} user={user} />
        </div>
    )
}



export default TeacherView