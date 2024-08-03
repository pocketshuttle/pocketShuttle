// components/LottieAnimation.js
import React from 'react';
import Lottie from 'react-lottie';
// import animationData from '../path-to-your-animation-file.json';

const LottieAnimation = ({ isHovering, animationData }) => {
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
