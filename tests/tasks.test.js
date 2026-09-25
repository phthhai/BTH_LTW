import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeTasks,
  filterTasks,
  getStats,
  isValidDate,
  localDate,
  sanitizeTask,
  validateTask,
} from "../src/utils/tasks.js";

const task = {
  id: "a",
  title: "Ôn tập Đồ thị",
  subject: "Toán rời rạc",
  description: "Bài tập chương 2",
  dueDate: "2026-09-25",
  completed: false,
  createdAt: "2026-09-23T09:00:00.000Z",
};
const tasks = [
  task,
  { ...task, id: "b", dueDate: "2026-09-24", completed: true },
  {
    ...task,
    id: "c",
    title: "Bài tập React",
    subject: "Lập trình Web",
    dueDate: "2026-09-24",
  },
];

test("Tìm không dấu và kết hợp bộ lọc môn học, trạng thái", () => {
  assert.deepEqual(
    filterTasks(tasks, {
      query: "on tap do thi",
      subject: "Toán rời rạc",
      status: "pending",
    }).map((t) => t.id),
    ["a"],
  );
  assert.equal(filterTasks(tasks, { query: "khong co" }).length, 0);
});
test("Ngày hiện tại không quá hạn; công việc hoàn thành không tính quá hạn", () => {
  assert.deepEqual(getStats(tasks, "2026-09-25"), {
    total: 3,
    completed: 1,
    pending: 2,
    overdue: 1,
    today: 1,
    percent: 33,
  });
  assert.deepEqual(
    filterTasks(tasks, { status: "overdue" }, "2026-09-25").map((t) => t.id),
    ["c"],
  );
});
test("Hạn nộp gần nhất đưa việc chưa hoàn thành lên trước, không sửa mảng gốc", () => {
  assert.deepEqual(
    filterTasks(tasks).map((t) => t.id),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    tasks.map((t) => t.id),
    ["a", "b", "c"],
  );
});
test("Kiểm tra năm nhuận và ngày không có thật", () => {
  assert.equal(isValidDate("2024-02-29"), true);
  for (const date of ["2026-02-29", "2026-04-31", "2026-13-01", "", "2026-9-2"])
    assert.equal(isValidDate(date), false);
  assert.equal(localDate(new Date(2026, 8, 25, 0, 5)), "2026-09-25");
});
test("Biểu mẫu không nhận khoảng trắng và loại khoảng trắng thừa", () => {
  assert.ok(validateTask({ ...task, title: "   " }).title);
  assert.equal(
    sanitizeTask({ ...task, title: "  Học React  " }).title,
    "Học React",
  );
  assert.throws(() => sanitizeTask({ ...task, dueDate: "2026-02-31" }));
});
test("Dữ liệu lưu sai hoặc trùng ID bị từ chối, danh sách rỗng vẫn được giữ", () => {
  assert.deepEqual(decodeTasks("[]"), []);
  assert.deepEqual(decodeTasks(JSON.stringify(tasks)), tasks);
  for (const raw of [
    "broken",
    "{}",
    "[null]",
    JSON.stringify([task, task]),
    JSON.stringify([{ ...task, completed: "false" }]),
  ])
    assert.throws(() => decodeTasks(raw));
  assert.equal(getStats([], "2026-09-25").percent, 0);
});
