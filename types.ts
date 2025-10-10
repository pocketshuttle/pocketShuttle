// import { StudentAttendance } from "@prisma/client";

import { StudentAttendance } from "./packages/db/client";

export type DriversProps = {
  _id: string;
  id: string;
  full_name: string;
  email: string;
  phoneNumber: string;
  address: string;
  image: string;
  bus: BusProps;
};

export type BusProps = {
  id: string;
  shchool_id: string;
  bus_product_name: string;
  color: string;
  seat_number: string;
  driver: DriversProps;
  bus_number: string;
  students: StudentProps[];
  teacher: TeacherProps;
  route: RouteTypes;
  status: string;
};

export type RouteTypes = {
  route_name: string;
};

export type TeacherProps = {
  id: string;
  full_name: string;
  email: string;
  phoneNumber: string;
  address: string;
  image: string;
  bus: BusProps;
  weeklyTotal?: number;
};

export type ParentProps = {
  id: string;
  full_name: string;
  email: string;
  phoneNumber: string;
  address: string;
  addressCoords?: { latitude: number; longitude: number };
  image: string;
  bus: BusProps;
  Student: StudentProps[];
};

export type StudentProps = {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  grade: string;
  address: string;
  bus?: BusProps;
  image: string;
  attendance: StudentAttendance | null;
  status: string;
  presence: string;
  parent?: ParentProps;
  parentId?: string;
};

export type SelectProps = {
  placeholder: string;
  label?: string;
  data: BusProps[];
  studentId: string;
};
