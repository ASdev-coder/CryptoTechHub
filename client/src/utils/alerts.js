import Swal from "sweetalert2";

const darkTheme = {
  background: "#1e293b",
  color: "#f8fafc",
  confirmButtonColor: "#3b82f6",
};

export const showSuccess = (title, text = "") => {
  Swal.fire({
    ...darkTheme,
    title,
    text,
    icon: "success",
    confirmButtonText: "Чудово",
    confirmButtonColor: "#22c55e",
  });
};

export const showError = (title, text) => {
  Swal.fire({
    ...darkTheme,
    title,
    text,
    icon: "error",
    confirmButtonText: "Зрозумів",
    confirmButtonColor: "#ef4444",
  });
};

export const showWarning = (title, text) => {
  Swal.fire({
    ...darkTheme,
    title,
    text,
    icon: "warning",
    confirmButtonText: "Окей",
    confirmButtonColor: "#f59e0b",
  });
};

export const confirmDelete = async (itemName) => {
  const result = await Swal.fire({
    ...darkTheme,
    title: "Ви впевнені?",
    text: `Ви збираєтесь видалити "${itemName}". Цю дію неможливо скасувати!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Так, видалити",
    cancelButtonText: "Скасувати",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#475569",
    reverseButtons: true, 
  });

  return result.isConfirmed;
};
