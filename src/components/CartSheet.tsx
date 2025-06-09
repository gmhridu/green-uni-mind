import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingBag, X, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { removeFromCart, clearCart } from "@/redux/features/cart/cartSlice";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useCreateCheckoutSessionMutation } from "@/redux/features/payment/payment.api";
import { toast } from "sonner";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useEffect } from "react";
import { loadUserCart } from "@/redux/features/cart/cartSlice";
import { Card } from "./ui/card";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { USER_ROLE } from "@/constants/global";
import { IEnrolledCourse } from "@/types";

const CartSheet = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useAppSelector((state) => state.cart.items);
  const { data: userData } = useGetMeQuery(undefined);
  const user = useAppSelector(selectCurrentUser);
  const [createCheckoutSession, { isLoading }] =
    useCreateCheckoutSessionMutation();

  // Load user's cart when component mounts or user changes
  useEffect(() => {
    if (userData?.data?._id) {
      dispatch(loadUserCart(userData.data._id));
    }
  }, [dispatch, userData?.data?._id]);

  // Add this useEffect to refresh cart when returning from payment
  useEffect(() => {
    // Check if user is returning from payment success page
    if (location.pathname === "/" && userData?.data?._id) {
      dispatch(loadUserCart(userData.data._id));
    }
  }, [location.pathname, dispatch, userData?.data?._id]);

  const handleRemoveFromCart = (courseId: string) => {
    if (userData?.data?._id) {
      dispatch(removeFromCart({ courseId, userId: userData.data._id }));
    }
  };

  const handleCheckout = async () => {
    if (!userData?.data?._id) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      const course = cartItems[0];
      if (!course?._id) {
        toast.error("Invalid course data");
        return;
      }

      // Check if student is already enrolled in this course
      const isAlreadyEnrolled = userData?.data?.enrolledCourses?.some(
        (enrolledCourse: IEnrolledCourse) => enrolledCourse.courseId === course._id
      );

      if (isAlreadyEnrolled) {
        toast.error("You are already enrolled in this course");
        // Remove the course from cart since user is already enrolled
        if (userData?.data?._id) {
          dispatch(removeFromCart({ courseId: course._id, userId: userData.data._id }));
        }
        return;
      }

      console.log("Sending checkout request with data:", {
        courseId: course._id,
        amount: course.coursePrice || 0
      });

      const response = await createCheckoutSession({
        courseId: course._id,
        amount: course.coursePrice || 0,
      }).unwrap();

      console.log("Checkout response:", response);

      // The response from the server is nested inside a data property
      const checkoutUrl = response?.data?.url;

      if (!checkoutUrl) {
        console.error("Invalid response from server:", response);
        toast.error("Failed to get checkout URL from server");
        return;
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      // Handle error with proper type checking
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "Payment failed. Please try again.";

      toast.error(errorMessage);
    }
  };

  // Filter out any null or invalid items
  const validCartItems = cartItems.filter(
    (item) => item && item._id && item.title
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        {user?.role === USER_ROLE.STUDENT ? (
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {validCartItems.length > 0 && (
              <Badge
                variant="outline"
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 bg-green-500 text-white flex items-center justify-center"
              >
                {validCartItems.length}
              </Badge>
            )}
          </Button>
        ) : null}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {validCartItems.length === 0 ? (
            <p className="text-center text-gray-500">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {validCartItems.map((item) => (
                <Card
                  key={item._id}
                  className="flex items-center justify-between border-b p-3 space-x-3"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={item.courseThumbnail}
                      alt={item.title}
                      className="w-10 h-10 rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      ${item.coursePrice?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFromCart(item._id!)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
              <div className="flex justify-between items-center pt-4">
                <span className="font-medium">
                  Total: $
                  {validCartItems
                    .reduce((sum, item) => sum + (item.coursePrice || 0), 0)
                    .toFixed(2)}
                </span>
                <Button onClick={handleCheckout} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Checkout with stripe"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
