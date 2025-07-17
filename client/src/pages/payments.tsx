import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Payments() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (code.trim().toLowerCase() === "bintunet") {
      setError("");
      setLocation("/dashboard");
    } else {
      setError("Invalid access code. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-center mb-4">Enter Access Code</h2>
        <Input
          placeholder="Enter access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-4"
        />
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleSubmit} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}