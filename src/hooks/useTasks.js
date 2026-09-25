import { useEffect, useRef, useState } from "react";
import { createSampleTasks } from "../data/sampleTasks.js";
import { decodeTasks, sanitizeTask, STORAGE_KEY } from "../utils/tasks.js";

const storageError =
  "Không thể lưu dữ liệu. Hãy kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt rồi thử lại.";
const readError =
  "Không đọc được dữ liệu đã lưu. Dữ liệu cũ vẫn được giữ nguyên; hãy thử tải lại trang.";

function readInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      tasks: raw === null ? createSampleTasks() : decodeTasks(raw),
      error: "",
      isNew: raw === null,
    };
  } catch {
    return { tasks: [], error: readError, isNew: false };
  }
}

export function useTasks() {
  const [initial] = useState(readInitial);
  const [tasks, setTasks] = useState(initial.tasks);
  const [error, setError] = useState(initial.error);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    if (initial.isNew) {
      try {
        if (localStorage.getItem(STORAGE_KEY) === null)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initial.tasks));
      } catch {
        setError(storageError);
      }
    }
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        const next = event.newValue === null ? [] : decodeTasks(event.newValue);
        tasksRef.current = next;
        setTasks(next);
        setError("");
      } catch {
        setError(readError);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [initial]);

  // Ghi thành công vào localStorage trước khi cập nhật giao diện.
  function commit(change) {
    let current;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      current = raw === null ? tasksRef.current : decodeTasks(raw);
    } catch {
      setError(readError);
      throw new Error(readError);
    }
    const next = change(current);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setError(storageError);
      throw new Error(storageError);
    }
    tasksRef.current = next;
    setTasks(next);
    setError("");
    return next;
  }

  function addTask(values) {
    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
    const task = {
      id,
      ...sanitizeTask(values),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    commit((current) => [task, ...current]);
    return task;
  }

  function updateTask(id, values) {
    const fields = sanitizeTask(values);
    commit((current) => {
      if (!current.some((task) => task.id === id))
        throw new Error("Công việc này đã bị xóa ở một tab khác.");
      return current.map((task) =>
        task.id === id ? { ...task, ...fields } : task,
      );
    });
  }

  function setCompleted(id, completed) {
    if (typeof completed !== "boolean")
      throw new Error("Trạng thái không hợp lệ.");
    commit((current) => {
      if (!current.some((task) => task.id === id))
        throw new Error("Không tìm thấy công việc.");
      return current.map((task) =>
        task.id === id ? { ...task, completed } : task,
      );
    });
  }

  function deleteTask(id) {
    commit((current) => current.filter((task) => task.id !== id));
  }

  return { tasks, error, addTask, updateTask, setCompleted, deleteTask };
}
