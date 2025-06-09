import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, HelpCircle } from "lucide-react";

const CancelPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  
  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-amber-700">Payment Canceled</CardTitle>
          <CardDescription>
            Your payment was canceled and you have not been charged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-md">
              <h3 className="font-medium flex items-center text-amber-800 mb-2">
                <HelpCircle className="h-4 w-4 mr-2" />
                Why was my payment canceled?
              </h3>
              <p className="text-amber-700 text-sm">
                Your payment might have been canceled for one of the following reasons:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-amber-700 space-y-1">
                <li>You chose to cancel the payment</li>
                <li>There was an issue with your payment method</li>
                <li>The payment process timed out</li>
                <li>There was a technical issue with the payment processor</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
              <p className="text-blue-700 text-sm">
                You can try again by returning to the course page and clicking the "Enroll" button.
                If you continue to experience issues, please contact our support team for assistance.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {courseId ? (
            <Button 
              onClick={() => navigate(`/course/${courseId}`)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Course
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/courses")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Courses
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CancelPage;
