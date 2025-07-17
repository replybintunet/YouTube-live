import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Radio, LogIn } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accessCode: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: () => {
      setErrorMessage("");
      setLocation("/dashboard"); // ✅ updated to dashboard
    },
    onError: (error: any) => {
      setErrorMessage(
        error.message || "Invalid access code. Please try again."
      );
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 card-hover">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Radio className="text-white w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-lg">
            Enter your access code to continue
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accessCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Access Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter access code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full btn-primary text-white font-semibold py-3 px-6 rounded-xl"
              disabled={loginMutation.isPending}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Demo access code:{" "}
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              bintunet
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}