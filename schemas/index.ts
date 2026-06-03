import * as z from "zod";
{
  /**
Define a schema for login validation using Zod
 The LoginSchema ensures that the input object contains:
- An 'email' field which must be a valid email string
- A 'password' field which must be a non-empty string

@Usage:
   This schema can be used to validate user input for a login form
*/
}
export const LoginSchema = z.object({
  email: z.string().email({
    message: "Invalid email",
  }),
  password: z.string().min(1, {
    message: "Password is Required!",
  }),
  role: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});
export const ResetPasswordSchema = z.object({
  email: z.string().email({
    message: "Invalid email",
  }),
  role: z.string().min(2, {
    message: "Role is required",
  }),
});
export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Password is Required!",
  }),
  role: z.string().optional(),
});

export const RegisterSchema = z.object({
  schoolname: z.string().min(1, {
    message: "Name is required!",
  }),
  email: z.string().email({
    message: "Invalid email",
  }),
  password: z.string().min(6, {
    message: "Password must be more 6 characters!",
  }),
});

export const TeacherSchema = z.object({
  school_id: z.string().min(1, {
    message: "userId is Required",
  }),
  full_name: z.string().min(1, {
    message: "Name is required!",
  }),
  image: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  password: z.string().min(6, {
    message: "Password must be more 6 characters!",
  }),
  email: z.string().email({
    message: "Invalid email",
  }),
  phoneNumber: z.string().min(11, {
    message: "Phone number must be 11 numbers",
  }),
  address: z.string().min(1, {
    message: "Please add the teacher's address",
  }),

  busId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  studentId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  role: z.string().min(2, {
    message: "Role is required",
  }),
});

export const DriverSchema = z.object({
  school_id: z.string().min(1, {
    message: "Creator is required",
  }),
  full_name: z.string().min(1, {
    message: "Full Name is required!",
  }),
  image: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  email: z
    .string()
    .email({
      message: "Invalid email",
    })
    .optional(),
  phoneNumber: z.string().min(11, {
    message: "Phone number must be 11 numbers",
  }),
  address: z.string().min(1, {
    message: "Please add the teacher's address",
  }),
  busId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});

export const ParentSchema = z.object({
  school_id: z
    .string()
    .min(1, {
      message: "Id is required!",
    })
    .transform((value) => (value === "" ? undefined : value)),
  full_name: z.string().min(1, {
    message: "Name is required!",
  }),
  image: z
    .string()
    .min(1, {
      message: "Image is required!",
    })
    .optional(),
  password: z.string().min(6, {
    message: "Password must be more 6 characters!",
  }),
  role: z.string().min(2, {
    message: "Role is required",
  }),
  email: z.string().email({
    message: "Invalid email",
  }),
  phoneNumber: z.string().min(11, {
    message: "Phone number must be 11 numbers",
  }),
  address: z.string().min(1, {
    message: "Please add the teacher's address",
  }),
  addressCoords: z
    .object({
      latitude: z.number().min(-90).max(90, { message: "Invalid latitude" }),
      longitude: z
        .number()
        .min(-180)
        .max(180, { message: "Invalid longitude" }),
    })
    .optional(),
  studentId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});

export const StudentSchema = z.object({
  school_id: z.string().min(1, {
    message: "creator Id is Required",
  }),
  full_name: z.string().min(1, {
    message: "Name is required!",
  }),
  age: z.number().min(1, { message: "Seat number must be a positive number" }),
  image: z.string().optional(),
  parentId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  teacherId: z.string().optional(),
  driverId: z
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  busId: z
    .string()
    .transform((value) => (value === "" ? null : value))
    .optional(),
  gender: z.string(),
  grade: z.string().optional(),
  address: z.string(),
});

export const BusSchema = z.object({
  school_id: z.string(),
  bus_number: z.string(),
  driver: z.string().optional(),
  seat_number: z
    .number()
    .min(1, { message: "Seat number must be a positive number" }),
  teacher: z.string().optional(),
  student: z.string().optional(),
  route: z.string().optional(),
  color: z.string().optional(),
  bus_product_name: z.string(),
});

export const RouteSchema = z.object({
  school_id: z.string(),
  route_name: z.string().min(1, {
    message: "Please add A Route in Alphabetical ",
  }),
  route_description: z.string(),
});
