"use client"
import { useState, useRef } from "react";
import {
    KnockProvider,
    KnockFeedProvider,
    NotificationIconButton,
    NotificationFeedPopover,
} from "@knocklabs/react";

// Required CSS import, unless you're overriding the styling
import "@knocklabs/react/dist/index.css";
import { useSession } from "@/hooks/useSession";


const NotificationFeed = () => {
    const [isVisible, setIsVisible] = useState(false);
    const notifButtonRef = useRef(null);

    const session = useSession()
    const userId = session?.id

    if (!userId) return

    return (
        <KnockProvider
            apiKey={String(process.env.NEXT_PUBLIC_KNOCK_API_KEY)}
            userId={userId}
        >
            <KnockFeedProvider feedId={String(process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID)}>
                <>
                    <NotificationIconButton
                        ref={notifButtonRef}
                        onClick={(e) => setIsVisible(!isVisible)}
                    />
                    <NotificationFeedPopover
                        buttonRef={notifButtonRef}
                        isVisible={isVisible}
                        onClose={() => setIsVisible(false)}
                    />
                </>
            </KnockFeedProvider>
        </KnockProvider>
    );
};

export default NotificationFeed