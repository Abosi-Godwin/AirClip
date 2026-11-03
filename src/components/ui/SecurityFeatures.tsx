import { ShieldCheck, Zap, Lock, QrCode, HardDriveDownload, EyeOff } from "lucide-react";

const features = [
    {
        icon: ShieldCheck,
        title: "Peer-to-Peer Encryption",
        description: "Data flows directly between your browsers using WebRTC DTLS/SRTP encryption. Nothing touches a central server.",
    },
    {
        icon: EyeOff,
        title: "Zero Data Logging",
        description: "No accounts, emails, or personal tracking. Once your room closes, the connection state vanishes completely.",
    },
    {
        icon: Zap,
        title: "Blazing Fast Speed",
        description: "Transfer speeds are limited only by your local network or internet bandwidth, bypassing slow cloud upload queues.",
    },
    {
        icon: HardDriveDownload,
        title: "Unlimited File Sizes",
        description: "Send large video files, code archives, or raw imagery without arbitrary file size caps or compression.",
    },
    {
        icon: QrCode,
        title: "Instant QR Pairing",
        description: "Scan the room QR code with your mobile camera to instantly connect desktop and phone in seconds.",
    },
    {
        icon: Lock,
        title: "Ephemeral Rooms",
        description: "Rooms naturally terminate when all peers disconnect, ensuring your transfer session leaves no lingering footprint.",
    },
];

const SecurityFeatures = () => {
    return (
        <section id="features" className="bg-neutral-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="mx-auto max-w-7xl">
                
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-bay-600">
                        Privacy First Architecture
                    </p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                        Built for speed. Designed for privacy.
                    </h2>
                    <p className="mt-4 text-base text-neutral-600 sm:text-lg">
                        AirClip cuts out middleman servers completely, giving you direct device-to-device transfers with zero compromises.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => {
                        const IconComponent = feature.icon;
                        return (
                            <div
                                key={idx}
                                className="group relative flex flex-col justify-between rounded-3xl bg-white p-8 border border-neutral-200/80 shadow-sm transition-all duration-300 hover:border-bay-300 hover:shadow-md hover:-translate-y-1"
                            >
                                <div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bay-50 text-bay-700 transition-colors group-hover:bg-bay-900 group-hover:text-white">
                                        <IconComponent className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 text-xl font-bold text-neutral-900">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default SecurityFeatures;
