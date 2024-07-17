import Image from 'next/image'
import React, { ChangeEvent } from 'react'

export const UploadImage = ({ newAvatar, avatar, form, setNewAvatar }) => {
    const handleCameraClick = () => {
        const inputElement = document.getElementById("cameraInput")
        inputElement?.click()
        // console.log(inputElement)
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
        }
    }
    return (
        <div className=" w-[25%] items-center  bg-[var(--bgSoft)] h-[14.5rem] p-2 rounded-md" >
            <input
                id="cameraInput"
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleCameraInputChange}
            />
            {/* <Image src={isLoadingImage ? spinner : newAvatar || avatar} alt="avatar" width={100} height={215} className="cursor-pointer rounded-md h-[13.5rem] w-full  object-fill" onClick={() => handleCameraClick()} /> */}

            <Image src={newAvatar || avatar} alt="avatar" width={100} height={215} className="cursor-pointer rounded-md h-[13.5rem] w-full object-fill" onClick={() => handleCameraClick()} />
        </div>
    )
}
