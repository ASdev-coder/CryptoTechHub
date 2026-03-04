import Swal from "sweetalert2";

export const showSuccess = (title, text = "") => {
  Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonText: "OK",
    confirmButtonColor: "#5fd630ff",
  });
};

export const showError = (title, text) => {
  Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonText: "Got it",
    confirmButtonColor: "#d63030ff",
  });
};

export const showWarning = (title, text) => {
  Swal.fire({
    title,
    text,
    icon: "warning",
    confirmButtonText: "Got it",
    confirmButtonColor: "#d63030ff",
  });
};