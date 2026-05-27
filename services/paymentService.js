import mongoose from "mongoose";

import { Fees } from "../models/Fees.js";
import { Payment } from "../models/Payment.js";
import { Parent } from "../models/Parent.js";
import { Student } from "../models/Student.js";
import { publishDomainEvent } from "../server/events/domainEvents.js";

export async function listPayments() {
  return Payment.find({}, { _id: 0 }).sort({ date: -1 }).lean();
}

export async function getFeesByStudent(studentId) {
  return Fees.findOne({ student_id: studentId }, { _id: 0 }).lean();
}

export async function createPayment({ student_id, amount, method, date, transaction_id }) {
  const session = await mongoose.startSession();
  let payment;
  let updatedFees = null;

  await session.withTransaction(async () => {
    const [createdPayment] = await Payment.create(
      [
        {
          student_id,
          amount,
          method,
          date: new Date(date),
          ...(transaction_id ? { transaction_id } : {}),
        },
      ],
      { session },
    );

    payment = createdPayment.toObject();

    updatedFees = await Fees.findOneAndUpdate(
      { student_id },
      [
        {
          $set: {
            paid: { $add: ["$paid", amount] },
            balance: {
              $max: [0, { $subtract: ["$total_fee", { $add: ["$paid", amount] }] }],
            },
          },
        },
      ],
      { new: true, session },
    ).lean();
  });

  session.endSession();

  const [student, parent] = await Promise.all([
    Student.findOne({ student_id }, { _id: 0 }).lean(),
    Parent.findOne({ student_id }, { _id: 0 }).lean(),
  ]);

  const rooms = [
    "role:admin",
    "role:accounts",
    `student:${student_id}`,
    student?.class_id ? `class:${student.class_id}` : null,
    parent?.parent_id ? `parent:${parent.parent_id}` : null,
  ].filter(Boolean);

  publishDomainEvent("payment.created", {
    resource: "payments",
    action: "created",
    student_id,
    rooms,
    payment,
    fees: updatedFees,
  });

  return payment;
}
