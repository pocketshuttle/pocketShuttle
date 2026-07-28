import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SCHOOL_ID = "seed-school-pocketshuttle";
const PASSWORD = "np";

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function minutesAgo(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
}

async function seedPlans() {
  const plans = [
    {
      id: "seed-plan-free",
      code: "FREE_SCHOOL",
      name: "Free School",
      price: 0,
      duration: 30,
      description: "Starter plan for testing school commute operations.",
      features: ["3 buses", "basic reports", "parent alerts"],
      entitlements: {
        basic_live_location: true,
        pickup_dropoff_status: true,
        emergency_alerts: true,
        push_notifications: true,
        max_buses: 1,
        max_students: 30,
        max_staff: 3,
        history_hours: 24,
      },
      audience: "SCHOOL",
      tier: "FREE",
      isPublic: true,
    },
    {
      id: "seed-plan-pro",
      code: "SCHOOL_PRO",
      name: "School Pro",
      price: 25000,
      duration: 30,
      description: "Operational plan with reports, route visibility, and notifications.",
      features: ["fleet dashboard", "pickup reports", "trip events"],
      entitlements: {
        basic_live_location: true,
        emergency_alerts: true,
        fleet_map: true,
        analytics: true,
        csv_import: true,
        csv_export: true,
        max_buses: 25,
        max_students: 1000,
        max_staff: 100,
        history_hours: 8760,
      },
      audience: "SCHOOL",
      tier: "PRO",
    },
    {
      id: "seed-plan-enterprise",
      code: "ENTERPRISE",
      name: "Enterprise",
      price: 75000,
      duration: 30,
      description: "Advanced plan for large schools and transport operators.",
      features: ["multi-branch", "audit logs", "priority support"],
      entitlements: {
        basic_live_location: true,
        emergency_alerts: true,
        multiple_branches: true,
        custom_roles: true,
        api_access: true,
        outbound_webhooks: true,
        max_buses: null,
        max_students: null,
        max_staff: null,
        history_hours: null,
      },
      audience: "ENTERPRISE",
      tier: "ENTERPRISE",
    },
  ];

  return Promise.all(
    plans.map(({ id, ...plan }) =>
      db.plan.upsert({
        where: { code: plan.code },
        update: plan,
        create: { id, ...plan },
      })
    )
  );
}

async function seedSchool(passwordHash) {
  return db.user.upsert({
    where: { id: SCHOOL_ID },
    update: {
      name: "PocketShuttle Demo School",
      email: "admin@pocketshuttle.test",
      emailVerified: new Date(),
      image: "/images/school.png",
      role: "ADMIN",
      password: passwordHash,
    },
    create: {
      id: SCHOOL_ID,
      name: "PocketShuttle Demo School",
      email: "admin@pocketshuttle.test",
      emailVerified: new Date(),
      image: "/images/school.png",
      role: "ADMIN",
      password: passwordHash,
    },
  });
}

async function seedRoutes(schoolId) {
  const routes = [
    {
      id: "seed-route-north",
      route_name: "North Gate Loop",
      route_description: "Morning pickup through North Gate, Library Road, and Lakeview Estate.",
      schoolId,
    },
    {
      id: "seed-route-east",
      route_name: "East Campus Express",
      route_description: "Express shuttle through East Campus, Market Road, and Palm Avenue.",
      schoolId,
    },
    {
      id: "seed-route-west",
      route_name: "West Garden Line",
      route_description: "Afternoon route through West Garden, Cedar Close, and Stadium Road.",
      schoolId,
    },
  ];

  return Promise.all(
    routes.map((route) =>
      db.route.upsert({
        where: { id: route.id },
        update: route,
        create: route,
      })
    )
  );
}

async function seedBuses(schoolId, routes) {
  const buses = [
    {
      id: "seed-bus-alpha",
      bus_product_name: "Toyota Coaster",
      bus_number: "PS-BUS-101",
      seat_number: 28,
      availableSeats: 27,
      color: "yellow",
      schoolId,
      routeId: routes[0].id,
    },
    {
      id: "seed-bus-beta",
      bus_product_name: "Mercedes Sprinter",
      bus_number: "PS-BUS-202",
      seat_number: 18,
      availableSeats: 18,
      color: "white",
      schoolId,
      routeId: routes[1].id,
    },
    {
      id: "seed-bus-gamma",
      bus_product_name: "Hyundai County",
      bus_number: "PS-BUS-303",
      seat_number: 24,
      availableSeats: 23,
      color: "blue",
      schoolId,
      routeId: routes[2].id,
    },
  ];

  return Promise.all(
    buses.map((bus) =>
      db.buses.upsert({
        where: { id: bus.id },
        update: bus,
        create: bus,
      })
    )
  );
}

