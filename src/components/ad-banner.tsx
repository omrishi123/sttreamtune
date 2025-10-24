
'use client';

import React, { useEffect } from 'react';

declare global {
    interface Window {
        adsbygoogle?: any[];
    }
}

interface AdBannerProps {
    className?: string;
    style?: React.CSSProperties;
    slot: string;
    format?: string;
    responsive?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
    className,
    style,
    slot,
    format = 'auto',
    responsive = 'true'
}) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error(err);
        }
    }, []);

    return (
        <div className={className} style={{ ...style, display: 'block', minWidth: '250px' }}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-7816262732112838"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            ></ins>
        </div>
    );
};
