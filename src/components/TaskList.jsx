import Icon from "./Icon.jsx";
import { dueLabel, subjectColor } from "../utils/tasks.js";

export default function TaskList({
  tasks,
  today,
  onToggle,
  onEdit,
  onDelete,
  emptyTitle = "Chưa có công việc nào",
  emptyText = "Thêm công việc đầu tiên để bắt đầu kế hoạch học tập.",
  onAdd,
  filtered = false,
  onClear,
}) {
  if (!tasks.length)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Icon name="list" size={32} />
        </span>
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
        {filtered ? (
          <button className="button button-secondary" onClick={onClear}>
            Xóa bộ lọc
          </button>
        ) : (
          onAdd && (
            <button className="button button-primary" onClick={onAdd}>
              <Icon name="plus" size={18} />
              Thêm công việc
            </button>
          )
        )}
      </div>
    );

  return (
    <ul className="task-list">
      {tasks.map((task) => {
        const due = dueLabel(task, today);
        return (
          <li
            className={`task-row ${task.completed ? "is-completed" : ""}`}
            key={task.id}
          >
            <label className="task-check">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(event) => onToggle(task, event.target.checked)}
                aria-label={`${task.completed ? "Đánh dấu chưa hoàn thành" : "Hoàn thành"}: ${task.title}`}
              />
              <span>
                <Icon name="check" size={15} />
              </span>
            </label>
            <div className="task-content">
              <button className="task-title" onClick={() => onEdit(task)}>
                {task.title}
              </button>
              <div className="task-meta">
                <span className={`subject-label ${subjectColor(task.subject)}`}>
                  {task.subject}
                </span>
                <span className={`due-label ${due.tone}`}>
                  <Icon
                    name={due.tone === "done" ? "check" : "calendar"}
                    size={14}
                  />
                  {due.text}
                </span>
              </div>
            </div>
            <div className="task-actions">
              <button
                className="icon-button"
                onClick={() => onEdit(task)}
                title="Chỉnh sửa"
                aria-label={`Sửa: ${task.title}`}
              >
                <Icon name="edit" size={18} />
              </button>
              <button
                className="icon-button danger-icon"
                onClick={() => onDelete(task)}
                title="Xóa công việc"
                aria-label={`Xóa: ${task.title}`}
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
