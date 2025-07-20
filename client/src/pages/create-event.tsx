import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft, Calendar, MapPin, Users } from "lucide-react";

const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  level: z.string().min(1, "Level is required"),
  gymnasts: z.array(z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    clubName: z.string().min(1, "Club name is required"),
    level: z.string().min(1, "Level is required"),
  })).min(1, "At least one gymnast is required"),
});

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  venue: z.string().min(1, "Venue is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional(),
  sessions: z.array(sessionSchema).min(1, "At least one session is required"),
});

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user has permission
  if (!user || (user.role !== 'admin' && user.role !== 'club')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to create events.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      venue: "",
      startDate: "",
      endDate: "",
      description: "",
      sessions: [{
        name: "",
        date: "",
        startTime: "",
        endTime: "",
        level: "",
        gymnasts: [{ firstName: "", lastName: "", clubName: "", level: "" }]
      }]
    },
  });

  const { fields: sessionFields, append: appendSession, remove: removeSession } = useFieldArray({
    control: form.control,
    name: "sessions"
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof eventSchema>) => {
      // First create the event
      const eventResponse = await apiRequest("POST", "/api/events", {
        name: data.name,
        venue: data.venue,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      });
      
      const event = await eventResponse.json();
      
      // Then create sessions and add gymnasts
      for (const sessionData of data.sessions) {
        const sessionResponse = await apiRequest("POST", "/api/sessions", {
          eventId: event.id,
          name: sessionData.name,
          date: sessionData.date,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          level: sessionData.level,
        });
        
        const session = await sessionResponse.json();
        
        // Add gymnasts to the session
        if (sessionData.gymnasts.length > 0) {
          await apiRequest("POST", `/api/sessions/${session.id}/gymnasts`, {
            gymnasts: sessionData.gymnasts
          });
        }
      }
      
      return event;
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "The event and all sessions have been created successfully.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    createEventMutation.mutate(data);
  };

  const levels = [
    "Level 1", "Level 2", "Level 3", "Level 4", "Level 5",
    "Level 6", "Level 7", "Level 8", "Level 9", "Level 10",
    "Junior", "Senior", "Elite"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Create New Event
          </h1>
          <p className="text-gray-600 mt-2">Create a gymnastics competition with sessions and gymnasts</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Victorian State Championships"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    {...form.register("venue")}
                    placeholder="Melbourne Sports Centre"
                  />
                  {form.formState.errors.venue && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.venue.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register("startDate")}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register("endDate")}
                  />
                  {form.formState.errors.endDate && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Event description, rules, or additional information..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sessions ({sessionFields.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sessionFields.map((session, sessionIndex) => (
                  <SessionForm
                    key={session.id}
                    sessionIndex={sessionIndex}
                    form={form}
                    onRemove={() => removeSession(sessionIndex)}
                    canRemove={sessionFields.length > 1}
                    levels={levels}
                  />
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendSession({
                    name: "",
                    date: "",
                    startTime: "",
                    endTime: "",
                    level: "",
                    gymnasts: [{ firstName: "", lastName: "", clubName: "", level: "" }]
                  })}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Session
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              className="bg-primary hover:bg-blue-700"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionForm({ sessionIndex, form, onRemove, canRemove, levels }: any) {
  const { fields: gymnastFields, append: appendGymnast, remove: removeGymnast } = useFieldArray({
    control: form.control,
    name: `sessions.${sessionIndex}.gymnasts`
  });

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Session {sessionIndex + 1}</CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Session Name</Label>
            <Input
              {...form.register(`sessions.${sessionIndex}.name`)}
              placeholder="Junior Women Session 1"
            />
          </div>
          <div>
            <Label>Level</Label>
            <Select onValueChange={(value) => form.setValue(`sessions.${sessionIndex}.level`, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              {...form.register(`sessions.${sessionIndex}.date`)}
            />
          </div>
          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              {...form.register(`sessions.${sessionIndex}.startTime`)}
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              type="time"
              {...form.register(`sessions.${sessionIndex}.endTime`)}
            />
          </div>
        </div>

        {/* Gymnasts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-medium">Gymnasts ({gymnastFields.length})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendGymnast({ firstName: "", lastName: "", clubName: "", level: "" })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Gymnast
            </Button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {gymnastFields.map((gymnast, gymnastIndex) => (
              <div key={gymnast.id} className="grid grid-cols-4 gap-2 p-3 border rounded">
                <Input
                  {...form.register(`sessions.${sessionIndex}.gymnasts.${gymnastIndex}.firstName`)}
                  placeholder="First Name"
                />
                <Input
                  {...form.register(`sessions.${sessionIndex}.gymnasts.${gymnastIndex}.lastName`)}
                  placeholder="Last Name"
                />
                <Input
                  {...form.register(`sessions.${sessionIndex}.gymnasts.${gymnastIndex}.clubName`)}
                  placeholder="Club Name"
                />
                <div className="flex gap-2">
                  <Select onValueChange={(value) => form.setValue(`sessions.${sessionIndex}.gymnasts.${gymnastIndex}.level`, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {gymnastFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGymnast(gymnastIndex)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}