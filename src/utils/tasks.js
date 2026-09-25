export const STORAGE_KEY = "studyflow.tasks.v1";

// Ngày được lưu dưới dạng YYYY-MM-DD theo giờ địa phương, không chuyển sang UTC.
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const year = Number(value.slice(0, 4));
  if (year < 1000 || year > 9999) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export function foldText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function validateTask(values) {
  const errors = {};
  if (!values.title?.trim()) errors.title = "Bạn hãy nhập tên công việc.";
  else if (values.title.trim().length > 120)
    errors.title = "Tên công việc tối đa 120 ký tự.";
  if (!values.subject?.trim()) errors.subject = "Bạn hãy nhập tên môn học.";
  else if (values.subject.trim().length > 60)
    errors.subject = "Tên môn học tối đa 60 ký tự.";
  if (!isValidDate(values.dueDate))
    errors.dueDate = "Bạn hãy chọn hạn nộp hợp lệ.";
  if ((values.description || "").length > 1000)
    errors.description = "Ghi chú tối đa 1.000 ký tự.";
  return errors;
}

export function sanitizeTask(values) {
  const errors = validateTask(values);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return {
    title: values.title.trim(),
    subject: values.subject.trim(),
    dueDate: values.dueDate,
    description: (values.description || "").trim(),
  };
}

// Chỉ chấp nhận dữ liệu đúng cấu trúc trước khi đưa vào ứng dụng.
export function decodeTasks(raw) {
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Dữ liệu không hợp lệ.");
  const ids = new Set();
  return data.map((task) => {
    if (
      !task ||
      typeof task.id !== "string" ||
      !task.id ||
      ids.has(task.id) ||
      typeof task.title !== "string" ||
      typeof task.subject !== "string" ||
      typeof task.description !== "string" ||
      typeof task.completed !== "boolean" ||
      typeof task.createdAt !== "string" ||
      Number.isNaN(Date.parse(task.createdAt))
    ) {
      throw new Error("Dữ liệu không hợp lệ.");
    }
    ids.add(task.id);
    return {
      id: task.id,
      ...sanitizeTask(task),
      completed: task.completed,
      createdAt: task.createdAt,
    };
  });
}

export function getStats(tasks, today = localDate()) {
  const completed = tasks.filter((task) => task.completed).length;
  return {
    total: tasks.length,
    completed,
    pending: tasks.length - completed,
    overdue: tasks.filter((task) => !task.completed && task.dueDate < today)
      .length,
    today: tasks.filter((task) => !task.completed && task.dueDate === today)
      .length,
    percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

export function filterTasks(
  tasks,
  { query = "", subject = "all", status = "all", sort = "due" } = {},
  today = localDate(),
) {
  const needle = foldText(query.trim());
  const result = tasks.filter((task) => {
    const matchesQuery = foldText(
      `${task.title} ${task.subject} ${task.description}`,
    ).includes(needle);
    const matchesSubject = subject === "all" || task.subject === subject;
    const matchesStatus =
      status === "all" ||
      (status === "pending" && !task.completed) ||
      (status === "completed" && task.completed) ||
      (status === "overdue" && !task.completed && task.dueDate < today) ||
      (status === "today" && !task.completed && task.dueDate === today);
    return matchesQuery && matchesSubject && matchesStatus;
  });
  return result.sort((a, b) => {
    if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "name") return a.title.localeCompare(b.title, "vi");
    return (
      Number(a.completed) - Number(b.completed) ||
      a.dueDate.localeCompare(b.dueDate) ||
      b.createdAt.localeCompare(a.createdAt)
    );
  });
}

export function formatShortDate(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}

export function dueLabel(task, today = localDate()) {
  if (task.completed) return { text: "Đã hoàn thành", tone: "done" };
  if (task.dueDate < today)
    return { text: `Quá hạn · ${formatShortDate(task.dueDate)}`, tone: "late" };
  if (task.dueDate === today) return { text: "Hạn nộp hôm nay", tone: "today" };
  return { text: `Hạn nộp ${formatShortDate(task.dueDate)}`, tone: "upcoming" };
}

export function subjectColor(subject) {
  let hash = 0;
  for (const char of subject) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return ["blue", "violet", "teal", "orange"][Math.abs(hash) % 4];
}