async function seedTeachers(schoolId, buses, passwordHash) {
  const teachers = [
    {
      id: "seed-teacher-amelia",
      teacherId: "TCH-101",
      role: "teacher",
      full_name: "Amelia Hart",
      email: "teacher1@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08010000001",
      address: "12 North Gate Road",
      schoolId,
      busId: buses[0].id,
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-teacher-grace",
      teacherId: "TCH-202",
      role: "teacher",
      full_name: "Grace Wilson",
      email: "teacher2@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08010000002",
      address: "44 East Campus Drive",
      schoolId,
      busId: buses[1].id,
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-teacher-helen",
      teacherId: "TCH-303",
      role: "teacher",
      full_name: "Helen Moore",
      email: "teacher3@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08010000003",
      address: "7 West Garden Close",
      schoolId,
      busId: buses[2].id,
      image: "/images/avatar.jpg",
    },
  ];

  return Promise.all(
    teachers.map((teacher) =>
      db.teacher.upsert({
        where: { id: teacher.id },
        update: teacher,
        create: teacher,
      })
    )
  );
}

async function seedDrivers(schoolId, buses) {
  const drivers = [
    {
      id: "seed-driver-marcus",
      driverId: "DRV-101",
      accountType: "SCHOOL_MANAGED",
      full_name: "Marcus Reed",
      email: "driver1@pocketshuttle.test",
      emailVerified: new Date(),
      phoneNumber: "08020000001",
      address: "19 Transit Lane",
      schoolId,
      busId: buses[0].id,
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-driver-daniel",
      driverId: "DRV-202",
      accountType: "SCHOOL_MANAGED",
      full_name: "Daniel Okafor",
      email: "driver2@pocketshuttle.test",
      emailVerified: new Date(),
      phoneNumber: "08020000002",
      address: "22 Shuttle Avenue",
      schoolId,
      busId: buses[1].id,
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-driver-samuel",
      driverId: "DRV-303",
      accountType: "SCHOOL_MANAGED",
      full_name: "Samuel Briggs",
      email: "driver3@pocketshuttle.test",
      emailVerified: new Date(),
      phoneNumber: "08020000003",
      address: "9 Terminal Street",
      schoolId,
      busId: buses[2].id,
      image: "/images/avatar.jpg",
    },
  ];

  return Promise.all(
    drivers.map((driver) =>
      db.driver.upsert({
        where: { id: driver.id },
        update: driver,
        create: driver,
      })
    )
  );
}

async function seedParents(schoolId, passwordHash) {
  const parents = [
    {
      id: "seed-parent-olivia",
      role: "parent",
      accountType: "SCHOOL_MANAGED",
      full_name: "Olivia Carter",
      email: "parent1@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08030000001",
      address: "4 Library Road",
      addressCoords: { latitude: 6.5244, longitude: 3.3792 },
      schoolId,
      busId: "seed-bus-alpha",
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-parent-david",
      role: "parent",
      accountType: "SCHOOL_MANAGED",
      full_name: "David Evans",
      email: "parent2@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08030000002",
      address: "18 Market Road",
      addressCoords: { latitude: 6.5355, longitude: 3.3541 },
      schoolId,
      busId: "seed-bus-beta",
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-parent-maya",
      role: "parent",
      accountType: "SCHOOL_MANAGED",
      full_name: "Maya Bennett",
      email: "parent3@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08030000003",
      address: "33 Cedar Close",
      addressCoords: { latitude: 6.45, longitude: 3.3903 },
      schoolId,
      busId: "seed-bus-gamma",
      image: "/images/avatar.jpg",
    },
  ];

  return Promise.all(
    parents.map((parent) =>
      db.parent.upsert({
        where: { id: parent.id },
        update: parent,
        create: parent,
      })
    )
  );
}

