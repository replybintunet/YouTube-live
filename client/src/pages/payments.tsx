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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { paymentSchema, type PaymentData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Check, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Payments() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      plan: "5hours" as const,
      transactionCode: "",
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      const response = await apiRequest("POST", "/api/payment", data);
      return response.json();
    },
    onSuccess: () => {
      setErrorMessage("");
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Invalid transaction code. Please try again.");
    },
  });

  const plans = [
    {
      id: "5hours",
      name: "5 Hours",
      description: "Perfect for short streams",
      price: "$1",
      recommended: false,
    },
    {
      id: "12hours", 
      name: "12 Hours",
      description: "Extended streaming",
      price: "$2",
      recommended: false,
    },
    {
      id: "lifetime",
      name: "Lifetime",
      description: "Unlimited streaming",
      price: "$100",
      recommended: true,
    },
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    form.setValue("plan", planId as "5hours" | "12hours" | "lifetime");
    setShowPaymentForm(true);
  };

  const onSubmit = (data: PaymentData) => {
    paymentMutation.mutate(data);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      {/* Pricing Plans */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
          <p className="text-gray-600">Select the perfect streaming package for you</p>
        </div>
        
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "border-2 rounded-xl p-4 cursor-pointer transition-all relative",
                selectedPlan === plan.id
                  ? "border-sky-500 bg-sky-50"
                  : "border-gray-200 hover:border-sky-500"
              )}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.recommended && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  BEST VALUE
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                <div className="text-2xl font-bold text-sky-600">{plan.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Instructions */}
      {showPaymentForm && (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            <CreditCard className="text-sky-600 w-6 h-6 inline mr-2" />
            Payment Instructions
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <CreditCard className="text-blue-600 w-5 h-5" />
              <div>
                <p className="font-medium text-gray-800">PayPal</p>
                <p className="text-sm text-gray-600">Send payment to: payments@bintunet.com</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Smartphone className="text-green-600 w-5 h-5" />
              <div>
                <p className="font-medium text-gray-800">M-Pesa</p>
                <p className="text-sm text-gray-600">Send to: +254700123456</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="transactionCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Transaction Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter transaction code"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        {...field}
                      />
                    </FormControl>
                    <div className="mt-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg">
                      <p className="text-sm text-gray-700 font-medium mb-1">Demo Transaction Codes:</p>
                      <p className="text-xs text-gray-600">1 (5hrs), 2 (12hrs), 3 (lifetime)</p>
                      <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded">
                        <p className="text-sm font-semibold text-green-800">
                          Universal Access: <span className="font-mono bg-green-100 px-2 py-1 rounded text-green-900">bintunet</span>
                        </p>
                        <p className="text-xs text-green-600 mt-1">Works for any plan - no payment required!</p>
                      </div>
                    </div>
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
                disabled={paymentMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                {paymentMutation.isPending ? "Verifying..." : "Verify Payment"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
