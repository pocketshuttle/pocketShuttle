import { useRef } from "react"

export const FooterPlayer = ({ playerLink }: { playerLink: string }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play()
        }
    }

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0 // reset video to start
        }
    }
    return (
        <div>
            <div className='bg-black'>
                <video
                    ref={videoRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    width={45}
                    height={45}
                    muted
                    loop
                    className='rounded-full bg-black'
                    style={{ display: 'block' }}
                >
                    <source src={playerLink} type="video/mp4" />
                    Your browser does not support the video tag.

                </video>
            </div>
        </div>
    )
}