async function seedStandaloneFamilies(passwordHash) {
  const drivers = [
    {
      id: "seed-standalone-driver-ada",
      driverId: "SDRV-401",
      role: "driver",
      accountType: "STANDALONE",
      full_name: "Ada Nwosu",
      email: "standalone.driver1@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08040000001",
      address: "14 Admiralty Way, Lekki",
      liveAddress: { latitude: 6.4474, longitude: 3.4723 },
      landmark: "Lekki Phase 1",
      serviceAreas: ["Lekki", "Ikoyi", "Victoria Island"],
      carMake: "Toyota",
      carModel: "Sienna",
      carColor: "Silver",
      plateNumber: "LND-401-SD",
      vehicleCapacity: 7,
      verificationStatus: "VERIFIED",
      schoolId: null,
      busId: null,
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-standalone-driver-tunde",
      driverId: "SDRV-402",
      role: "driver",
      accountType: "STANDALONE",
      full_name: "Tunde Bello",
      email: "standalone.driver2@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08040000002",
      address: "8 Isaac John Street, Ikeja",
      liveAddress: { latitude: 6.6018, longitude: 3.3515 },
      landmark: "GRA Ikeja",
      serviceAreas: ["Ikeja", "Maryland", "Yaba"],
      carMake: "Honda",
      carModel: "Pilot",
      carColor: "Black",
      plateNumber: "LSD-402-SD",
      vehicleCapacity: 6,
      verificationStatus: "VERIFIED",
      schoolId: null,
      busId: null,
      image: "/images/avatar.jpg",
    },
  ];

  const createdDrivers = await Promise.all(
    drivers.map((driver) =>
      db.driver.upsert({
        where: { id: driver.id },
        update: driver,
        create: driver,
      })
    )
  );

  await Promise.all(
    createdDrivers.map((driver, index) =>
      db.driverShareProfile.upsert({
        where: { driverId: driver.id },
        update: {
          searchableEmail: driver.email,
          searchablePhone: driver.phoneNumber,
        },
        create: {
          id: `seed-standalone-driver-share-${index + 1}`,
          driverId: driver.id,
          shareId: `PKD-DEMO0${index + 1}`,
          searchableEmail: driver.email,
          searchablePhone: driver.phoneNumber,
        },
      })
    )
  );

  const parents = [
    {
      id: "seed-standalone-parent-chioma",
      role: "parent",
      accountType: "STANDALONE",
      full_name: "Chioma Okeke",
      email: "standalone.parent1@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08050000001",
      address: "21 Fola Osibo Road, Lekki",
      addressCoords: { latitude: 6.4379, longitude: 3.4697 },
      schoolId: null,
      busId: null,
      image: "/images/avatar.jpg",
    },
    {
      id: "seed-standalone-parent-kunle",
      role: "parent",
      accountType: "STANDALONE",
      full_name: "Kunle Adeyemi",
      email: "standalone.parent2@pocketshuttle.test",
      emailVerified: new Date(),
      password: passwordHash,
      phoneNumber: "08050000002",
      address: "5 Oduduwa Crescent, Ikeja",
      addressCoords: { latitude: 6.5887, longitude: 3.3532 },
      schoolId: null,
      busId: null,
      image: "/images/avatar.jpg",
    },
  ];

  const createdParents = await Promise.all(
    parents.map((parent) =>
      db.parent.upsert({
        where: { id: parent.id },
        update: parent,
        create: parent,
      })
    )
  );

  const children = [
    {
      id: "seed-standalone-child-amara",
      parentId: createdParents[0].id,
      fullName: "Amara Okeke",
      age: 10,
      grade: "Grade 5",
      address: parents[0].address,
      schoolCoords: { latitude: 6.4698, longitude: 3.5852 },
      pickupNote: "Call the parent when you reach the estate gate.",
      image: "/images/kid.png",
    },
    {
      id: "seed-standalone-child-chidi",
      parentId: createdParents[0].id,
      fullName: "Chidi Okeke",
      age: 7,
      grade: "Grade 2",
      address: parents[0].address,
      schoolCoords: { latitude: 6.4698, longitude: 3.5852 },
      pickupNote: "Pickup together with Amara.",
      image: "/images/kid.png",
    },
    {
      id: "seed-standalone-child-zainab",
      parentId: createdParents[1].id,
      fullName: "Zainab Adeyemi",
      age: 11,
      grade: "Grade 6",
      address: parents[1].address,
      schoolCoords: { latitude: 6.5729, longitude: 3.3664 },
      pickupNote: "Use the main school entrance.",
      image: "/images/kid.png",
    },
    {
      id: "seed-standalone-child-femi",
      parentId: createdParents[1].id,
      fullName: "Femi Adeyemi",
      age: 8,
      grade: "Grade 3",
      address: parents[1].address,
      schoolCoords: { latitude: 6.5729, longitude: 3.3664 },
      pickupNote: "Pickup together with Zainab.",
      image: "/images/kid.png",
    },
  ];

  await Promise.all(
    children.map((child) =>
      db.parentChild.upsert({
        where: { id: child.id },
        update: child,
        create: child,
      })
    )
  );

  return { drivers: createdDrivers, parents: createdParents };
}

