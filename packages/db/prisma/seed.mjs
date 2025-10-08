// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { addHours } from "date-fns";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a school user (acts as ADMIN)
  const school = await db.user.upsert({
    where: { email: "winozee@gmail.com" },
    update: {},
    create: {
      email: "school@test.com",
      name: "Test School",
      role: "ADMIN",
    },
  });

  // Create a bus route
  const route = await db.route.upsert({
    where: { id: "seed-route" },
    update: {},
    create: {
      id: "seed-route",
      route_name: "Route A",
      route_description: "Morning route for testing",
      schoolId: school.id,
    },
  });

  // Create a bus
  const bus = await db.buses.upsert({
    where: { bus_number: "BUS-101" },
    update: {},
    create: {
      bus_product_name: "BlueBird",
      bus_number: "BUS-101",
      seat_number: 40,
      color: "Yellow",
      schoolId: school.id,
      routeId: route.id,
    },
  });

  // Create multiple teachers
  const teachers = await Promise.all([
    db.teacher.upsert({
      where: { email: "teacher1@test.com" },
      update: {},
      create: {
        role: "TEACHER",
        full_name: "John Doe",
        email: "teacher1@test.com",
        password: "hashedpassword123",
        schoolId: school.id,
        busId: bus.id,
        address: "123 Teacher St",
      },
    }),
    db.teacher.upsert({
      where: { email: "teacher2@test.com" },
      update: {},
      create: {
        role: "TEACHER",
        full_name: "Mary Johnson",
        email: "teacher2@test.com",
        password: "hashedpassword789",
        schoolId: school.id,
        address: "456 Teacher St",
      },
    }),
  ]);

  // Create multiple parents
  const parents = await Promise.all([
    db.parent.upsert({
      where: { email: "abusomwansantos@gmail.com" },
      update: {},
      create: {
        role: "PARENT",
        full_name: "Jane Smith",
        email: "abusomwansantos@gmail.com",
        password: "hashedpassword456",
        schoolId: school.id,
        address: "456 Parent Ave",
      },
    }),
    db.parent.upsert({
      where: { email: "parent2@test.com" },
      update: {},
      create: {
        role: "PARENT",
        full_name: "David Brown",
        email: "parent2@test.com",
        password: "hashedpassword111",
        schoolId: school.id,
        address: "789 Parent Blvd",
      },
    }),
  ]);

  // Create multiple students belonging to different parents/teachers
  const students = await Promise.all([
    db.student.upsert({
      where: { id: "seed-student1" },
      update: {},
      create: {
        id: "seed-student1",
        full_name: "Alex Smith",
        grade: "5",
        gender: "M",
        age: 10,
        address: "456 Parent Ave",
        parentId: parents[0].id,
        schoolId: school.id,
        teacherId: teachers[0].id,
        busId: bus.id,
      },
    }),
    db.student.upsert({
      where: { id: "seed-student2" },
      update: {},
      create: {
        id: "seed-student2",
        full_name: "Emma Brown",
        grade: "3",
        gender: "F",
        age: 8,
        address: "789 Parent Blvd",
        parentId: parents[1].id,
        schoolId: school.id,
        teacherId: teachers[1].id,
        busId: bus.id,
      },
    }),
  ]);

  // Create a driver for the bus
  const driver = await db.driver.upsert({
    where: { email: "driver@test.com" },
    update: {},
    create: {
      full_name: "Mike Johnson",
      email: "driver@test.com",
      phoneNumber: "1234567890",
      address: "789 Driver Rd",
      schoolId: school.id,
      busId: bus.id,
    },
  });

  // Create a notification
  const notification = await db.notification.create({
    data: {
      notificationJson: JSON.stringify({ message: "Bus will arrive in 10 minutes." }),
    },
  });

  // Link notification to both parents
  await Promise.all(
    parents.map((p) =>
      db.parentNotification.upsert({
        where: { parentId: p.id },
        update: {},
        create: {
          parentId: p.id,
          notificationId: notification.id,
        },
      })
    )
  );

  // Create pickup records for each student
  await Promise.all([
    db.pickup.create({
      data: {
        studentId: students[0].id,
        teacherId: teachers[0].id,
        parentId: parents[0].id,
        confirmedBy: "system-seed",
      },
    }),
    db.pickup.create({
      data: {
        studentId: students[1].id,
        teacherId: teachers[1].id,
        parentId: parents[1].id,
        confirmedBy: "system-seed",
      },
    }),
  ]);

  // Create a verification token (valid for 1 hour) for parent1
  await db.verificationToken.upsert({
    where: { token: "seed-token" },
    update: {},
    create: {
      email: "parent1@test.com",
      role: "parent",
      token: "seed-token",
      expires: addHours(new Date(), 1),
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
