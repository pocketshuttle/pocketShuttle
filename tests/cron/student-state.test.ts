import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Prisma } from "@prisma/client";

import {
  createResetStatusHandler,
  createResetStudentHandler,
} from "../../lib/cron/student-routes";
import {
  moveInBusStudentsToSchool,
  resetStudentDailyState,
  StudentUpdateClient,
} from "../../lib/cron/student-state";

function fakeStudents(counts: number[]) {
  const calls: Array<{
    where: Prisma.StudentWhereInput;
    data: Prisma.StudentUpdateManyMutationInput;
  }> = [];
  const client: StudentUpdateClient = {
    async updateMany(args) {
      calls.push(args);
      return { count: counts[calls.length - 1] ?? 0 };
    },
  };
  return { calls, client };
}

describe("student state cron jobs", () => {
  it("resets active student state atomically and remains safe to repeat", async () => {
    const { calls, client } = fakeStudents([4, 0]);
    assert.deepEqual(await resetStudentDailyState(client), { count: 4 });
    assert.deepEqual(await resetStudentDailyState(client), { count: 0 });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], {
      where: { presence: { not: "NONE" } },
      data: {
        presence: "NONE",
        status: "DROPPED",
        attendance: "ABSENT",
      },
    });
    assert.deepEqual(calls[1], calls[0]);
  });

  it("moves only in-bus students to school atomically and remains safe to repeat", async () => {
    const { calls, client } = fakeStudents([2, 0]);
    assert.deepEqual(await moveInBusStudentsToSchool(client), { count: 2 });
    assert.deepEqual(await moveInBusStudentsToSchool(client), { count: 0 });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], {
      where: { presence: "IN_BUS" },
      data: { presence: "AT_SCHOOL" },
    });
    assert.deepEqual(calls[1], calls[0]);
  });

  it("guards reset-student and reports affected-row counts on repeated execution", async () => {
    const { calls, client } = fakeStudents([4, 0]);
    const denied = createResetStudentHandler({
      authorize: async () => false,
      students: client,
    });
    const allowed = createResetStudentHandler({
      authorize: async () => true,
      students: client,
    });
    const request = new Request(
      "https://staging.example.test/api/cron-jobs/reset-student"
    );

    assert.equal((await denied(request)).status, 401);
    assert.equal(calls.length, 0);
    for (const updated of [4, 0]) {
      const response = await allowed(request);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).updated, updated);
    }
    assert.equal(calls.length, 2);
  });

  it("guards reset-status and reports affected-row counts on repeated execution", async () => {
    const { calls, client } = fakeStudents([2, 0]);
    const denied = createResetStatusHandler({
      authorize: async () => false,
      students: client,
    });
    const allowed = createResetStatusHandler({
      authorize: async () => true,
      students: client,
    });
    const request = new Request(
      "https://staging.example.test/api/cron-jobs/reset-status"
    );

    assert.equal((await denied(request)).status, 401);
    assert.equal(calls.length, 0);
    for (const updated of [2, 0]) {
      const response = await allowed(request);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).updated, updated);
    }
    assert.equal(calls.length, 2);
  });
});
