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
  busId: BusProps;
};

export type StudentProps = {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  grade: string;
  address: string;
  bus: BusProps;
  image: string;
  attendance: string;
  status: string;
  presence: string;
};

export type SelectProps = {
  placeholder: string;
  label?: string;
  data: BusProps[];
  studentId: string;
};
