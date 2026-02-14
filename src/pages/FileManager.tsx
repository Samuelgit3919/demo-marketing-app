import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
    format: string | null;
    resource_type: string | null;
    bytes: number;
    width: number | null;
    height: number | null;
    original_name: string | null;
    folder: string | null;
    created_at: string;
}

const FOLDER_OPTIONS = [
    { value: "service_images", label: "Service Images" },
    { value: "Gallery_images", label: "Gallery Images" },
    { value: "before_after_images", label: "Before & After Images" },
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
    }, [navigate]);

    const checkAdminRole = async (userId: string) => {
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
    };

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("cloudinary_files")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setFiles((data as CloudinaryFile[]) || []);
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
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", `admin-uploads/${selectedFolder}`);

                const { data, error } = await supabase.functions.invoke("cloudinary-upload", {
                    body: formData,
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                const { error: dbError } = await supabase.from("cloudinary_files").insert({
                    url: data.url,
                    public_id: data.public_id,
                    format: data.format,
                    resource_type: data.resource_type,
                    bytes: data.bytes,
                    width: data.width,
                    height: data.height,
                    original_name: file.name,
                    uploaded_by: session?.user?.id,
                    folder: selectedFolder,
                });

                if (dbError) throw dbError;
            }

            toast.success(`${pendingFilesArray.length} file(s) uploaded to ${FOLDER_OPTIONS.find(f => f.value === selectedFolder)?.label}`);
            fetchFiles();
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error?.message || "Failed to upload file(s)");
        } finally {
            setUploading(false);
            setPendingFilesArray([]);
        }
    };

    const handleDelete = async (file: CloudinaryFile) => {
        if (!confirm(`Delete "${file.original_name || file.public_id}"?`)) return;

        try {
            const { error } = await supabase
                .from("cloudinary_files")
                .delete()
                .eq("id", file.id);

            if (error) throw error;
            toast.success("File record deleted");
            fetchFiles();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete file");
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("URL copied to clipboard");
    };

    const handlePreview = (file: CloudinaryFile) => {
        setPreviewUrl(file.url);
        setPreviewType(file.resource_type || "");
        setPreviewName(file.original_name || file.public_id);
    };

    const getFileIcon = (resourceType: string | null) => {
        if (resourceType === "image") return <ImageIcon className="w-5 h-5 text-blue-500" />;
        if (resourceType === "video") return <VideoIcon className="w-5 h-5 text-purple-500" />;
        return <FileIcon className="w-5 h-5 text-muted-foreground" />;
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                                        {getFileIcon(file.resource_type)}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {file.original_name || file.public_id}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatSize(file.bytes)} •{" "}
                                                {file.format?.toUpperCase()} •{" "}
                                                {file.folder && <span className="text-primary">{FOLDER_OPTIONS.find(f => f.value === file.folder)?.label || file.folder}</span>}
                                                {file.folder && " • "}
                                                {file.width && file.height ? `${file.width}×${file.height} • ` : ""}
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {(file.resource_type === "image" || file.resource_type === "video") && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePreview(file)}
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
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
                        {previewType === "image" && previewUrl && (
                            <img src={previewUrl} alt={previewName} className="max-w-full max-h-[65vh] rounded" />
                        )}
                        {previewType === "video" && previewUrl && (
                            <video src={previewUrl} controls className="max-w-full max-h-[65vh] rounded" />
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
