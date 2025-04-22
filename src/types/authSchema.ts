import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "At least a character required!"),
  email: z.string({ required_error: "Email is required" }).email(),
  password: z
    .string({
      invalid_type_error: "Password must be a valid string.",
    })
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(20, { message: "Password must not exceed 20 characters." })
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]+$/,
      {
        message:
          "Password must include at least one letter, one number, and one special character.",
      }
    ),
  photoUrl: z.any().optional(),
});

export const loginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
  password: z
    .string({
      invalid_type_error: "Password must be a valid string.",
    })
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(20, { message: "Password must not exceed 20 characters." })
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]+$/,
      {
        message:
          "Password must include at least one letter, one number, and one special character.",
      }
    ),
});
