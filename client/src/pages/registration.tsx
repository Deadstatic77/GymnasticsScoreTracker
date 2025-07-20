import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Info, Medal, ArrowLeft } from "lucide-react";

const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["observer", "judge", "club", "gymnast"]),
  // Observer fields
  clubAffiliation: z.string().optional(),
  // Judge fields
  judgeId: z.string().optional(),
  displayName: z.string().optional(),
  // Club fields
  clubName: z.string().optional(),
  clubUsername: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "observer" && !data.clubAffiliation) {
    return false;
  }
  if (data.role === "judge" && (!data.judgeId || !data.displayName)) {
    return false;
  }
  if (data.role === "club" && (!data.clubName || !data.clubUsername || !data.location)) {
    return false;
  }
  return true;
}, "Please fill in all required fields for your account type");

export default function Registration() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { registerMutation } = useAuth();

  const form = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "observer" as const,
      clubAffiliation: "",
      judgeId: "",
      displayName: "",
      clubName: "",
      clubUsername: "",
      location: "",
    },
  });

  const onSubmit = (data: z.infer<typeof registrationSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  const watchedRole = form.watch("role");

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    form.setValue("role", value as any);
  };

  const clubs = [
    "Melbourne Gymnastics Club",
    "Victorian Elite Gymnastics", 
    "Springboard Gymnastics",
    "Phoenix Gymnastics Academy",
    "Olympic Dreams Gymnastics",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="absolute top-8 left-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="mx-auto h-20 w-20 bg-primary rounded-full flex items-center justify-center mb-6">
            <Medal className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-xl text-gray-600">Join the GymnasticsScore platform</p>
        </div>

        {/* Registration Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Account Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Account Type</Label>
                <RadioGroup value={watchedRole} onValueChange={handleRoleChange}>
                  <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="observer" id="observer" />
                      <div className="flex-1">
                        <Label htmlFor="observer" className="font-medium cursor-pointer">Observer</Label>
                        <p className="text-sm text-gray-600">View scores only (Parents, spectators)</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="judge" id="judge" />
                      <div className="flex-1">
                        <Label htmlFor="judge" className="font-medium cursor-pointer">Judge</Label>
                        <p className="text-sm text-gray-600">View and enter scores (Requires approval)</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="club" id="club" />
                      <div className="flex-1">
                        <Label htmlFor="club" className="font-medium cursor-pointer">Club Administrator</Label>
                        <p className="text-sm text-gray-600">Manage competitions and events</p>
                      </div>
                    </div>
                  </Card>
                </RadioGroup>
              </div>

              {/* Account Information */}
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  className="mt-1"
                  placeholder="Choose a unique username"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register("password")}
                    className="mt-1"
                    placeholder="At least 6 characters"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...form.register("confirmPassword")}
                    className="mt-1"
                    placeholder="Confirm your password"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    className="mt-1"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    className="mt-1"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Observer Fields */}
              {watchedRole === "observer" && (
                <div>
                  <Label htmlFor="clubAffiliation">Club Affiliation</Label>
                  <Select onValueChange={(value) => form.setValue("clubAffiliation", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your club..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map((club) => (
                        <SelectItem key={club} value={club}>{club}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.clubAffiliation && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.clubAffiliation.message}</p>
                  )}
                </div>
              )}

              {/* Judge Fields */}
              {watchedRole === "judge" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="judgeId">Judge ID</Label>
                    <Input
                      id="judgeId"
                      {...form.register("judgeId")}
                      placeholder="Your official judge ID"
                      className="mt-1"
                    />
                    {form.formState.errors.judgeId && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.judgeId.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...form.register("displayName")}
                      placeholder="How you want to appear on scoresheets"
                      className="mt-1"
                    />
                    {form.formState.errors.displayName && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.displayName.message}</p>
                    )}
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Judge accounts require administrator approval before activation.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Club Fields */}
              {watchedRole === "club" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clubName">Club Name</Label>
                    <Input
                      id="clubName"
                      {...form.register("clubName")}
                      className="mt-1"
                    />
                    {form.formState.errors.clubName && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.clubName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="clubUsername">Club Username</Label>
                    <Input
                      id="clubUsername"
                      {...form.register("clubUsername")}
                      placeholder="Unique club identifier"
                      className="mt-1"
                    />
                    {form.formState.errors.clubUsername && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.clubUsername.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="location">Location (Victoria, Australia)</Label>
                    <Input
                      id="location"
                      {...form.register("location")}
                      placeholder="City/Suburb"
                      className="mt-1"
                    />
                    {form.formState.errors.location && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-blue-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