async function seedStudents(schoolId, buses, teachers, parents) {
  const students = [
    {
      id: "seed-student-noah",
      full_name: "Noah Carter",
      grade: "Grade 5",
      gender: "Male",
      age: 10,
      address: "4 Library Road",
      attendance: "PRESENT",
      status: "PICKED",
      presence: "IN_BUS",
      parentId: parents[0].id,
      schoolId,
      teacherId: teachers[0].id,
      busId: buses[0].id,
      image: "/images/kid.png",
    },
    {
      id: "seed-student-emma",
      full_name: "Emma Evans",
      grade: "Grade 3",
      gender: "Female",
      age: 8,
      address: "18 Market Road",
      attendance: "PRESENT",
      status: "DROPPED",
      presence: "AT_SCHOOL",
      parentId: parents[1].id,
      schoolId,
      teacherId: teachers[1].id,
      busId: buses[1].id,
      image: "/images/kid.png",
    },
    {
      id: "seed-student-leo",
      full_name: "Leo Bennett",
      grade: "Grade 4",
      gender: "Male",
      age: 9,
      address: "33 Cedar Close",
      attendance: "PRESENT",
      status: "PICKED",
      presence: "ON_THE_WAY",
      parentId: parents[2].id,
      schoolId,
      teacherId: teachers[2].id,
      busId: buses[2].id,
      image: "/images/kid.png",
    },
  ];

  return Promise.all(
    students.map((student) =>
      db.student.upsert({
        where: { id: student.id },
        update: student,
        create: student,
      })
    )
  );
}

async function seedAccessInvites(schoolId, teachers, parents, passwordHash) {
  const invites = [
    ...teachers.map((teacher, index) => ({
      id: `seed-new-user-teacher-${index + 1}`,
      email: teacher.email,
      password: passwordHash,
      teacherId: teacher.id,
      parentId: null,
      schoolId,
      userId: null,
    })),
    ...parents.map((parent, index) => ({
      id: `seed-new-user-parent-${index + 1}`,
      email: parent.email,
      password: passwordHash,
      teacherId: null,
      parentId: parent.id,
      schoolId,
      userId: null,
    })),
  ];

  return Promise.all(
    invites.map((invite) =>
      db.newUser.upsert({
        where: { id: invite.id },
        update: invite,
        create: invite,
      })
    )
  );
}

async function seedNotifications(parents) {
  const notifications = [
    {
      id: "seed-notification-pickup",
      notificationJson: JSON.stringify({
        type: "PICKUP",
        message: "Morning pickup started for North Gate Loop.",
      }),
    },
    {
      id: "seed-notification-otw",
      notificationJson: JSON.stringify({
        type: "LOCATION_UPDATE",
        message: "Bus is on the way to the next pickup point.",
      }),
    },
    {
      id: "seed-notification-system",
      notificationJson: JSON.stringify({
        type: "SYSTEM",
        message: "Demo school settings were updated.",
      }),
    },
  ];

  const createdNotifications = await Promise.all(
    notifications.map((notification) =>
      db.notification.upsert({
        where: { id: notification.id },
        update: notification,
        create: notification,
      })
    )
  );

  return Promise.all(
    parents.map((parent, index) =>
      db.parentNotification.upsert({
        where: { parentId: parent.id },
        update: { notificationId: createdNotifications[index].id },
        create: {
          id: `seed-parent-notification-${index + 1}`,
          parentId: parent.id,
          notificationId: createdNotifications[index].id,
        },
      })
    )
  );
}

async function seedPickups(students, teachers, parents) {
  const pickups = students.map((student, index) => ({
    id: `seed-pickup-${index + 1}`,
    studentId: student.id,
    teacherId: teachers[index].id,
    parentId: parents[index].id,
    pickUpTime: minutesAgo(120 - index * 20),
    arrivalTime: index === 1 ? minutesAgo(40) : null,
    confirmedBy: index === 1 ? "school-front-desk" : "teacher",
  }));

  return Promise.all(
    pickups.map((pickup) =>
      db.pickup.upsert({
        where: { id: pickup.id },
        update: pickup,
        create: pickup,
      })
    )
  );
}

