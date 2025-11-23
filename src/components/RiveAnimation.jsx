import React from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

export default function RiveAnimation({
    src = "https://cdn.rive.app/animations/vehicles.riv",
    stateMachines = "bumpy",
    className = ""
}) {
    const { RiveComponent } = useRive({
        src: src,
        stateMachines: stateMachines,
        layout: new Layout({
            fit: Fit.Cover,
            alignment: Alignment.Center,
        }),
        autoplay: true,
    });

    return (
        <div className={`w-full h-full ${className}`}>
            <RiveComponent />
        </div>
    );
}
