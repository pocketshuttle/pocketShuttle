import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface FormErrorProps {
    message?: string;
}

const SUPPORT_EMAIL = "support@pocketshuttle.com";

function renderMessage(message: string) {
    const parts = message.split(/(contact support)/i);
    if (parts.length === 1) {
        return message;
    }

    return parts.map((part, index) =>
        /^contact support$/i.test(part) ? (
            <a key={index} href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:no-underline">
                {part}
            </a>
        ) : (
            <span key={index}>{part}</span>
        )
    );
}

export const FormError = ({ message }: FormErrorProps) => {
    if (!message) {
        return null
    }

    return (
        <div className="bg-destructive/15 rounded-md p-3 flex items-center gap-x-2 text-sm text-destructive ">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <p>{renderMessage(message)}</p>
        </div>
    )

}