import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ArrowLeft, Trophy, TrendingUp, BarChart3, Calendar, Award, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface CompetitionScore {
  id: number;
  eventName: string;
  sessionName: string;
  apparatus: string;
  difficulty: number;
  execution: number;
  total: number;
  date: string;
  position: number;
  totalCompetitors: number;
}

interface StatsData {
  totalCompetitions: number;
  bestScore: number;
  averageScore: number;
  medalsWon: number;
  topThreeFinishes: number;
  recentScores: CompetitionScore[];
  apparatusStats: {
    apparatus: string;
    count: number;
    average: number;
    best: number;
  }[];
}

export default function GymnastStats() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");

  // Check if user is a gymnast
  if (!user || user.role !== 'gymnast') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">This page is only available for gymnast accounts.</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch gymnast's competition history and stats
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/gymnasts/stats", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/gymnasts/${user.id}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Competition History</h2>
            <p className="text-gray-600 mb-4">
              You haven't competed in any events yet. Once you participate in competitions, your stats will appear here.
            </p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const scoreProgressData = stats.recentScores
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((score, index) => ({
      competition: index + 1,
      event: score.eventName.substring(0, 10) + "...",
      apparatus: score.apparatus,
      score: score.total,
      date: new Date(score.date).toLocaleDateString(),
    }));

  const apparatusChartData = stats.apparatusStats.map(stat => ({
    apparatus: stat.apparatus,
    average: stat.average,
    best: stat.best,
    competitions: stat.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Your Competition Stats
            </h1>
          </div>
          <p className="text-gray-600">
            Track your gymnastics performance and progress over time
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Competitions</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalCompetitions}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Best Score</p>
                  <p className="text-3xl font-bold text-green-600">{stats.bestScore.toFixed(2)}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.averageScore.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top 3 Finishes</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.topThreeFinishes}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Score Progress
            </TabsTrigger>
            <TabsTrigger value="apparatus" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              By Apparatus
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Competition History
            </TabsTrigger>
          </TabsList>

          {/* Score Progress Chart */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Score Progression Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="event" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [value.toFixed(2), "Score"]}
                        labelFormatter={(label) => `Competition: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Apparatus Performance */}
          <TabsContent value="apparatus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance by Apparatus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={apparatusChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="apparatus" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="average" fill="#8884d8" name="Average Score" />
                      <Bar dataKey="best" fill="#82ca9d" name="Best Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Apparatus Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.apparatusStats.map((apparatus) => (
                <Card key={apparatus.apparatus}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{apparatus.apparatus}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Competitions:</span>
                        <span className="font-medium">{apparatus.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average:</span>
                        <span className="font-medium">{apparatus.average.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Best:</span>
                        <span className="font-medium text-green-600">{apparatus.best.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Competition History */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Competition Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentScores.map((score) => (
                    <div key={score.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{score.eventName}</h4>
                        <p className="text-sm text-gray-600">{score.sessionName} - {score.apparatus}</p>
                        <p className="text-xs text-gray-500">{new Date(score.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{score.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          D: {score.difficulty.toFixed(1)} E: {score.execution.toFixed(1)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {score.position}/{score.totalCompetitors}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}