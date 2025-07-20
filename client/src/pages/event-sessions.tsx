import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Download, Eye, Settings, Calendar, MapPin, Users, Clock } from "lucide-react";

interface Session {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  date: string;
  level: string;
  status: "upcoming" | "in_progress" | "completed";
}

interface Event {
  id: number;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function EventSessions() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["/api/events", id],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/events", id, "sessions"],
  });

  const canManage = user?.role === "club" || user?.role === "admin";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress": return "🔴";
      case "upcoming": return "⏰";
      case "completed": return "✅";
      default: return "";
    }
  };

  const mockApparatusData = [
    { name: "Floor Exercise", icon: "fas fa-running", scored: 12, total: 15 },
    { name: "Pommel Horse", icon: "fas fa-horse-head", scored: 8, total: 15 },
    { name: "Still Rings", icon: "fas fa-circle", scored: 15, total: 15 },
    { name: "Vault", icon: "fas fa-horse", scored: 0, total: 15 },
  ];

  if (eventLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <nav className="flex items-center space-x-2 text-sm">
                <Link href="/" className="text-gray-500 hover:text-primary">Events</Link>
                <span className="text-gray-400">/</span>
                <span className="font-medium text-gray-900">{event?.name}</span>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {event?.status === "live" && (
                <Badge className="bg-green-100 text-green-800">
                  🔴 Live Event
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event?.name}</h1>
              <div className="flex items-center space-x-6 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{event?.venue}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{event?.startDate} - {event?.endDate}</span>
                </div>
              </div>
            </div>
            
            {canManage && (
              <div className="flex space-x-3">
                <Button className="bg-primary hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Session
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                    <p className="text-gray-600">Sessions will appear here once they are created.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            sessions.map((session: Session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{session.name}</h3>
                      <p className="text-sm text-gray-600">{session.startTime} - {session.endTime}</p>
                      <p className="text-sm text-gray-600">{session.level}</p>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusIcon(session.status)}
                      {session.status === "in_progress" ? "In Progress" :
                       session.status === "upcoming" ? "Upcoming" : "Completed"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {mockApparatusData.map((apparatus, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <i className={`${apparatus.icon} text-accent mr-2`}></i>
                          <span className="text-sm font-medium">{apparatus.name}</span>
                        </div>
                        <span className="text-xs text-gray-600">
                          {apparatus.scored}/{apparatus.total} scored
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex space-x-2">
                    {session.status === "in_progress" && user?.role === "judge" && user?.isApproved ? (
                      <Link href={`/sessions/${session.id}/score`} className="flex-1">
                        <Button className="w-full bg-primary hover:bg-blue-700">
                          Enter Scores
                        </Button>
                      </Link>
                    ) : session.status === "completed" ? (
                      <Link href={`/sessions/${session.id}/results`} className="flex-1">
                        <Button className="w-full bg-secondary hover:bg-green-600">
                          View Results
                        </Button>
                      </Link>
                    ) : (
                      <Button className="flex-1 bg-gray-100 text-gray-500 cursor-not-allowed" disabled>
                        {session.status === "upcoming" ? "Not Started" : "Enter Session"}
                      </Button>
                    )}
                    
                    {canManage && (
                      <Button variant="outline" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
