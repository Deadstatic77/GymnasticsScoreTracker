import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Info, Medal, LogIn, UserPlus } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["observer", "judge", "club", "gymnast"]),
  clubAffiliation: z.string().optional(),
  judgeId: z.string().optional(),
  displayName: z.string().optional(),
  clubName: z.string().optional(),
  clubUsername: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "gymnast" && !data.clubAffiliation) {
    return false;
  }
  if (data.role === "judge" && (!data.judgeId || !data.displayName)) {
    return false;
  }
  if (data.role === "club" && (!data.clubName || !data.clubUsername || !data.location)) {
    return false;
  }
  return true;
}, {
  message: "Please fill in all required fields for your account type",
  path: ["clubAffiliation"], // Will show error on relevant field
});

export default function Auth() {
  const [, setLocation] = useLocation();
  const { loginMutation, registerMutation, user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [clubSearchOpen, setClubSearchOpen] = useState(false);

  // Fetch approved clubs for dropdown
  const { data: clubs = [] } = useQuery({
    queryKey: ["/api/users/role/club"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/role/club");
      const clubUsers = await response.json();
      return clubUsers
        .filter((club: any) => club.isApproved && club.clubName)
        .map((club: any) => club.clubName);
    },
    staleTime: 0,
  });

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
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

  const watchedRole = registerForm.watch("role");
  const watchedClubAffiliation = registerForm.watch("clubAffiliation");

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/")
    });
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => setLocation("/")
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Auth forms */}
          <div>
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
                    <Medal className="text-white text-2xl" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">GymnasticsScore</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  {/* Login Form */}
                  <TabsContent value="login" className="mt-6">
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <div>
                        <Label htmlFor="login-username">Username</Label>
                        <Input
                          id="login-username"
                          {...loginForm.register("username")}
                          className="mt-1"
                          placeholder="Your username"
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          {...loginForm.register("password")}
                          className="mt-1"
                          placeholder="Your password"
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Register Form */}
                  <TabsContent value="register" className="mt-6">
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      {/* Account Type */}
                      <div>
                        <Label className="text-sm font-medium">Account Type</Label>
                        <RadioGroup 
                          value={watchedRole} 
                          onValueChange={(value) => registerForm.setValue("role", value as any)}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2 border rounded p-3">
                            <RadioGroupItem value="observer" id="observer" />
                            <div className="flex-1">
                              <Label htmlFor="observer" className="font-medium cursor-pointer">Observer</Label>
                              <p className="text-xs text-gray-600">View scores (Parents, spectators)</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 border rounded p-3">
                            <RadioGroupItem value="judge" id="judge" />
                            <div className="flex-1">
                              <Label htmlFor="judge" className="font-medium cursor-pointer">Judge</Label>
                              <p className="text-xs text-gray-600">Enter scores (Requires approval)</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 border rounded p-3">
                            <RadioGroupItem value="club" id="club" />
                            <div className="flex-1">
                              <Label htmlFor="club" className="font-medium cursor-pointer">Club Admin</Label>
                              <p className="text-xs text-gray-600">Manage competitions</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 border rounded p-3">
                            <RadioGroupItem value="gymnast" id="gymnast" />
                            <div className="flex-1">
                              <Label htmlFor="gymnast" className="font-medium cursor-pointer">Gymnast</Label>
                              <p className="text-xs text-gray-600">Competing gymnast</p>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Account Credentials */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            {...registerForm.register("username")}
                            className="mt-1"
                            placeholder="Username"
                          />
                          {registerForm.formState.errors.username && (
                            <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.username.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...registerForm.register("email")}
                            className="mt-1"
                            placeholder="Email"
                          />
                          {registerForm.formState.errors.email && (
                            <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            {...registerForm.register("password")}
                            className="mt-1"
                            placeholder="Password"
                          />
                          {registerForm.formState.errors.password && (
                            <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            {...registerForm.register("confirmPassword")}
                            className="mt-1"
                            placeholder="Confirm"
                          />
                          {registerForm.formState.errors.confirmPassword && (
                            <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            {...registerForm.register("firstName")}
                            className="mt-1"
                          />
                          {registerForm.formState.errors.firstName && (
                            <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            {...registerForm.register("lastName")}
                            className="mt-1"
                          />
                          {registerForm.formState.errors.lastName && (
                            <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Role-specific fields */}
                      {watchedRole === "observer" && (
                        <div>
                          <Label htmlFor="clubAffiliation">Club Affiliation</Label>
                          <Select onValueChange={(value) => registerForm.setValue("clubAffiliation", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select your club..." />
                            </SelectTrigger>
                            <SelectContent>
                              {clubs.map((club) => (
                                <SelectItem key={club} value={club}>{club}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {watchedRole === "judge" && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="judgeId">Judge ID</Label>
                            <Input
                              id="judgeId"
                              {...registerForm.register("judgeId")}
                              className="mt-1"
                              placeholder="Official judge ID"
                            />
                          </div>
                          <div>
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                              id="displayName"
                              {...registerForm.register("displayName")}
                              className="mt-1"
                              placeholder="Name on scoresheets"
                            />
                          </div>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Judge accounts require approval before activation.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {watchedRole === "gymnast" && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="clubAffiliation">Club Affiliation *</Label>
                            <Popover open={clubSearchOpen} onOpenChange={setClubSearchOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={clubSearchOpen}
                                  className="w-full justify-between mt-1"
                                >
                                  {watchedClubAffiliation || "Select the club you represent..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search clubs..." />
                                  <CommandEmpty>No clubs found.</CommandEmpty>
                                  <CommandGroup>
                                    {clubs.map((club) => (
                                      <CommandItem
                                        key={club}
                                        value={club}
                                        onSelect={(currentValue) => {
                                          registerForm.setValue("clubAffiliation", currentValue === watchedClubAffiliation ? "" : currentValue);
                                          setClubSearchOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            watchedClubAffiliation === club ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {club}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {registerForm.formState.errors.clubAffiliation && (
                              <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.clubAffiliation.message}</p>
                            )}
                          </div>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Your club must approve your gymnast account before you can compete.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {watchedRole === "club" && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="clubName">Club Name</Label>
                            <Input
                              id="clubName"
                              {...registerForm.register("clubName")}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="clubUsername">Club Username</Label>
                            <Input
                              id="clubUsername"
                              {...registerForm.register("clubUsername")}
                              className="mt-1"
                              placeholder="Unique identifier"
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              {...registerForm.register("location")}
                              className="mt-1"
                              placeholder="City, Victoria"
                            />
                          </div>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Hero content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Track Gymnastics Scores in Real-Time
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                The comprehensive platform for gymnastics competitions in Victoria, Australia
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Medal className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Live Score Updates</h3>
                  <p className="text-gray-600">Real-time scoring for all gymnastics events and competitions</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Multiple User Types</h3>
                  <p className="text-gray-600">Observers, judges, club administrators, and gymnasts</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Comprehensive Results</h3>
                  <p className="text-gray-600">Detailed scorecards and competition results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}