async function seedBilling(schoolId, plans) {
  const billingAccount = await db.billingAccount.upsert({
    where: { userId: schoolId },
    update: {
      billingEmail: "admin@pocketshuttle.test",
      enforcementEnabled: true,
    },
    create: {
      id: "seed-school-billing",
      type: "SCHOOL",
      userId: schoolId,
      billingEmail: "admin@pocketshuttle.test",
      enforcementEnabled: true,
    },
  });

  const subscriptions = [
    {
      id: "seed-subscription-free",
      billingAccountId: billingAccount.id,
      userId: schoolId,
      planId: plans[0].id,
      startDate: daysFromNow(-45),
      endDate: daysFromNow(-15),
      status: "EXPIRED",
      subscriptionPlan: "FREE",
    },
    {
      id: "seed-subscription-pro",
      billingAccountId: billingAccount.id,
      userId: schoolId,
      planId: plans[1].id,
      startDate: daysFromNow(-10),
      endDate: daysFromNow(20),
      status: "ACTIVE",
      subscriptionPlan: "PRO",
    },
    {
      id: "seed-subscription-enterprise",
      billingAccountId: billingAccount.id,
      userId: schoolId,
      planId: plans[2].id,
      startDate: daysFromNow(30),
      endDate: daysFromNow(60),
      status: "TRIALING",
      subscriptionPlan: "ENTERPRISE",
    },
  ];

  const createdSubscriptions = await Promise.all(
    subscriptions.map((subscription) =>
      db.subscription.upsert({
        where: { id: subscription.id },
        update: subscription,
        create: subscription,
      })
    )
  );

  const payments = [
    {
      id: "seed-payment-free",
      userId: schoolId,
      subscriptionId: createdSubscriptions[0].id,
      amount: 0,
      currency: "NGN",
      status: "COMPLETED",
      transactionId: "SEED-TXN-FREE",
    },
    {
      id: "seed-payment-pro",
      userId: schoolId,
      subscriptionId: createdSubscriptions[1].id,
      amount: 25000,
      currency: "NGN",
      status: "COMPLETED",
      transactionId: "SEED-TXN-PRO",
    },
    {
      id: "seed-payment-enterprise",
      userId: schoolId,
      subscriptionId: createdSubscriptions[2].id,
      amount: 75000,
      currency: "NGN",
      status: "PENDING",
      transactionId: "SEED-TXN-ENTERPRISE",
    },
  ];

  return Promise.all(
    payments.map((payment) =>
      db.payment.upsert({
        where: { id: payment.id },
        update: payment,
        create: payment,
      })
    )
  );
}

async function seedSettingsAndAudit(schoolId) {
  await db.schoolSettings.upsert({
    where: { schoolId },
    update: {
      pickupWindow: 18,
      notifyDistance: 650,
    },
    create: {
      id: "seed-school-settings",
      schoolId,
      pickupWindow: 18,
      notifyDistance: 650,
    },
  });

  const logs = [
    {
      id: "seed-audit-settings",
      userId: schoolId,
      action: "MODIFY_SETTINGS",
      details: { pickupWindow: 18, notifyDistance: 650 },
      timestamp: minutesAgo(180),
    },
    {
      id: "seed-audit-subscription",
      userId: schoolId,
      action: "UPDATE_SUBSCRIPTION",
      details: { plan: "PRO", status: "ACTIVE" },
      timestamp: minutesAgo(90),
    },
    {
      id: "seed-audit-school",
      userId: schoolId,
      action: "CREATE_SCHOOL",
      details: { source: "seed-demo" },
      timestamp: minutesAgo(360),
    },
  ];

  return Promise.all(
    logs.map((log) =>
      db.auditLog.upsert({
        where: { id: log.id },
        update: log,
        create: log,
      })
    )
  );
}

