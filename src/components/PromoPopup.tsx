import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PromoPopup = () => {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [claimed, setClaimed] = useState(false);

    useEffect(() => {
        // Check if user has already seen or claimed the promo
        const hasSeen = localStorage.getItem("promo_seen");
        const hasClaimed = localStorage.getItem("promo_claimed");

        // Show popup after 3 seconds if not seen/claimed
        if (!hasSeen && !hasClaimed) {
            const timer = setTimeout(() => {
                setOpen(true);
                localStorage.setItem("promo_seen", "true");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            // Sign up/Login with OTP
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });

            if (error) throw error;

            setClaimed(true);
            localStorage.setItem("promo_claimed", "true");
            toast.success("Promo code sent to your email!");
        } catch (error: any) {
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (claimed) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/10 to-background border-2 border-primary/20">
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Gift className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-700">Code Sent!</h2>
                        <p className="text-muted-foreground">
                            We've sent a magic link and your promo code to <strong>{email}</strong>.
                            <br />
                            Please check your inbox to verify and claim your discount.
                        </p>
                        <Button onClick={() => setOpen(false)} className="w-full">
                            Got it, thanks!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden gap-0 bg-background border-0 shadow-2xl">
                <div className="grid md:grid-cols-2">
                    {/* Image Side */}
                    <div className="relative hidden md:block h-full min-h-[400px]">
                        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
                        <img
                            src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80"
                            alt="Kitchen Design"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-black/30">
                            <h3 className="text-3xl font-bold mb-2">Dream Kitchens</h3>
                            <p className="text-lg opacity-90">Start your journey today</p>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="relative p-6 sm:p-10 flex flex-col justify-center bg-white dark:bg-zinc-900">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors opacity-70 hover:opacity-100"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-6 text-center md:text-left">
                            <div className="space-y-2">
                                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide uppercase">
                                    Limited Time Offer
                                </span>
                                <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                                    $150 OFF
                                </h2>
                                <p className="text-muted-foreground text-lg">
                                    Love to save? Sign up now and receive a promo code for $150 OFF your first design order.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 text-lg"
                                    />
                                    <p className="text-xs text-muted-foreground text-center md:text-left">
                                        *Valid for orders above $3,500. Cannot be combined.
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full h-12 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Get My Code!"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
