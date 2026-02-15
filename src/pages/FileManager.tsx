import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cloudinaryService, CLOUDINARY_FOLDERS } from "@/lib/cloudinaryService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Upload,
    Trash2,
    Download,
    ArrowLeft,
    Loader2,
    FileIcon,
    ImageIcon,
    VideoIcon,
    Eye,
    Copy,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Session } from "@supabase/supabase-js";

interface CloudinaryFile {
    id: string;
    url: string;
    public_id: string;
    folder: string | null;
    created_at: string;
}

const FOLDER_OPTIONS = [
    { value: CLOUDINARY_FOLDERS.SERVICES, label: "Service Images" },
    { value: CLOUDINARY_FOLDERS.GALLERY, label: "Gallery Images" },
    { value: CLOUDINARY_FOLDERS.BEFORE_AFTER, label: "Before & After Images" },
];

const FileManager = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState<CloudinaryFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<string>("");
    const [previewName, setPreviewName] = useState<string>("");
    const [selectedFolder, setSelectedFolder] = useState<string>("service_images");
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [pendingFilesArray, setPendingFilesArray] = useState<File[]>([]);

    const checkAdminRole = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "admin")
                .maybeSingle();

            if (error) {
                console.error("Error checking admin role:", error);
                setIsAdmin(false);
                return;
            }

            setIsAdmin(!!data);
            if (!data) {
                toast.error("Access denied. Admin privileges required.");
                setTimeout(() => navigate("/"), 1000);
            }
        } catch (error) {
            console.error("Error checking admin role:", error);
            setIsAdmin(false);
        } finally {
            setCheckingAuth(false);
        }
    }, [navigate]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                if (!session) {
                    setTimeout(() => navigate("/auth"), 0);
                } else {
                    setTimeout(() => checkAdminRole(session.user.id), 0);
                }
            }
        );

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) {
                navigate("/auth");
            } else {
                checkAdminRole(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, checkAdminRole]);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            console.debug("Fetching all files via cloudinaryService");
            const allFiles = await cloudinaryService.fetchAllFiles();
            console.debug(`Fetched ${allFiles.length} files from database`);
            setFiles(allFiles);
        } catch (error) {
            console.error("Error fetching files:", error);
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin && session) {
            fetchFiles();
        }
    }, [isAdmin, session, fetchFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;
        // Copy files to array before clearing input (FileList is a live reference)
        setPendingFilesArray(Array.from(selectedFiles));
        setShowFolderDialog(true);
        e.target.value = "";
    };

    const handleUploadConfirm = async () => {
        if (pendingFilesArray.length === 0) return;
        setShowFolderDialog(false);
        setUploading(true);
        try {
            for (const file of pendingFilesArray) {
                await cloudinaryService.uploadImage(file, selectedFolder);
            }

            toast.success(`${pendingFilesArray.length} file(s) uploaded to ${FOLDER_OPTIONS.find(f => f.value === selectedFolder)?.label}`);
            fetchFiles();
        } catch (error: unknown) {
            console.error("Upload error:", error);
            const message = error instanceof Error ? error.message : "Failed to upload file(s)";
            toast.error(message);
        } finally {
            setUploading(false);
            setPendingFilesArray([]);
        }
    };

    const handleDelete = async (file: CloudinaryFile) => {
        if (!confirm(`Delete "${file.public_id}"?`)) return;

        // Ensure we still have a session before calling the protected function
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
            toast.error("Session expired — please sign in again.");
            setTimeout(() => navigate("/auth"), 700);
            return;
        }

        try {
            await cloudinaryService.deleteImage(file.public_id);
            toast.success("File deleted successfully");
            fetchFiles();
        } catch (error: unknown) {
            console.error("Delete error:", error);
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes("Unauthorized")) {
                toast.error("Unauthorized — please sign in again.");
                setTimeout(() => navigate("/auth"), 700);
                return;
            }
            toast.error(message || "Failed to delete file");
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("URL copied to clipboard");
    };

    const handlePreview = (file: CloudinaryFile) => {
        setPreviewUrl(file.url);
        setPreviewType("image"); // Assume image for now
        setPreviewName(file.public_id);
    };

    const getFileIcon = (file: CloudinaryFile) => {
        // Since we don't have resource_type, use a generic icon
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
    };



    if (checkingAuth || !session) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </>
        );
    }

    if (!isAdmin) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Card className="p-8 text-center">
                        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground">Admin privileges required.</p>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold">File Manager</h1>
                                <p className="text-muted-foreground text-sm">
                                    Upload to Cloudinary • CDN-optimized images & videos
                                </p>
                            </div>
                        </div>

                        <div>
                            <Input
                                id="file-upload"
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                onClick={() => document.getElementById("file-upload")?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                {uploading ? "Uploading..." : "Upload Files"}
                            </Button>
                        </div>
                    </div>

                    {/* File List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : files.length === 0 ? (
                        <Card className="p-12 text-center">
                            <FileIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No files yet. Upload your first file to Cloudinary.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {files.map((file) => (
                                <Card key={file.id} className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {getFileIcon(file)}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {file.public_id}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {file.folder && <span className="text-primary">{FOLDER_OPTIONS.find(f => f.value === file.folder)?.label || file.folder}</span>}
                                                {file.folder && " • "}
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePreview(file)}
                                            title="Preview"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopyUrl(file.url)}
                                            title="Copy URL"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => window.open(file.url, "_blank")}
                                            title="Open in new tab"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(file)}
                                            className="text-destructive hover:text-destructive"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{previewName}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
                        {previewUrl && (
                            <img src={previewUrl} alt={previewName} className="max-w-full max-h-[65vh] rounded" />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Folder Selection Dialog */}
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Choose Upload Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Select the folder to upload {pendingFilesArray.length} file(s) to:
                        </p>
                        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select folder" />
                            </SelectTrigger>
                            <SelectContent>
                                {FOLDER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => { setShowFolderDialog(false); setPendingFilesArray([]); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleUploadConfirm}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FileManager;