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

export const RegisterSchema = z
  .object({
    accountRole: z.enum(["school", "parent", "driver"]).default("school"),
    schoolname: z.string().optional(),
    full_name: z.string().optional(),
    email: z.string().email({
      message: "Invalid email",
    }),
    password: z.string().min(6, {
      message: "Password must be more 6 characters!",
    }),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    serviceAreas: z.string().optional(),
    carMake: z.string().optional(),
    carModel: z.string().optional(),
    carColor: z.string().optional(),
    plateNumber: z.string().optional(),
    vehicleCapacity: z.coerce.number().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.accountRole === "school" && !value.schoolname?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schoolname"],
        message: "School name is required!",
      });
    }

    if (value.accountRole !== "school") {
      if (!value.full_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["full_name"],
          message: "Full name is required!",
        });
      }
      if (!value.phoneNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phoneNumber"],
          message: "Phone number is required!",
        });
      }
      if (!value.address?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Address is required!",
        });
      }
    }

    if (value.accountRole === "driver") {
      for (const [field, message] of [
        ["serviceAreas", "At least one service area is required!"],
        ["carMake", "Car make is required!"],
        ["carModel", "Car model is required!"],
        ["carColor", "Car color is required!"],
        ["plateNumber", "Plate number is required!"],
      ] as const) {
        if (!value[field]?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message,
          });
        }
      }
      if (!value.vehicleCapacity || value.vehicleCapacity < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["vehicleCapacity"],
          message: "Vehicle capacity is required!",
        });
      }
    }
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

export const ParentChildSchema = z.object({
  fullName: z.string().min(1, {
    message: "Child name is required!",
  }),
  age: z.coerce.number().optional(),
  grade: z.string().optional(),
  address: z.string().optional(),
  image: z.string().optional(),
});

export const DriverRequestSchema = z.object({
  childId: z.string().min(1, {
    message: "Child is required!",
  }),
  driverId: z.string().min(1, {
    message: "Driver is required!",
  }),
  routeArea: z.string().optional(),
  note: z.string().optional(),
});

export const DriverVerificationSchema = z.object({
  image: z.string().min(1, {
    message: "Driver image is required!",
  }),
  phoneNumber: z.string().min(1, {
    message: "Phone number is required!",
  }),
  address: z.string().min(1, {
    message: "Address is required!",
  }),
  liveAddress: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  landmark: z.string().min(1, {
    message: "Landmark is required!",
  }),
  utilityBillUrl: z.string().min(1, {
    message: "Utility bill is required!",
  }),
  identityDocumentUrl: z.string().min(1, {
    message: "Passport page or NIN card is required!",
  }),
});
