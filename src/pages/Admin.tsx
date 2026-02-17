import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { Search, Download, LogOut, Loader2, Upload, Trash2, Menu, Home } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Session } from "@supabase/supabase-js";

interface Submission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  postal_code: string;
  spaces: any;
  storage_priorities: string[];
  additional_notes: string | null;
  meeting_date: string | null;
  meeting_link: string | null;
  meeting_platform: string | null;
  status: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (!session) {
          setTimeout(() => {
            navigate("/auth");
          }, 0);
        } else {
          // Check if user is admin
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        }
      }
    );

    // Check existing session
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
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking admin role:", error);
        toast.error("Error checking permissions");
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

  useEffect(() => {
    if (isAdmin && session) {
      fetchSubmissions();
    }
  }, [isAdmin, session]);

  // Auto-logout functionality
  useEffect(() => {
    if (!session) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout("Logged out due to inactivity");
      }, 60000); // 1 minute
    };

    // Events to detect activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    // Set up listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [session]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
      setFilteredSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = submissions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.postal_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  }, [searchTerm, statusFilter, submissions]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Submission deleted');
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  const handleLogout = async (reason?: string) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(reason || "Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
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
            <p className="text-muted-foreground">You don't have admin privileges.</p>
          </Card>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Review and manage client submissions</p>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">

              <Button onClick={() => navigate("/file-manager")} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              <Button onClick={() => handleLogout()} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Actions - Moved to Header */}
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or postal code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>Showing {filteredSubmissions.length} of {submissions.length} submissions</p>
            </div>
          </Card>

          <div className="grid gap-6">
            {filteredSubmissions.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  {submissions.length === 0 ? "No submissions yet" : "No submissions match your filters"}
                </p>
              </Card>
            ) : (
              filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{submission.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{submission.email}</p>
                        {submission.phone && (
                          <p className="text-sm text-muted-foreground">{submission.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={submission.status === 'pending' ? 'secondary' : 'default'}>
                          {submission.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(submission.created_at), 'MMM d, yyyy')}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the submission from <strong>{submission.full_name}</strong>. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteSubmission(submission.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-1">Location</p>
                        <p className="text-sm text-muted-foreground">{submission.postal_code}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Spaces</p>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(submission.spaces) ? submission.spaces.length : 0} space(s)
                        </p>
                      </div>
                    </div>

                    {/* Meeting Details */}
                    {submission.meeting_date && submission.meeting_link && (
                      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg">🗓️</span>
                          <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                            Scheduled Meeting
                          </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                              Date & Time
                            </p>
                            <p className="text-base font-semibold text-emerald-900 dark:text-emerald-50">
                              {format(new Date(submission.meeting_date), 'MMMM do, yyyy h:mm a')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                              Platform
                            </p>
                            <p className="text-base font-semibold text-emerald-900 dark:text-emerald-50 capitalize">
                              {submission.meeting_platform || 'Video Call'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 space-y-3">
                          <Button
                            size="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={() => window.open(submission.meeting_link!, '_blank')}
                          >
                            Join Meeting
                          </Button>
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Link:</span>
                            <a
                              href={submission.meeting_link!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                            >
                              {submission.meeting_link}
                            </a>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Customer Drawings */}
                    {Array.isArray(submission.spaces) && submission.spaces.some((space: any) => space.drawingData) && (
                      <div>
                        <p className="text-sm font-semibold mb-3">Customer Drawings</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {submission.spaces.map((space: any, index: number) => (
                            space.drawingData && (
                              <div key={index} className="border border-border rounded-lg overflow-hidden">
                                <div className="bg-muted px-3 py-2">
                                  <p className="text-sm font-medium">{space.name || `Space ${index + 1}`}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {space.type} • Ceiling: {space.ceilingHeight || 'N/A'} {space.unit || 'cm'}
                                  </p>
                                </div>
                                <div className="p-2 bg-white">
                                  <img
                                    src={space.drawingData}
                                    alt={`${space.name} drawing`}
                                    className="w-full h-auto rounded"
                                  />
                                </div>

                                {/* Wall Measurements */}
                                {space.wallMeasurements && space.wallMeasurements.length > 0 && (
                                  <div className="px-3 py-3 bg-muted/50 border-t">
                                    <p className="text-xs font-semibold mb-2 text-foreground">Wall Measurements ({space.unit || 'cm'})</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {space.wallMeasurements.map((wall: any, wallIndex: number) => (
                                        <div key={wallIndex} className="flex items-center gap-1 text-xs">
                                          <span className="font-semibold text-primary">Wall {wall.label}:</span>
                                          <span className="text-foreground">{wall.length || '—'} {space.unit || 'cm'}</span>
                                        </div>
                                      ))}
                                    </div>
                                    {space.totalPerimeter > 0 && (
                                      <div className="mt-3 pt-2 border-t border-border">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                          <div className="flex items-center gap-1 text-xs">
                                            <span className="font-semibold text-muted-foreground">Total Perimeter:</span>
                                            <span className="font-bold text-primary">{space.totalPerimeter.toFixed(2)} {space.unit || 'cm'}</span>
                                          </div>
                                          {space.totalArea > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                              <span className="font-semibold text-muted-foreground">Estimated Area:</span>
                                              <span className="font-bold text-primary">{space.totalArea.toFixed(2)} {space.unit || 'cm'}²</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="px-3 py-2 flex justify-end border-t">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = space.drawingData;
                                      link.download = `${space.name}-drawing.png`;
                                      link.click();
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.storage_priorities.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Storage Priorities</p>
                        <div className="flex gap-2">
                          {submission.storage_priorities.map((priority) => (
                            <Badge key={priority} variant="outline">
                              {priority}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.additional_notes && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground">{submission.additional_notes}</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <Label className="text-sm font-semibold mb-2 block">Update Status</Label>
                      <Select
                        value={submission.status}
                        onValueChange={(value) => updateStatus(submission.id, value)}
                      >
                        <SelectTrigger className="w-full md:w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
