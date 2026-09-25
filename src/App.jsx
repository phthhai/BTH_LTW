import { useEffect, useState } from "react";
import Icon from "./components/Icon.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskModal, { Modal } from "./components/TaskModal.jsx";
import { useTasks } from "./hooks/useTasks.js";
import {
  filterTasks,
  getStats,
  localDate,
  subjectColor,
} from "./utils/tasks.js";

const defaultFilters = {
  query: "",
  subject: "all",
  status: "all",
  sort: "due",
};
const getPage = () =>
  window.location.hash === "#/tasks" ? "tasks" : "overview";

export default function App() {
  const api = useTasks();
  const { tasks, error, addTask, updateTask, setCompleted, deleteTask } = api;
  const [page, setPage] = useState(getPage);
  const [filters, setFilters] = useState(defaultFilters);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState(null);
  const [today, setToday] = useState(localDate);

  useEffect(() => {
    const onHash = () => setPage(getPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const syncDate = () => setToday(localDate());
    const timer = window.setInterval(syncDate, 60000);
    window.addEventListener("focus", syncDate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncDate);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.title = `${page === "overview" ? "Tổng quan" : "Công việc"} · StudyFlow`;
  }, [page]);

  const stats = getStats(tasks, today);
  const subjects = [...new Set(tasks.map((task) => task.subject))].sort(
    (a, b) => a.localeCompare(b, "vi"),
  );
  const effectiveFilters = {
    ...filters,
    subject:
      filters.subject === "all" || subjects.includes(filters.subject)
        ? filters.subject
        : "all",
  };
  const visibleTasks = filterTasks(tasks, effectiveFilters, today);
  const pending = filterTasks(tasks, { status: "pending" }, today);
  const hasFilters =
    effectiveFilters.query.trim() !== "" ||
    effectiveFilters.subject !== "all" ||
    effectiveFilters.status !== "all";
  const notify = (message, type = "success") =>
    setToast({ message, type, key: Date.now() });
  const openAdd = () => setModal({ task: null });
  const showTasks = (newFilters = {}) => {
    setFilters({ ...defaultFilters, ...newFilters });
    setPage("tasks");
    window.location.hash = "/tasks";
  };
  const changeFilter = (name, value) =>
    setFilters((current) => ({ ...current, [name]: value }));
  const toggle = (task, completed) => {
    try {
      setCompleted(task.id, completed);
      notify(
        completed ? "Đã đánh dấu hoàn thành." : "Đã chuyển về chưa hoàn thành.",
      );
    } catch (err) {
      notify(err.message, "error");
    }
  };
  const save = (values) => {
    if (modal.task) {
      updateTask(modal.task.id, values);
      notify("Đã cập nhật công việc.");
    } else {
      addTask(values);
      notify("Đã thêm công việc mới.");
    }
    setModal(null);
  };
  const requestDelete = (task) => {
    setDeleteTarget(task);
    setDeleteError("");
  };
  const confirmDelete = () => {
    try {
      deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      notify("Đã xóa công việc.");
    } catch (err) {
      setDeleteError(err.message);
    }
  };
  const listProps = {
    today,
    onToggle: toggle,
    onEdit: (task) => setModal({ task }),
    onDelete: requestDelete,
    onAdd: openAdd,
  };
  const dateText = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${today}T12:00:00`));

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#/overview"
          aria-label="StudyFlow - Tổng quan"
        >
          <span className="brand-mark">
            <Icon name="check" size={25} />
          </span>
          <span>
            Study<span className="brand-light">Flow</span>
          </span>
        </a>
        <div className="workspace-label">GÓC HỌC TẬP CỦA BẠN</div>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <a
            className={`nav-item ${page === "overview" ? "active" : ""}`}
            href="#/overview"
            aria-current={page === "overview" ? "page" : undefined}
          >
            <Icon name="grid" />
            <span>Tổng quan</span>
          </a>
          <a
            className={`nav-item ${page === "tasks" ? "active" : ""}`}
            href="#/tasks"
            onClick={() => setFilters(defaultFilters)}
            aria-current={page === "tasks" ? "page" : undefined}
          >
            <Icon name="list" />
            <span>Công việc</span>
            <span className="nav-count">{stats.total}</span>
          </a>
        </nav>
        <div className="sidebar-shortcuts">
          <div className="workspace-label">TRUY CẬP NHANH</div>
          <button
            className="nav-item shortcut"
            onClick={() => showTasks({ status: "today" })}
          >
            <Icon name="calendar" />
            <span>Hôm nay</span>
            <span className="shortcut-count">{stats.today}</span>
          </button>
          <button
            className="nav-item shortcut"
            onClick={() => showTasks({ status: "overdue" })}
          >
            <Icon name="clock" />
            <span>Quá hạn</span>
            {stats.overdue > 0 && (
              <span className="shortcut-count overdue-count">
                {stats.overdue}
              </span>
            )}
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-progress">
            <div className="progress-heading">
              <span>Tiến độ của bạn</span>
              <strong>{stats.percent}%</strong>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Tiến độ hoàn thành"
              aria-valuenow={stats.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${stats.percent}%` }} />
            </div>
            <p>
              {stats.completed}/{stats.total} công việc đã hoàn thành
            </p>
          </div>
          <div className="local-note">
            <Icon name="book" size={16} />
            <span>Không gian học tập cá nhân</span>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Không gian cá nhân<span>/</span>
            <strong>{page === "overview" ? "Tổng quan" : "Công việc"}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-badge">Chỉ lưu trên thiết bị này</span>
            <span className="avatar" aria-label="Sinh viên">
              SV
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {page === "overview"
                  ? "HỌC TẬP CÓ KẾ HOẠCH"
                  : "DANH SÁCH HỌC TẬP"}
              </p>
              <h1>
                {page === "overview"
                  ? "Tổng quan học tập"
                  : "Công việc của bạn"}
              </h1>
              <p className="page-subtitle">
                {page === "overview"
                  ? dateText
                  : "Sắp xếp bài tập, theo dõi thời hạn và hoàn thành từng việc."}
              </p>
            </div>
            <button
              className="button button-primary add-button"
              onClick={openAdd}
            >
              <Icon name="plus" size={19} />
              Thêm công việc
            </button>
          </div>

          {error && (
            <div className="storage-warning" role="alert">
              <Icon name="alert" />
              <span>{error}</span>
              <button
                className="text-button"
                onClick={() => window.location.reload()}
              >
                Tải lại
              </button>
            </div>
          )}

          {page === "overview" ? (
            <>
              <div className="stats-grid">
                <button className="stat-card" onClick={() => showTasks()}>
                  <div>
                    <span className="stat-label">Tổng công việc</span>
                    <strong className="stat-number">
                      {stats.total.toString().padStart(2, "0")}
                    </strong>
                    <span className="stat-caption">Trong kế hoạch học tập</span>
                  </div>
                  <span className="stat-icon blue">
                    <Icon name="list" size={23} />
                  </span>
                </button>
                <button
                  className="stat-card"
                  onClick={() => showTasks({ status: "pending" })}
                >
                  <div>
                    <span className="stat-label">Chưa hoàn thành</span>
                    <strong className="stat-number">
                      {stats.pending.toString().padStart(2, "0")}
                    </strong>
                    <span
                      className={`stat-caption ${stats.overdue ? "caption-warning" : ""}`}
                    >
                      {stats.overdue
                        ? `${stats.overdue} công việc đã quá hạn`
                        : "Đang chờ bạn thực hiện"}
                    </span>
                  </div>
                  <span className="stat-icon orange">
                    <Icon name="clock" size={23} />
                  </span>
                </button>
                <button
                  className="stat-card"
                  onClick={() => showTasks({ status: "completed" })}
                >
                  <div>
                    <span className="stat-label">Đã hoàn thành</span>
                    <strong className="stat-number">
                      {stats.completed.toString().padStart(2, "0")}
                    </strong>
                    <span className="stat-caption">
                      {stats.percent}% tổng số công việc
                    </span>
                  </div>
                  <span className="stat-icon teal">
                    <Icon name="check" size={23} />
                  </span>
                </button>
              </div>
              <div className="dashboard-grid">
                <section
                  className="panel priority-panel"
                  aria-labelledby="priority-title"
                >
                  <div className="panel-heading">
                    <div>
                      <h2 id="priority-title">
                        Cần ưu tiên{" "}
                        <span className="heading-count">{stats.pending}</span>
                      </h2>
                      <p>Công việc chưa hoàn thành, theo hạn nộp gần nhất</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => showTasks({ status: "pending" })}
                    >
                      Xem tất cả
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                  <TaskList
                    tasks={pending.slice(0, 5)}
                    {...listProps}
                    emptyTitle={
                      stats.total
                        ? "Bạn đã hoàn thành tất cả!"
                        : "Bắt đầu kế hoạch của bạn"
                    }
                    emptyText={
                      stats.total
                        ? "Các công việc đã hoàn thành vẫn nằm trong danh sách Công việc."
                        : "Thêm bài tập đầu tiên và chọn hạn nộp để bắt đầu."
                    }
                  />
                  {pending.length > 0 && (
                    <div className="panel-footer">
                      <Icon name="check" size={16} />
                      <span>Tích vào ô bên trái khi hoàn thành công việc.</span>
                    </div>
                  )}
                </section>
                <div className="dashboard-side">
                  <section className="today-card">
                    <div className="today-card-top">
                      <span className="today-icon">
                        <Icon name="calendar" size={22} />
                      </span>
                      <span>HÔM NAY</span>
                    </div>
                    <div className="today-count">
                      {stats.today}
                      <span>công việc đến hạn</span>
                    </div>
                    <p>
                      {stats.today
                        ? "Dành thời gian cho những việc cần hoàn thành hôm nay."
                        : "Không có công việc nào đến hạn hôm nay."}
                    </p>
                    <button onClick={() => showTasks({ status: "today" })}>
                      Xem công việc hôm nay
                      <Icon name="arrow" size={18} />
                    </button>
                  </section>
                  <section
                    className="panel subjects-panel"
                    aria-labelledby="subjects-title"
                  >
                    <div className="panel-heading">
                      <h2 id="subjects-title">Theo môn học</h2>
                      <span className="heading-count">{subjects.length}</span>
                    </div>
                    {subjects.length ? (
                      <div className="subject-list">
                        {subjects.map((subject) => {
                          const group = tasks.filter(
                            (task) => task.subject === subject,
                          );
                          const done = group.filter(
                            (task) => task.completed,
                          ).length;
                          return (
                            <button
                              className="subject-row"
                              key={subject}
                              onClick={() => showTasks({ subject })}
                            >
                              <div>
                                <span
                                  className={`subject-dot ${subjectColor(subject)}`}
                                />
                                <span className="subject-name">{subject}</span>
                                <span className="subject-fraction">
                                  {done}/{group.length}
                                </span>
                              </div>
                              <div
                                className={`subject-progress ${subjectColor(subject)}`}
                              >
                                <span
                                  style={{
                                    width: `${(done / group.length) * 100}%`,
                                  }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="small-empty">
                        Môn học sẽ xuất hiện khi bạn thêm công việc.
                      </p>
                    )}
                  </section>
                </div>
              </div>
            </>
          ) : (
            <section
              className="panel all-tasks-panel"
              aria-label="Danh sách công việc"
            >
              <div className="task-toolbar">
                <div className="search-field">
                  <Icon name="search" size={20} />
                  <input
                    aria-label="Tìm kiếm công việc"
                    type="search"
                    placeholder="Tìm tên công việc, môn học..."
                    value={filters.query}
                    onChange={(event) =>
                      changeFilter("query", event.target.value)
                    }
                  />
                </div>
                <div className="filter-field">
                  <label className="sr-only" htmlFor="subject-filter">
                    Lọc theo môn học
                  </label>
                  <select
                    id="subject-filter"
                    value={effectiveFilters.subject}
                    onChange={(event) =>
                      changeFilter("subject", event.target.value)
                    }
                  >
                    <option value="all">Tất cả môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-field sort-field">
                  <label className="sr-only" htmlFor="sort-order">
                    Sắp xếp công việc
                  </label>
                  <select
                    id="sort-order"
                    value={filters.sort}
                    onChange={(event) =>
                      changeFilter("sort", event.target.value)
                    }
                  >
                    <option value="due">Hạn nộp gần nhất</option>
                    <option value="newest">Mới thêm gần nhất</option>
                    <option value="name">Tên A → Z</option>
                  </select>
                </div>
              </div>
              <div className="status-toolbar">
                <div className="status-tabs" aria-label="Lọc theo trạng thái">
                  {[
                    ["all", "Tất cả", stats.total],
                    ["pending", "Chưa hoàn thành", stats.pending],
                    ["completed", "Đã hoàn thành", stats.completed],
                    ["overdue", "Quá hạn", stats.overdue],
                    ["today", "Hôm nay", stats.today],
                  ].map(([value, label, count]) => (
                    <button
                      key={value}
                      className={`status-tab ${filters.status === value ? "selected" : ""}`}
                      aria-pressed={filters.status === value}
                      onClick={() => changeFilter("status", value)}
                    >
                      {label}
                      <span>{count}</span>
                    </button>
                  ))}
                </div>
                {hasFilters && (
                  <button
                    className="text-button clear-filters"
                    onClick={() => setFilters(defaultFilters)}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
              <div className="list-summary" role="status">
                <span>
                  {visibleTasks.length} công việc{hasFilters ? " phù hợp" : ""}
                </span>
                <span>Hạn nộp & trạng thái</span>
              </div>
              <TaskList
                tasks={visibleTasks}
                {...listProps}
                filtered={hasFilters}
                onClear={() => setFilters(defaultFilters)}
                emptyTitle={
                  hasFilters
                    ? "Không tìm thấy công việc phù hợp"
                    : "Danh sách đang trống"
                }
                emptyText={
                  hasFilters
                    ? "Thử một từ khóa khác hoặc bỏ bớt bộ lọc."
                    : "Thêm công việc đầu tiên để bắt đầu kế hoạch học tập."
                }
              />
            </section>
          )}
          <footer className="page-footer">
            <span>
              StudyFlow <span className="footer-dot">·</span> Học tập từng bước
            </span>
            <span>Dữ liệu được giữ khi tải lại trang</span>
          </footer>
        </main>
      </div>

      {modal && (
        <TaskModal
          key={modal.task?.id || "new"}
          task={modal.task}
          subjects={subjects}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
      {deleteTarget && (
        <Modal
          title="Xóa công việc?"
          onClose={() => setDeleteTarget(null)}
          className="delete-modal"
        >
          <div className="delete-symbol">
            <Icon name="trash" size={27} />
          </div>
          <p className="delete-description">
            Bạn muốn xóa <strong>“{deleteTarget.title}”</strong>? Thao tác này
            không thể hoàn tác.
          </p>
          {deleteError && (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="modal-footer">
            <button
              className="button button-secondary"
              autoFocus
              onClick={() => setDeleteTarget(null)}
            >
              Giữ lại
            </button>
            <button className="button button-danger" onClick={confirmDelete}>
              Xóa công việc
            </button>
          </div>
        </Modal>
      )}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            key={toast.key}
            className={`toast ${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <Icon name={toast.type === "error" ? "alert" : "check"} size={20} />
            <span>{toast.message}</span>
            <button
              className="icon-button"
              aria-label="Đóng thông báo"
              onClick={() => setToast(null)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