async function seedTokens() {
  const tokens = [
    {
      id: "seed-verification-admin",
      email: "admin@pocketshuttle.test",
      role: "admin",
      token: "seed-verify-admin",
      expires: daysFromNow(1),
    },
    {
      id: "seed-verification-teacher",
      email: "teacher1@pocketshuttle.test",
      role: "teacher",
      token: "seed-verify-teacher",
      expires: daysFromNow(1),
    },
    {
      id: "seed-verification-parent",
      email: "parent1@pocketshuttle.test",
      role: "parent",
      token: "seed-verify-parent",
      expires: daysFromNow(1),
    },
  ];

  const resets = [
    {
      id: "seed-reset-admin",
      email: "admin@pocketshuttle.test",
      role: "admin",
      token: "seed-reset-admin",
      expires: daysFromNow(1),
    },
    {
      id: "seed-reset-teacher",
      email: "teacher1@pocketshuttle.test",
      role: "teacher",
      token: "seed-reset-teacher",
      expires: daysFromNow(1),
    },
    {
      id: "seed-reset-parent",
      email: "parent1@pocketshuttle.test",
      role: "parent",
      token: "seed-reset-parent",
      expires: daysFromNow(1),
    },
  ];

  await Promise.all(
    tokens.map((token) =>
      db.verificationToken.upsert({
        where: { token: token.token },
        update: token,
        create: token,
      })
    )
  );

  return Promise.all(
    resets.map((reset) =>
      db.resetPasswordToken.upsert({
        where: { token: reset.token },
        update: reset,
        create: reset,
      })
    )
  );
}

async function seedSuperUsers(passwordHash) {
  const superUsers = [
    {
      id: "seed-superuser-1",
      name: "Avery Platform",
      email: "super1@pocketshuttle.test",
      password: passwordHash,
      role: "SUPERADMIN",
      accessRole: "OWNER",
      status: "ACTIVE",
    },
    {
      id: "seed-superuser-2",
      name: "Jordan Support",
      email: "super2@pocketshuttle.test",
      password: passwordHash,
      role: "SUPERADMIN",
      accessRole: "ADMIN",
      status: "ACTIVE",
    },
    {
      id: "seed-superuser-3",
      name: "Taylor Billing",
      email: "super3@pocketshuttle.test",
      password: passwordHash,
      role: "SUPERADMIN",
      accessRole: "ADMIN",
      status: "ACTIVE",
    },
  ];

  const createdSuperUsers = await Promise.all(
    superUsers.map((superUser) =>
      db.superUser.upsert({
        where: { id: superUser.id },
        update: superUser,
        create: superUser,
      })
    )
  );

  const actions = createdSuperUsers.map((superUser, index) => ({
    id: `seed-super-action-${index + 1}`,
    superUserId: superUser.id,
    action: ["CREATE_SCHOOL", "UPDATE_SUBSCRIPTION", "MODIFY_SETTINGS"][index],
    targetId: SCHOOL_ID,
    metadata: { source: "seed-demo" },
  }));

  return Promise.all(
    actions.map((action) =>
      db.superUserAction.upsert({
        where: { id: action.id },
        update: action,
        create: action,
      })
    )
  );
}

