import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Copy, Plus, Menu, X, Shield, Radio } from "lucide-react";
import Button from "../ui/Button";

interface NavbarProps {
    activeRoomId?: string;
}

export const Navbar = ({ activeRoomId }: NavbarProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    const handleCreateNewRoom = () => {
        const randomRoomId = Math.random().toString(36).substring(2, 8);
        navigate(`/room/${randomRoomId}`);
        setMobileMenuOpen(false);
    };

    const handleCopyRoomLink = () => {
        if (!activeRoomId) return;
        const roomUrl = `${window.location.origin}/room/${activeRoomId}`;
        navigator.clipboard.writeText(roomUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bay-900 text-white shadow-sm transition-transform group-hover:scale-105">
                            <Radio className="h-5 w-5 text-bay-300 animate-pulse" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-neutral-900">
                            Air<span className="text-bay-600">Clip</span>
                        </span>
                    </Link>

                    {/* Desktop Center/Right Nav Items */}
                    <div className="hidden items-center gap-6 md:flex">
                        
                        {/* Active Room Indicator (Shows when inside a room session) */}
                        {activeRoomId ? (
                            <div className="flex items-center gap-2 rounded-full border border-bay-200 bg-bay-50/80 px-3 py-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                </span>
                                <span className="font-mono text-xs font-medium text-bay-900 uppercase tracking-wider">
                                    Room: {activeRoomId}
                                </span>
                                <button
                                    onClick={handleCopyRoomLink}
                                    className="ml-1 rounded p-1 text-bay-700 hover:bg-bay-100 hover:text-bay-900 transition-colors"
                                    title="Copy Room Link"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                                {copied && <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>}
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 text-sm font-medium text-neutral-600">
                                <a href="#features" className="hover:text-bay-900 transition-colors">
                                    Features
                                </a>
                                <a href="#security" className="hover:text-bay-900 transition-colors">
                                    Security
                                </a>
                                <a href="#how-it-works" className="hover:text-bay-900 transition-colors">
                                    How It Works
                                </a>
                            </div>
                        )}

                        {/* CTA Action */}
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleCreateNewRoom}
                            className="flex items-center gap-1.5 font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Transfer</span>
                        </Button>
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer Menu */}
            {mobileMenuOpen && (
                <div className="border-b border-neutral-200 bg-white px-4 pb-6 pt-4 md:hidden">
                    <div className="flex flex-col gap-4">
                        {activeRoomId && (
                            <div className="flex items-center justify-between rounded-lg border border-bay-200 bg-bay-50 p-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    <span className="font-mono text-xs font-semibold uppercase text-bay-900">
                                        Room: {activeRoomId}
                                    </span>
                                </div>
                                <Button size="sm" variant="outline" onClick={handleCopyRoomLink}>
                                    {copied ? "Copied" : "Copy Link"}
                                </Button>
                            </div>
                        )}

                        <a
                            href="#features"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-medium text-neutral-700 hover:text-bay-900"
                        >
                            Features
                        </a>
                        <a
                            href="#security"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-medium text-neutral-700 hover:text-bay-900"
                        >
                            Security
                        </a>
                        <a
                            href="#how-it-works"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-medium text-neutral-700 hover:text-bay-900"
                        >
                            How It Works
                        </a>

                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleCreateNewRoom}
                            className="mt-2 w-full justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Transfer</span>
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
};
