import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    AlertCircle,
    RefreshCw,
    FolderOpen,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    uploaded_by?: string;
    title?: string | null;
    type?: string | null;
    description?: string | null;
}

interface UploadProgress {
    fileName: string;
    progress: number;
    status: "pending" | "uploading" | "success" | "error";
    error?: string;
}

const FOLDER_OPTIONS = [
    { value: "service_images", label: "Service Images" },
    { value: "Gallery_images", label: "Gallery Images" },
    { value: "before_after_images", label: "Before & After Images" },
];

const TYPE_OPTIONS = [
    { value: "closets", label: "Closets" },
    { value: "kitchens", label: "Kitchens" },
    { value: "garages", label: "Garages" },
    { value: "others", label: "Others" },
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 20;

const FileManager = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState<CloudinaryFile[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<CloudinaryFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState("");
    const [previewName, setPreviewName] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("service_images");
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [pendingFilesArray, setPendingFilesArray] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [activeTab, setActiveTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<CloudinaryFile | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [uploadErrors, setUploadErrors] = useState<string[]>([]);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadType, setUploadType] = useState("closets");
    const [uploadDescription, setUploadDescription] = useState("");

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (!session) {
                setTimeout(() => navigate("/auth"), 0);
            } else {
                setTimeout(() => checkAdminRole(session.user.id), 0);
            }
        });

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

    const fetchFiles = useCallback(async (showToast = false) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("cloudinary_files")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setFiles((data as CloudinaryFile[]) || []);
            if (showToast) {
                toast.success("Files refreshed successfully");
            }
        } catch (error) {
            console.error("Error fetching files:", error);
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        let filtered = [...files];
        if (activeTab !== "all") {
            filtered = filtered.filter((file) => file.folder === activeTab);
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (file) =>
                    file.original_name?.toLowerCase().includes(term) ||
                    file.public_id.toLowerCase().includes(term) ||
                    file.folder?.toLowerCase().includes(term)
            );
        }
        setFilteredFiles(filtered);
    }, [files, activeTab, searchTerm]);

    useEffect(() => {
        if (isAdmin && session) {
            fetchFiles();
        }
    }, [isAdmin, session, fetchFiles]);

    const validateFiles = (files: File[]) => {
        const errors: string[] = [];
        const valid: File[] = [];

        if (files.length > MAX_FILES_PER_UPLOAD) {
            errors.push(`Maximum ${MAX_FILES_PER_UPLOAD} files can be uploaded at once`);
            return { valid, errors };
        }

        files.forEach((file) => {
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name} exceeds maximum file size (100MB)`);
            } else {
                valid.push(file);
            }
        });

        return { valid, errors };
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const filesArray = Array.from(selectedFiles);
        const { valid, errors } = validateFiles(filesArray);

        if (errors.length > 0) {
            setUploadErrors(errors);
            toast.error(`${errors.length} file(s) rejected due to size limits`);
        }

        if (valid.length > 0) {
            setPendingFilesArray(valid);
            setUploadTitle("");
            setUploadType("closets");
            setUploadDescription("");
            setSelectedFolder("service_images");
            setShowFolderDialog(true);
            setUploadProgress(
                valid.map((file) => ({
                    fileName: file.name,
                    progress: 0,
                    status: "pending",
                }))
            );
        }

        e.target.value = "";
    };

    const handleUploadConfirm = async () => {
        if (pendingFilesArray.length === 0) return;

        setShowFolderDialog(false);
        setUploading(true);
        setUploadErrors([]);

        const uploadResults = { success: 0, failed: 0 };

        try {
            for (let i = 0; i < pendingFilesArray.length; i++) {
                const file = pendingFilesArray[i];

                setUploadProgress((prev) =>
                    prev.map((p, idx) =>
                        idx === i ? { ...p, status: "uploading", progress: 0 } : p
                    )
                );

                try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("folder", `admin-uploads/${selectedFolder}`);

                    const { data, error } = await supabase.functions.invoke(
                        "cloudinary-upload",
                        { body: formData }
                    );

                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);

                    setUploadProgress((prev) =>
                        prev.map((p, idx) =>
                            idx === i ? { ...p, progress: 50 } : p
                        )
                    );

                    const { error: dbError } = await supabase
                        .from("cloudinary_files")
                        .insert({
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
                            title: uploadTitle || null,
                            type: uploadType,
                            description: uploadDescription || null,
                        } as any);

                    if (dbError) throw dbError;

                    setUploadProgress((prev) =>
                        prev.map((p, idx) =>
                            idx === i ? { ...p, status: "success", progress: 100 } : p
                        )
                    );

                    uploadResults.success++;
                } catch (error: any) {
                    console.error(`Error uploading ${file.name}:`, error);
                    setUploadProgress((prev) =>
                        prev.map((p, idx) =>
                            idx === i
                                ? { ...p, status: "error", error: error?.message || "Upload failed" }
                                : p
                        )
                    );
                    uploadResults.failed++;
                }

                if (i < pendingFilesArray.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }

            if (uploadResults.success > 0) {
                toast.success(
                    `${uploadResults.success} file(s) uploaded to ${FOLDER_OPTIONS.find((f) => f.value === selectedFolder)?.label}`
                );
            }
            if (uploadResults.failed > 0) {
                toast.error(`${uploadResults.failed} file(s) failed to upload`);
            }

            await fetchFiles();
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error?.message || "Failed to upload file(s)");
        } finally {
            setUploading(false);
            setTimeout(() => {
                setPendingFilesArray([]);
                setUploadProgress([]);
            }, 3000);
        }
    };

    const handleDelete = async (file: CloudinaryFile) => {
        try {
            const { error } = await supabase
                .from("cloudinary_files")
                .delete()
                .eq("id", file.id);

            if (error) throw error;

            toast.success(`"${file.original_name || file.public_id}" deleted`);
            setShowDeleteConfirm(null);
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

    const handleRefresh = () => {
        setRefreshing(true);
        fetchFiles(true);
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
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const getFolderStats = (folderValue: string) => {
        const count = files.filter((f) => f.folder === folderValue).length;
        const totalSize = files
            .filter((f) => f.folder === folderValue)
            .reduce((acc, f) => acc + (f.bytes || 0), 0);
        return { count, totalSize };
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
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>
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

                    {/* Upload Progress */}
                    {uploadProgress.length > 0 && (
                        <Card className="p-4 space-y-3">
                            <h3 className="font-semibold text-sm">Upload Progress</h3>
                            <div className="space-y-2">
                                {uploadProgress.map((item, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="truncate max-w-[200px]">{item.fileName}</span>
                                            <span className="flex items-center gap-1">
                                                {item.status === "success" && (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                )}
                                                {item.status === "error" && (
                                                    <XCircle className="w-4 h-4 text-destructive" />
                                                )}
                                                {item.status === "uploading" && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                )}
                                                {item.status === "uploading" && `${item.progress}%`}
                                            </span>
                                        </div>
                                        {item.status === "uploading" && <Progress value={item.progress} className="h-2" />}
                                        {item.error && (
                                            <p className="text-xs text-destructive">{item.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Upload Errors Alert */}
                    {uploadErrors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Upload Errors</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc list-inside mt-1">
                                    {uploadErrors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Search and Filter */}
                    <div className="space-y-3">
                        <Input
                            placeholder="Search files by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />

                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="flex-wrap h-auto gap-1">
                                <TabsTrigger value="all">
                                    <FolderOpen className="w-3 h-3 mr-1" />
                                    All ({files.length})
                                </TabsTrigger>
                                {FOLDER_OPTIONS.map((folder) => {
                                    const stats = getFolderStats(folder.value);
                                    return (
                                        <TabsTrigger key={folder.value} value={folder.value}>
                                            {folder.label} ({stats.count})
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* File List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <Card className="p-12 text-center">
                            <FileIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                {searchTerm || activeTab !== "all"
                                    ? "No files match your filters"
                                    : "No files yet. Upload your first file to Cloudinary."}
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {/* Stats Bar */}
                            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                                <span>{filteredFiles.length} file(s) shown</span>
                                <span>
                                    Total size:{" "}
                                    {formatSize(filteredFiles.reduce((acc, f) => acc + (f.bytes || 0), 0))}
                                </span>
                            </div>

                            {filteredFiles.map((file) => (
                                <Card key={file.id} className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {getFileIcon(file.resource_type)}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">
                                                    {file.original_name || file.public_id}
                                                </p>
                                                {file.folder && (
                                                    <Badge variant="secondary" className="text-xs shrink-0">
                                                        {FOLDER_OPTIONS.find((f) => f.value === file.folder)?.label ||
                                                            file.folder}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatSize(file.bytes)} • {file.format?.toUpperCase()} •{" "}
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
                                            onClick={() => setShowDeleteConfirm(file)}
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
                            <video src={previewUrl} controls className="max-w-full max-h-[65vh] rounded">
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Upload Files</DialogTitle>
                        <DialogDescription>
                            Select a folder, then fill in the details for {pendingFilesArray.length} file(s)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Folder Selection */}
                        <div className="space-y-2">
                            <Label>Folder *</Label>
                            <Select value={selectedFolder} onValueChange={(val) => {
                                setSelectedFolder(val);
                                // Reset metadata fields when folder changes
                                setUploadTitle("");
                                setUploadType("closets");
                                setUploadDescription("");
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select folder" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FOLDER_OPTIONS.map((opt) => {
                                        const stats = getFolderStats(opt.value);
                                        return (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <span className="flex items-center gap-2">
                                                    {opt.label}
                                                    <span className="text-muted-foreground text-xs">
                                                        ({stats.count} files)
                                                    </span>
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Service Images fields */}
                        {selectedFolder === "service_images" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="upload-title">Service Title *</Label>
                                    <Input
                                        id="upload-title"
                                        placeholder="e.g. Kitchen Cabinets"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select value={uploadType} onValueChange={setUploadType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Image Preview */}
                                {pendingFilesArray.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Image Preview</Label>
                                        <div className="rounded-lg border overflow-hidden bg-muted">
                                            <img
                                                src={URL.createObjectURL(pendingFilesArray[0])}
                                                alt="Preview"
                                                className="w-full h-48 object-cover"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {pendingFilesArray[0].name} ({formatSize(pendingFilesArray[0].size)})
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="upload-description">Description</Label>
                                    <Textarea
                                        id="upload-description"
                                        placeholder="Describe the service features (e.g. Custom Sizes, Premium Materials...)"
                                        value={uploadDescription}
                                        onChange={(e) => setUploadDescription(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </>
                        )}

                        {/* Gallery Images fields */}
                        {selectedFolder === "Gallery_images" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="upload-title">Project Title *</Label>
                                    <Input
                                        id="upload-title"
                                        placeholder="e.g. Project 1"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Type *</Label>
                                    <Select value={uploadType} onValueChange={setUploadType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Image Preview */}
                                {pendingFilesArray.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Image Preview</Label>
                                        <div className="rounded-lg border overflow-hidden bg-muted">
                                            <img
                                                src={URL.createObjectURL(pendingFilesArray[0])}
                                                alt="Preview"
                                                className="w-full h-48 object-cover"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {pendingFilesArray[0].name} ({formatSize(pendingFilesArray[0].size)})
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="upload-description">Description</Label>
                                    <Textarea
                                        id="upload-description"
                                        placeholder="e.g. Custom cabinetry and closet design"
                                        value={uploadDescription}
                                        onChange={(e) => setUploadDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {/* Before & After Images fields */}
                        {selectedFolder === "before_after_images" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="upload-title">Title *</Label>
                                    <Input
                                        id="upload-title"
                                        placeholder="e.g. Kitchen Renovation"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Type *</Label>
                                    <Select value={uploadType} onValueChange={setUploadType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Image Preview */}
                                {pendingFilesArray.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Image Preview</Label>
                                        <div className="rounded-lg border overflow-hidden bg-muted">
                                            <img
                                                src={URL.createObjectURL(pendingFilesArray[0])}
                                                alt="Preview"
                                                className="w-full h-48 object-cover"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {pendingFilesArray[0].name} ({formatSize(pendingFilesArray[0].size)})
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="upload-description">Description</Label>
                                    <Textarea
                                        id="upload-description"
                                        placeholder="e.g. Before and after of a full kitchen remodel"
                                        value={uploadDescription}
                                        onChange={(e) => setUploadDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {/* Other folders - minimal fields */}
                        {selectedFolder !== "service_images" && selectedFolder !== "Gallery_images" && selectedFolder !== "before_after_images" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="upload-title">Title</Label>
                                    <Input
                                        id="upload-title"
                                        placeholder="Enter a title..."
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="upload-description">Description</Label>
                                    <Textarea
                                        id="upload-description"
                                        placeholder="Enter a description..."
                                        value={uploadDescription}
                                        onChange={(e) => setUploadDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                {/* Selected Files Preview */}
                                <div className="rounded-md border p-3 max-h-32 overflow-auto space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Selected file(s):
                                    </p>
                                    {pendingFilesArray.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            <ImageIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
                                            <span className="truncate">{file.name}</span>
                                            <span className="text-muted-foreground text-xs shrink-0">
                                                ({formatSize(file.size)})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowFolderDialog(false);
                                    setPendingFilesArray([]);
                                    setUploadProgress([]);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUploadConfirm}
                                disabled={uploading || ((selectedFolder === "service_images" || selectedFolder === "Gallery_images" || selectedFolder === "before_after_images") && !uploadTitle.trim())}
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                Upload {pendingFilesArray.length} file(s)
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "
                            {showDeleteConfirm?.original_name || showDeleteConfirm?.public_id}"? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FileManager;