async function seedTrips(schoolId, buses, drivers, students, parents, teachers) {
  const trips = buses.map((bus, index) => ({
    id: `seed-trip-${index + 1}`,
    tripType: "school_trip",
    title: `${bus.bus_number} ${bus.bus_product_name}`,
    status: index === 1 ? "paused" : "active",
    safetyState: "normal",
    origin: { label: "PocketShuttle Demo School", lat: 6.5244, lng: 3.3792 },
    destination: { label: students[index].address, lat: 6.52 + index * 0.01, lng: 3.37 + index * 0.01 },
    driverId: drivers[index].id,
    vehicleId: bus.id,
    startedAt: minutesAgo(80 - index * 15),
    endedAt: null,
    createdBy: teachers[index].id,
    schoolId,
    busId: bus.id,
    metadata: { seed: true, routeName: `Route ${index + 1}` },
  }));

  const createdTrips = await Promise.all(
    trips.map((trip) =>
      db.trip.upsert({
        where: { id: trip.id },
        update: trip,
        create: trip,
      })
    )
  );

  await Promise.all(
    createdTrips.map((trip, index) =>
      db.tripParticipant.upsert({
        where: {
          tripId_participantType_participantId: {
            tripId: trip.id,
            participantType: "student",
            participantId: students[index].id,
          },
        },
        update: {
          userId: students[index].id,
          role: "child",
          status: index === 1 ? "dropped" : "boarded",
          boardedAt: minutesAgo(70 - index * 10),
          droppedAt: index === 1 ? minutesAgo(30) : null,
          metadata: { studentName: students[index].full_name },
        },
        create: {
          id: `seed-trip-participant-${index + 1}`,
          tripId: trip.id,
          participantId: students[index].id,
          participantType: "student",
          userId: students[index].id,
          role: "child",
          status: index === 1 ? "dropped" : "boarded",
          boardedAt: minutesAgo(70 - index * 10),
          droppedAt: index === 1 ? minutesAgo(30) : null,
          metadata: { studentName: students[index].full_name },
        },
      })
    )
  );

  await Promise.all(
    createdTrips.map((trip, index) =>
      db.tripViewer.upsert({
        where: {
          tripId_viewerType_viewerId: {
            tripId: trip.id,
            viewerType: "parent",
            viewerId: parents[index].id,
          },
        },
        update: {
          permissions: ["view_location", "view_events", "receive_alerts"],
          metadata: { parentName: parents[index].full_name },
        },
        create: {
          id: `seed-trip-viewer-${index + 1}`,
          tripId: trip.id,
          viewerId: parents[index].id,
          viewerType: "parent",
          permissions: ["view_location", "view_events", "receive_alerts"],
          metadata: { parentName: parents[index].full_name },
        },
      })
    )
  );

  await Promise.all(
    createdTrips.map((trip, index) =>
      db.tripEvent.upsert({
        where: { id: `seed-trip-event-${index + 1}` },
        update: {
          tripId: trip.id,
          eventType: index === 1 ? "participant_dropped" : "participant_boarded",
          actorId: teachers[index].id,
          actorType: "teacher",
          payload: {
            studentId: students[index].id,
            busId: buses[index].id,
            source: "seed-demo",
          },
        },
        create: {
          id: `seed-trip-event-${index + 1}`,
          tripId: trip.id,
          eventType: index === 1 ? "participant_dropped" : "participant_boarded",
          actorId: teachers[index].id,
          actorType: "teacher",
          payload: {
            studentId: students[index].id,
            busId: buses[index].id,
            source: "seed-demo",
          },
        },
      })
    )
  );

  return Promise.all(
    createdTrips.map((trip, index) =>
      db.tripLocation.upsert({
        where: { id: `seed-trip-location-${index + 1}` },
        update: {
          tripId: trip.id,
          lat: 6.5244 + index * 0.012,
          lng: 3.3792 + index * 0.014,
          speed: index === 1 ? 0 : 24 + index * 8,
          heading: 90 + index * 20,
          accuracy: 8 + index,
          timestamp: minutesAgo(10 - index * 2),
        },
        create: {
          id: `seed-trip-location-${index + 1}`,
          tripId: trip.id,
          lat: 6.5244 + index * 0.012,
          lng: 3.3792 + index * 0.014,
          speed: index === 1 ? 0 : 24 + index * 8,
          heading: 90 + index * 20,
          accuracy: 8 + index,
          timestamp: minutesAgo(10 - index * 2),
        },
      })
    )
  );
}

async function main() {
  // console.log("Seeding PocketShuttle demo data...");

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const plans = await seedPlans();
  const school = await seedSchool(passwordHash);
  const routes = await seedRoutes(school.id);
  const buses = await seedBuses(school.id, routes);
  const teachers = await seedTeachers(school.id, buses, passwordHash);
  const drivers = await seedDrivers(school.id, buses);
  const parents = await seedParents(school.id, passwordHash);
  const students = await seedStudents(school.id, buses, teachers, parents);
  const standaloneAccounts = await seedStandaloneFamilies(passwordHash);

  await seedAccessInvites(school.id, teachers, parents, passwordHash);
  await seedNotifications(parents);
  await seedPickups(students, teachers, parents);
  await seedBilling(school.id, plans);
  await seedSettingsAndAudit(school.id);
  await seedTokens();
  await seedSuperUsers(passwordHash);
  await seedTrips(school.id, buses, drivers, students, parents, teachers);

  console.log("Seed complete.");
  console.log("Demo admin: admin@pocketshuttle.test / Password123!");
  console.log("Demo teacher: teacher1@pocketshuttle.test / Password123!");
  console.log("Demo parent: parent1@pocketshuttle.test / Password123!");
  console.log(
    `Standalone drivers: ${standaloneAccounts.drivers.map((driver) => driver.email).join(", ")} / Password123!`
  );
  console.log(
    `Standalone parents: ${standaloneAccounts.parents.map((parent) => parent.email).join(", ")} / Password123!`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
