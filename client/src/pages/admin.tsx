import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { UserCheck, UserX, Users, Settings, Trophy, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch pending user requests
  const { data: pendingJudges = [], refetch: refetchJudges } = useQuery({
    queryKey: ["/api/users/role/judge"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/role/judge");
      return await response.json();
    },
  });

  const { data: pendingClubs = [], refetch: refetchClubs } = useQuery({
    queryKey: ["/api/users/role/club"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/role/club");
      return await response.json();
    },
  });

  const { data: pendingGymnasts = [], refetch: refetchGymnasts } = useQuery({
    queryKey: ["/api/users/role/gymnast"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/role/gymnast");
      return await response.json();
    },
  });

  // Approve/Reject user mutation
  const approveUserMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: number; approved: boolean }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}/role`, {
        isApproved: approved,
      });
      if (!approved) {
        return { deleted: true };
      }
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.approved ? "User Approved" : "User Rejected",
        description: variables.approved 
          ? "The user account has been approved and activated."
          : "The user account has been rejected and removed.",
      });
      // Refetch all user lists
      refetchJudges();
      refetchClubs();
      refetchGymnasts();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: number) => {
    approveUserMutation.mutate({ userId, approved: true });
  };

  const handleReject = (userId: number) => {
    approveUserMutation.mutate({ userId, approved: false });
  };

  // Filter function for search
  const filterUsers = (users: User[]) => {
    if (!searchTerm.trim()) return users;
    return users.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const UserApprovalTable = ({ users, title, type }: { users: User[]; title: string; type: string }) => {
    const filteredUsers = filterUsers(users);
    const pendingUsers = filteredUsers.filter(u => !u.isApproved);
    const approvedUsers = filteredUsers.filter(u => u.isApproved);
    const showPending = activeTab === "pending";
    const displayUsers = showPending ? pendingUsers : approvedUsers;

    if (displayUsers.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title} {showPending ? "Pending Approval" : "Approved"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              {showPending ? "No pending requests" : "No approved users"}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title} {showPending ? `Pending Approval (${pendingUsers.length})` : `Approved (${approvedUsers.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                {type === "judge" && <TableHead>Judge ID</TableHead>}
                {type === "club" && <TableHead>Club Name</TableHead>}
                {type === "gymnast" && <TableHead>Club Affiliation</TableHead>}
                <TableHead>Status</TableHead>
                {showPending && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  {type === "judge" && <TableCell>{user.judgeId || "N/A"}</TableCell>}
                  {type === "club" && <TableCell>{user.clubName || "N/A"}</TableCell>}
                  {type === "gymnast" && <TableCell>{user.clubAffiliation || "N/A"}</TableCell>}
                  <TableCell>
                    <Badge variant={user.isApproved ? "default" : "secondary"}>
                      {user.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  {showPending && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(user.id)}
                          disabled={approveUserMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(user.id)}
                          disabled={approveUserMutation.isPending}
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-2">Manage user accounts and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Judges</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {pendingJudges.filter(u => !u.isApproved).length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Clubs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pendingClubs.filter(u => !u.isApproved).length}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Gymnasts</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {pendingGymnasts.filter(u => !u.isApproved).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-red-600">
                    {[...pendingJudges, ...pendingClubs, ...pendingGymnasts].filter(u => !u.isApproved).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* User Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Pending Approvals
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Approved Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <UserApprovalTable users={pendingJudges} title="Judges" type="judge" />
            <UserApprovalTable users={pendingClubs} title="Clubs" type="club" />
            <UserApprovalTable users={pendingGymnasts} title="Gymnasts" type="gymnast" />
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <UserApprovalTable users={pendingJudges} title="Judges" type="judge" />
            <UserApprovalTable users={pendingClubs} title="Clubs" type="club" />
            <UserApprovalTable users={pendingGymnasts} title="Gymnasts" type="gymnast" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}