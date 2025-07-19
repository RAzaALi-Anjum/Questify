"use client";

export function InteractiveBackground() {
    return (
        <div
            className="fixed inset-0 -z-10 w-full h-full"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        />
    );
}
