import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Radio, ArrowRight, Shield } from "lucide-react";
import Button from "../ui/Button";

const Footer = () => {
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        const randomRoomId = Math.random().toString(36).substring(2, 8);
        navigate(`/room/${randomRoomId}`);
    };

    return (
        <footer className="bg-neutral-50 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
               
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-4xl bg-bay-950 p-8 sm:p-14 lg:p-16 text-white shadow-xl"
                >
                    <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -15 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="inline-flex items-center gap-2 rounded-full bg-bay-900/80 px-3.5 py-1 text-xs font-semibold text-bay-200 border border-bay-800"
                            >
                                <Shield className="h-3.5 w-3.5 text-bay-400" />
                                <span>100% Peer-to-Peer</span>
                            </motion.div>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                                Ready to transfer files privately?
                            </h2>
                            <p className="mt-4 text-base text-bay-200 sm:text-lg">
                                No registration, no app store downloads. Instant
                                P2P file and text sharing right from your
                                browser.
                            </p>
                        </div>

                        <div className="flex lg:justify-end">
                            <Button
                                size="lg"
                                onClick={handleCreateRoom}
                                className="group flex items-center gap-2 bg-bay-500 font-semibold text-white hover:bg-bay-400 shadow-lg shadow-bay-500/20 transition-all duration-300 hover:scale-105"
                            >
                                <span>Start Transfer Now</span>
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>

                     
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.2, 0.3, 0.2]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 8,
                            ease: "easeInOut"
                        }}
                        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-bay-600/20 blur-3xl pointer-events-none"
                    />
                </motion.div>

                
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-neutral-200/80 pt-8 sm:flex-row"
                >
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bay-900 text-white transition-transform duration-300 group-hover:scale-105">
                            <Radio className="h-4 w-4 text-bay-300" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-neutral-900">
                            Air<span className="text-bay-600">Clip</span>
                        </span>
                    </Link>

                    <p className="text-xs text-neutral-500">
                        &copy; {new Date().getFullYear()} AirClip. Encrypted
                        peer-to-peer clip & file transfers.
                    </p>

                    <div className="flex gap-6 text-xs text-neutral-500">
                        <a
                            href="#features"
                            className="hover:text-bay-900 transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="hover:text-bay-900 transition-colors"
                        >
                            How it works
                        </a>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
