import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryDetailProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    images: string[];
    title: string;
    selectedIndex?: number;
}

export const GalleryDetail = ({ open, onOpenChange, images, title, selectedIndex = 0 }: GalleryDetailProps) => {
    const [activeIndex, setActiveIndex] = useState(selectedIndex);

    // Reset active index when dialog opens with a new selection
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setActiveIndex(selectedIndex);
        }
        onOpenChange(isOpen);
    };

    if (images.length === 0) return null;

    const goNext = () => setActiveIndex((prev) => (prev + 1) % images.length);
    const goPrev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-6xl w-[95vw] p-0 gap-0 bg-background border-border overflow-hidden [&>button]:hidden">
                {/* Close button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
                >
                    <X className="w-5 h-5 text-foreground" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                    {/* Left: Info */}
                    <div className="lg:col-span-2 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                        <p className="text-sm text-accent font-medium uppercase tracking-wider mb-2">Gallery</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{title}</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Browse through our collection of completed projects showcasing quality craftsmanship and attention to detail.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {activeIndex + 1} of {images.length} photos
                        </p>
                    </div>

                    {/* Right: Images */}
                    <div className="lg:col-span-3 flex flex-col">
                        {/* Main Image */}
                        <div className="relative h-[300px] sm:h-[400px] lg:h-[450px] bg-foreground/5">
                            <img
                                src={images[activeIndex]}
                                alt={`${title} - Photo ${activeIndex + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={goPrev}
                                        className="absolute left-3 bottom-4 p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-foreground" />
                                    </button>
                                    <button
                                        onClick={goNext}
                                        className="absolute right-3 bottom-4 p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-foreground" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Row */}
                        {images.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveIndex(idx)}
                                        className={`flex-shrink-0 w-24 h-20 sm:w-32 sm:h-24 rounded-lg overflow-hidden border-2 transition-all duration-200 ${activeIndex === idx
                                            ? "border-accent shadow-md scale-105"
                                            : "border-transparent opacity-70 hover:opacity-100"
                                            }`}
                                    >
                                        <img src={img} alt={`${title} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
