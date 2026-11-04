import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, QrCode, ShieldCheck } from "lucide-react";
import Button from "./Button";
import { Input } from "./Input";
 
const ROOM_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const ROOM_CODE_LENGTH = 6;

const createRoomId = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
    return Array.from(
        bytes,
        byte => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]
    ).join("");
};

const sanitizeCode = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, ROOM_CODE_LENGTH);

const Hero = () => {
    const [joinCode, setJoinCode] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        navigate(`/room/${createRoomId()}`);
    };

    const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!joinCode) {
            inputRef.current?.focus();
            return;
        }
        navigate(`/room/${joinCode}`);
    };

    return (
        <section className="relative isolate overflow-hidden bg-neutral-50 py-12 sm:py-20 lg:py-24">
            <img
                src="/hero-bg.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full select-none object-cover object-right md:block"
            />
            <img
                src="/hero-bg-mobile.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover object-center md:hidden"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-linear-to-t from-neutral-50 to-transparent md:h-[10%]"
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8 lg:gap-12">
                    {/* Left Column: Text & Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex min-w-0 flex-col gap-6 text-left"
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.1,
                                ease: "easeOut"
                            }}
                            className="text-4xl font-bold leading-[1.1] text-neutral-900 sm:text-5xl md:text-[2.75rem] lg:text-5xl xl:text-6xl"
                        >
                            Send files & text instantly between any devices.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.2,
                                ease: "easeOut"
                            }}
                            className="text-lg text-neutral-600 sm:text-xl"
                        >
                            No accounts, no cloud storage, zero privacy
                            tracking. Just open a room and start transferring
                            directly{" "}
                            <span className="whitespace-nowrap">
                                browser-to-browser
                            </span>
                            .
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.3,
                                ease: "easeOut"
                            }}
                            className="mt-2 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center"
                        >
                            <Button
                                type="button"
                                variant="primary"
                                size="lg"
                                onClick={handleCreateRoom}
                                className="gap-2 group transition-all duration-300 hover:scale-[1.02]"
                            >
                                <span>Create Transfer Room</span>
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Button>

                            <form
                                onSubmit={handleJoinRoom}
                                className="flex w-full items-center gap-2 sm:w-auto"
                            >
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Room code"
                                    aria-label="Room code"
                                    value={joinCode}
                                    onChange={e =>
                                        setJoinCode(
                                            sanitizeCode(e.target.value)
                                        )
                                    }
                                    maxLength={ROOM_CODE_LENGTH}
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    wrapperClassName="min-w-0 flex-1 sm:w-40 sm:flex-none"
                                    className="h-12 text-center font-mono uppercase tracking-widest"
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="lg"
                                    className="shrink-0 transition-all duration-300 hover:border-bay-500 hover:bg-bay-50/50"
                                >
                                    Join
                                </Button>
                            </form>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.4,
                                ease: "easeOut"
                            }}
                            className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500"
                        >
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck
                                    className="h-4 w-4 text-emerald-600"
                                    aria-hidden="true"
                                />
                                WebRTC Encrypted
                            </span>
                            <span className="flex items-center gap-1.5">
                                <QrCode
                                    className="h-4 w-4 text-bay-600"
                                    aria-hidden="true"
                                />
                                QR Instant Connect
                            </span>
                        </motion.div>
                    </motion.div>

                    {/* Right Column: Floating Illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.2,
                            ease: "easeOut"
                        }}
                        className="flex items-center justify-center p-4"
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                                repeat: Infinity,
                                duration: 6,
                                ease: "easeInOut"
                            }}
                            className="relative w-full max-w-lg"
                        >
                            <img
                                src="/data-transfer.svg"
                                alt="P2P Data Transfer Illustration"
                                className="h-auto w-full drop-shadow-xl"
                            />
                           
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
