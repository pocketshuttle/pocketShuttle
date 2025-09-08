"use client"
import Image, { StaticImageData } from 'next/image'
import React, { ChangeEvent, Dispatch, SetStateAction, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import LottieAnimation from '../dashboard/sidebar/menuLink/lottie-animation'
import upload from "@/public/images/upload.json"
type ImageProps = {
    newAvatar: string,
    avatar: StaticImageData,
    form: UseFormReturn,
    setNewAvatar: Dispatch<SetStateAction<string>>,
}

export const UploadImage = ({ newAvatar, avatar, form, setNewAvatar }: ImageProps) => {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [isHovering, setIsHovering] = useState(false);

    const handleCameraClick = () => {
        const inputElement = document.getElementById("cameraInput")
        inputElement?.click()
    }

    const handleCameraInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (files && files.length > 0) {
            const file = files[0];

            if (file) {
                const reader = new FileReader();
                reader.onload = async () => {
                    await uploadFile(file);
                };
                reader.readAsDataURL(file);
            } else {
                console.error('No file selected.');
            }
        } else {
            console.error('No files in event.');
        }
    };

    const uploadFile = async (file: any) => {
        setIsLoading(true)
        try {
            const data = new FormData()
            data.append('file', file)
            // data.append("upload_preset", 'images')

            const res = await fetch(`/api/upload`, {
                method: 'POST',
                body: data,
            })

            if (res.ok) {
                const data = await res.json()
                form.setValue("image", data.url)
                setNewAvatar(data.url)
            }
        }
        catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div >
            <input
                id="cameraInput"
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleCameraInputChange}
            />
            <div className="w-[300px] h-[300px] relative">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <LottieAnimation isHovering={true} animationData={upload} />
                    </div>
                ) : (
                    <Image
                        src={newAvatar || avatar}
                        alt="avatar"
                        fill
                        className="cursor-pointer rounded-md object-cover" // or object-contain / object-fill
                        onClick={() => handleCameraClick()}
                    />
                )}
            </div>
        </div>
    )
}
