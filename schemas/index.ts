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
  userId: z.string().min(1, {
    message: "userId is Required",
  }),
  full_name: z.string().min(1, {
    message: "Name is required!",
  }),
  image: z.string().min(1, {
    message: "Image is required!",
  }),
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
  busId: z.string().optional(),
  studentId: z.string().optional(),
});

export const DriverSchema = z.object({
  creator: z.string().min(1, {
    message: "Creator is required",
  }),
  full_name: z.string().min(1, {
    message: "Full Name is required!",
  }),
  image: z.string().min(1, {
    message: "Image is required!",
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
  busId: z.string(),
  studentId: z.string(),
});

export const ParentSchema = z.object({
  full_name: z.string().min(1, {
    message: "Name is required!",
  }),
  image: z.string().min(1, {
    message: "Image is required!",
  }),
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
  busId: z.string(),
  studentId: z.string(),
});

export const StudentSchema = z.object({
  creator: z.string().min(1, {
    message: "creator Id is Required",
  }),
  full_name: z.string().min(1, {
    message: "Name is required!",
  }),
  image: z
    .string()
    .min(1, {
      message: "Image is required!",
    })
    .optional(),
  parentId: z
    .string()
    .min(1, {
      message: "Parent name is required!",
    })
    .optional(),
  teacherId: z
    .string()
    .min(1, {
      message: "Teacher is required!",
    })
    .optional(),
  busId: z
    .string()
    .min(1, {
      message: "Bus is required!",
    })
    .optional(),
  gender: z.string(),
  grade: z.string().min(1, {
    message: "Grade is required!",
  }),
  address: z.string(),
  age: z.string().transform((val) => parseInt(val, 10)),
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
  color: z.string().optional(),
  bus_product_name: z.string(),
});
