import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Medal, Users, Trophy, BarChart3 } from "lucide-react";
import { RegistrationModal } from "@/components/registration-modal";
import { useState } from "react";

export default function Landing() {
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mx-auto h-20 w-20 bg-primary rounded-full flex items-center justify-center mb-6">
            <Medal className="text-white text-3xl" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">GymnasticsScore</h1>
          <p className="text-xl text-gray-600 mb-8">Competition Management System</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-blue-700"
            >
              Sign In
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowRegistration(true)}
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <Users className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multi-Role Access</h3>
              <p className="text-gray-600">
                Role-based access for observers, judges, clubs, and administrators with appropriate permissions.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <Trophy className="mx-auto h-12 w-12 text-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Scoring</h3>
              <p className="text-gray-600">
                Live score entry and instant results for gymnastics competitions across all apparatus.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8 pb-6">
              <BarChart3 className="mx-auto h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
              <p className="text-gray-600">
                Comprehensive statistics and performance tracking for individual gymnasts and clubs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Types */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Choose Your Account Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg hover:border-primary hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">Observer</h3>
              <p className="text-gray-600 text-sm mb-4">
                View scores and results. Perfect for parents, spectators, and fans.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• View competition results</li>
                <li>• Track gymnast performance</li>
                <li>• Instant approval</li>
              </ul>
            </div>

            <div className="p-6 border rounded-lg hover:border-primary hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">Judge</h3>
              <p className="text-gray-600 text-sm mb-4">
                Enter and edit scores. Requires administrator approval.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Enter competition scores</li>
                <li>• Edit existing scores</li>
                <li>• Requires approval</li>
              </ul>
            </div>

            <div className="p-6 border rounded-lg hover:border-primary hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">Club Administrator</h3>
              <p className="text-gray-600 text-sm mb-4">
                Manage competitions and events for your club.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create competitions</li>
                <li>• Manage sessions</li>
                <li>• View all results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <RegistrationModal 
        open={showRegistration} 
        onOpenChange={setShowRegistration}
      />
    </div>
  );
}
