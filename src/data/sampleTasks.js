import { localDate } from "../utils/tasks.js";

// Dữ liệu minh họa chỉ xuất hiện ở lần mở ứng dụng đầu tiên.
export function createSampleTasks() {
  const dateAfter = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return localDate(date);
  };
  const samples = [
    [
      "Hoàn thiện giao diện quản lý công việc",
      "Lập trình Web",
      0,
      false,
      "Xây dựng trang tổng quan và biểu mẫu thêm công việc bằng React.",
    ],
    [
      "Viết báo cáo thực hành mạng",
      "Mạng máy tính",
      -1,
      false,
      "Bổ sung ảnh chụp kết quả và giải thích các bước thực hiện.",
    ],
    [
      "Ôn tập mã hóa đối xứng",
      "Cơ sở an toàn thông tin",
      2,
      false,
      "Tổng hợp các khái niệm và làm bài tập cuối chương.",
    ],
    [
      "Vẽ biểu đồ lớp cho bài tập nhóm",
      "Công nghệ phần mềm",
      4,
      false,
      "Kiểm tra các quan hệ giữa các lớp trước buổi họp nhóm.",
    ],
    [
      "Thực hành truy vấn JOIN",
      "Cơ sở dữ liệu",
      -2,
      true,
      "Hoàn thành bài tập thực hành số 3.",
    ],
    [
      "Khởi tạo dự án React + Vite",
      "Lập trình Web",
      -1,
      true,
      "Chạy được dự án và chia cấu trúc thư mục.",
    ],
  ];
  return samples.map(
    ([title, subject, offset, completed, description], index) => ({
      id: `sample-${index + 1}`,
      title,
      subject,
      dueDate: dateAfter(offset),
      completed,
      description,
      createdAt: new Date(
        Date.now() - (samples.length - index) * 60000,
      ).toISOString(),
    }),
  );
}
