// src/pages/PaymentCancel.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PaymentCancel = () => {
  const navigate = useNavigate();
  useEffect(() => {
    toast.error("Payment was cancelled.");
    setTimeout(() => {
      navigate("/student/dashboard");
    }, 2000);
  }, [navigate]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
        <p className="text-lg mb-2">Your payment was not completed.</p>
        <div className="animate-bounce text-red-500 text-6xl mb-4">❌</div>
        <p className="text-gray-500">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default PaymentCancel;