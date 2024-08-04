// components/LottieAnimation.js
import React from 'react';
import Lottie from 'react-lottie';
// import animationData from '../path-to-your-animation-file.json';
type LottieProps = {
    animationData: any;
    isHovering: boolean;
}
const LottieAnimation = ({ isHovering, animationData }: LottieProps) => {
    const defaultOptions = {
        loop: true,
        autoplay: false,
        animationData: animationData && animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return <Lottie options={defaultOptions} isStopped={!isHovering} />;
};

export default LottieAnimation;
