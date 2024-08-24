import { MagicBell, FloatingNotificationInbox } from '@magicbell/magicbell-react';

function MagicNotification() {
    return (
        <div>
            <MagicBell apiKey="b5ad8d7c5bbc6dccaceade3a242d4bc35c4dc665" userEmail="jane1@gmail.com" userKey="cm03w3ho80000uz7mwzr77kuk">
                {(props) => <FloatingNotificationInbox {...props} />}
            </MagicBell>
        </div >
    );
}
