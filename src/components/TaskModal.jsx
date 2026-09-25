import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { localDate, validateTask } from "../utils/tasks.js";

// Dialog HTML hỗ trợ phím Escape, giữ focus và phục hồi focus khi đóng.
export function Modal({ title, children, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = originalOverflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = ref.current.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Đóng hộp thoại"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function TaskModal({ task, subjects, onClose, onSave }) {
  const [values, setValues] = useState({
    title: task?.title || "",
    subject: task?.subject || "",
    dueDate: task?.dueDate || localDate(),
    description: task?.description || "",
  });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const change = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSaveError("");
  };
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateTask(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`task-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    try {
      onSave(values);
    } catch (error) {
      setSaveError(error.message);
    }
  };
  return (
    <Modal
      title={task ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
      onClose={onClose}
    >
      <p className="modal-intro">Ghi lại việc cần làm và thời hạn của bạn.</p>
      <form onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor="task-title">
            Tên công việc <span>*</span>
          </label>
          <input
            id="task-title"
            name="title"
            value={values.title}
            onChange={change}
            placeholder="Ví dụ: Hoàn thiện bài tập React"
            maxLength={120}
            autoFocus
            required
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && (
            <p id="title-error" className="field-error">
              {errors.title}
            </p>
          )}
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="task-subject">
              Môn học <span>*</span>
            </label>
            <input
              id="task-subject"
              name="subject"
              value={values.subject}
              onChange={change}
              list="subject-suggestions"
              placeholder="Nhập hoặc chọn môn học"
              maxLength={60}
              required
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            />
            <datalist id="subject-suggestions">
              {subjects.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
            {errors.subject && (
              <p id="subject-error" className="field-error">
                {errors.subject}
              </p>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="task-dueDate">
              Hạn nộp <span>*</span>
            </label>
            <input
              id="task-dueDate"
              name="dueDate"
              type="date"
              min="1000-01-01"
              max="9999-12-31"
              value={values.dueDate}
              onChange={change}
              required
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? "dueDate-error" : undefined}
            />
            {errors.dueDate && (
              <p id="dueDate-error" className="field-error">
                {errors.dueDate}
              </p>
            )}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="task-description">
            Ghi chú <small>Không bắt buộc</small>
          </label>
          <textarea
            id="task-description"
            name="description"
            rows={4}
            value={values.description}
            onChange={change}
            placeholder="Các bước cần làm, tài liệu cần đọc..."
            maxLength={1000}
          />
          <span className="char-count">{values.description.length}/1.000</span>
        </div>
        {saveError && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}
        <div className="modal-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button type="submit" className="button button-primary">
            <Icon name={task ? "check" : "plus"} size={18} />
            {task ? "Lưu thay đổi" : "Thêm công việc"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
