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

export const DriverSchema = z.object({
  full_name: z.string().min(1, {
    message: "Name is required!",
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
  full_name: z.string().min(1, {
    message: "Name is required!",
  }),
  image: z.string().min(1, {
    message: "Image is required!",
  }),
  parentId: z.string().min(1, {
    message: "Parent name is required!",
  }),
  teacherId: z.string().min(1, {
    message: "Teacher is required!",
  }),
  busId: z.string().min(1, {
    message: "Bus is required!",
  }),
  grade: z.string().min(1, {
    message: "Grade is required!",
  }),
  address: z.string(),
  age: z.string(),
});

export const BusSchema = z.object({
  bus_number: z.string(),
  driver: z.string(),
  seat_number: z.string(),
  teacher: z.string(),
  student: z.string(),
  image: z.string(),
});
