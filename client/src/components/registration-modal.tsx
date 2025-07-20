import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegistrationModal({ open, onOpenChange }: RegistrationModalProps) {
  // Instead of trying to register directly, redirect to Replit auth first
  const handleRegistration = (role: string) => {
    // Store the selected role in localStorage so we can use it after auth
    localStorage.setItem('pendingRegistrationRole', role);
    // Redirect to Replit auth
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">
            To create an account, you'll need to sign in with Replit first, then complete your profile setup.
          </p>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Choose your account type, then you'll be redirected to sign in with Replit.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={() => handleRegistration('observer')} 
              variant="outline" 
              className="w-full text-left h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Observer</div>
                <div className="text-sm text-gray-600">View scores only (Parents, spectators)</div>
              </div>
            </Button>

            <Button 
              onClick={() => handleRegistration('judge')} 
              variant="outline" 
              className="w-full text-left h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Judge</div>
                <div className="text-sm text-gray-600">Enter scores (Requires approval)</div>
              </div>
            </Button>

            <Button 
              onClick={() => handleRegistration('club')} 
              variant="outline" 
              className="w-full text-left h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Club Administrator</div>
                <div className="text-sm text-gray-600">Manage competitions and events</div>
              </div>
            </Button>

            <Button 
              onClick={() => handleRegistration('gymnast')} 
              variant="outline" 
              className="w-full text-left h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Gymnast</div>
                <div className="text-sm text-gray-600">Competing gymnasts (Requires club approval)</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}