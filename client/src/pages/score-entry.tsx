import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, RotateCcw, SkipForward } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Gymnast {
  id: number;
  firstName: string;
  lastName: string;
  clubName: string;
}

interface Session {
  id: number;
  name: string;
  level: string;
}

interface Apparatus {
  id: number;
  name: string;
  code: string;
  icon: string;
}

const scoreSchema = z.object({
  difficultyScore: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 10, {
    message: "Must be a valid score between 0 and 10"
  }),
  executionScore: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 10, {
    message: "Must be a valid score between 0 and 10"
  }),
  deductions: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Must be a valid positive number"
  }).optional(),
  notes: z.string().optional(),
});

export default function ScoreEntry() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedGymnast, setSelectedGymnast] = useState<Gymnast | null>(null);
  const [selectedApparatus, setSelectedApparatus] = useState<Apparatus | null>(null);
  const [finalScore, setFinalScore] = useState<string>("0.000");

  const { data: session } = useQuery({
    queryKey: ["/api/sessions", sessionId],
  });

  const { data: gymnasts = [] } = useQuery({
    queryKey: ["/api/sessions", sessionId, "gymnasts"],
  });

  const { data: apparatus = [] } = useQuery({
    queryKey: ["/api/apparatus"],
  });

  const { data: scores = [] } = useQuery({
    queryKey: ["/api/sessions", sessionId, "scores"],
  });

  const form = useForm({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      difficultyScore: "0.0",
      executionScore: "0.0",
      deductions: "0.0",
      notes: "",
    },
  });

  const scoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/scores", data);
    },
    onSuccess: () => {
      toast({
        title: "Score Saved",
        description: "The score has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "scores"] });
      form.reset();
      // Move to next gymnast
      const currentIndex = gymnasts.findIndex((g: Gymnast) => g.id === selectedGymnast?.id);
      if (currentIndex < gymnasts.length - 1) {
        setSelectedGymnast(gymnasts[currentIndex + 1]);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate final score when difficulty, execution, or deductions change
  useEffect(() => {
    const difficultyScore = parseFloat(form.watch("difficultyScore") || "0");
    const executionScore = parseFloat(form.watch("executionScore") || "0");
    const deductions = parseFloat(form.watch("deductions") || "0");
    
    const calculated = difficultyScore + executionScore - deductions;
    setFinalScore(Math.max(0, calculated).toFixed(1));
  }, [form.watch("difficultyScore"), form.watch("executionScore"), form.watch("deductions")]);

  const onSubmit = (data: z.infer<typeof scoreSchema>) => {
    if (!selectedGymnast || !selectedApparatus) {
      toast({
        title: "Error",
        description: "Please select a gymnast and apparatus.",
        variant: "destructive",
      });
      return;
    }

    scoreMutation.mutate({
      sessionId: parseInt(sessionId!),
      gymnastId: selectedGymnast.id,
      apparatusId: selectedApparatus.id,
      difficultyScore: data.difficultyScore,
      executionScore: data.executionScore,
      finalScore,
      deductions: data.deductions || "0",
      notes: data.notes,
    });
  };

  const addQuickDeduction = (amount: number) => {
    const currentDeductions = parseFloat(form.getValues("deductions") || "0");
    form.setValue("deductions", (currentDeductions + amount).toFixed(1));
  };

  const getGymnastScore = (gymnastId: number, apparatusId: number) => {
    return scores.find((score: any) => 
      score.gymnastId === gymnastId && score.apparatusId === apparatusId
    );
  };

  // Auto-select first apparatus if none selected
  useEffect(() => {
    if (apparatus.length > 0 && !selectedApparatus) {
      setSelectedApparatus(apparatus[0]);
    }
  }, [apparatus, selectedApparatus]);

  // Auto-select first gymnast if none selected
  useEffect(() => {
    if (gymnasts.length > 0 && !selectedGymnast) {
      setSelectedGymnast(gymnasts[0]);
    }
  }, [gymnasts, selectedGymnast]);

  if (!user?.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Account Not Approved</h2>
            <p className="text-gray-600">Your judge account is pending approval. Please contact an administrator.</p>
          </CardContent>
        </Card>
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
                onClick={() => setLocation(-1)}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <nav className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Events</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-500">Competition</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-500">{session?.name}</span>
                <span className="text-gray-400">/</span>
                <span className="font-medium text-gray-900">{selectedApparatus?.name}</span>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Judge: <span className="font-medium">{user?.displayName || `${user?.firstName} ${user?.lastName}`}</span>
              </span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Apparatus & Gymnast Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Apparatus Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-list text-accent mr-2"></i>
                  Select Apparatus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {apparatus.map((app: Apparatus) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApparatus(app)}
                    className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors border-l-4 ${
                      selectedApparatus?.id === app.id ? 'border-primary bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <i className={`${app.icon} text-accent mr-3`}></i>
                      <span className="font-medium">{app.name}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Gymnast List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className={`${selectedApparatus?.icon} text-accent mr-2`}></i>
                  {selectedApparatus?.name} - {session?.level}
                </CardTitle>
                <p className="text-sm text-gray-600">{gymnasts.length} gymnasts competing</p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {gymnasts.map((gymnast: Gymnast) => {
                  const score = selectedApparatus ? getGymnastScore(gymnast.id, selectedApparatus.id) : null;
                  return (
                    <button
                      key={gymnast.id}
                      onClick={() => setSelectedGymnast(gymnast)}
                      className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors border-l-4 ${
                        selectedGymnast?.id === gymnast.id 
                          ? 'border-accent bg-orange-50' 
                          : score 
                            ? 'border-secondary' 
                            : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {gymnast.firstName} {gymnast.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{gymnast.clubName}</div>
                        </div>
                        <div className="text-right">
                          {score ? (
                            <>
                              <div className="text-lg font-bold text-secondary">{parseFloat(score.finalScore).toFixed(1)}</div>
                              <div className="text-xs text-gray-500">Scored</div>
                            </>
                          ) : selectedGymnast?.id === gymnast.id ? (
                            <div className="text-sm text-accent font-medium">Current</div>
                          ) : (
                            <div className="text-sm text-gray-500">Pending</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right: Score Entry Form */}
          <div className="lg:col-span-2">
            {selectedGymnast ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Score Entry</CardTitle>
                      <p className="text-sm text-gray-600">
                        {selectedGymnast.firstName} {selectedGymnast.lastName} - {selectedGymnast.clubName}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Apparatus: {selectedApparatus?.code}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Difficulty Score */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Difficulty Score (D-Score)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">D-Score</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            {...form.register("difficultyScore")}
                            className="text-center text-lg font-medium"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">D-Score Total</Label>
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-lg font-bold text-primary">
                            {form.watch("difficultyScore") || "0.0"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Execution Score */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Execution Score (E-Score)</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">Start Value</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value="10.0"
                            disabled
                            className="text-center text-lg font-medium bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">E-Score</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            {...form.register("executionScore")}
                            className="text-center text-lg font-medium"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">E-Score Total</Label>
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-lg font-bold text-secondary">
                            {form.watch("executionScore") || "0.0"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Deductions</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">Total Deductions</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            {...form.register("deductions")}
                            className="text-center text-lg font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuickDeduction(1.0)}
                          >
                            Fall (-1.0)
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuickDeduction(0.3)}
                          >
                            Step (-0.3)
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuickDeduction(0.1)}
                          >
                            Balance (-0.1)
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuickDeduction(0.1)}
                          >
                            Form (-0.1)
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Final Score Display */}
                    <div className="p-4 bg-gradient-to-r from-primary to-secondary rounded-xl text-white">
                      <div className="text-center">
                        <div className="text-sm mb-1">Final Score</div>
                        <div className="text-4xl font-bold">{finalScore}</div>
                        <div className="text-sm opacity-90">
                          D: {form.watch("difficultyScore") || "0.0"} + E: {form.watch("executionScore") || "0.0"} - Ded: {form.watch("deductions") || "0.0"}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes">Judge Notes</Label>
                      <Textarea
                        id="notes"
                        {...form.register("notes")}
                        placeholder="Optional notes about the routine..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-primary hover:bg-blue-700"
                        disabled={scoreMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {scoreMutation.isPending ? "Saving..." : "Submit Score"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentIndex = gymnasts.findIndex((g: Gymnast) => g.id === selectedGymnast?.id);
                          if (currentIndex < gymnasts.length - 1) {
                            setSelectedGymnast(gymnasts[currentIndex + 1]);
                            form.reset();
                          }
                        }}
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Skip
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Gymnast</h3>
                  <p className="text-gray-600">Choose a gymnast from the list to begin score entry.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
