import Swal from "sweetalert2";

const COLORS = {
    confirmButtonColor: "#111827",
    cancelButtonColor: "#6b7280",
};

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

export function toastSuccess(title) {
    Toast.fire({ icon: "success", title });
}

export function toastInfo(title) {
    Toast.fire({ icon: "info", title });
}

export function toastError(title) {
    Toast.fire({ icon: "error", title, timer: 4500 });
}

export function alertSuccess(title, text = "") {
    return Swal.fire({ icon: "success", title, text, ...COLORS });
}

export function alertError(text, title = "Something went wrong") {
    // Don't stack several error popups on top of each other.
    if (Swal.isVisible()) {
        return Promise.resolve();
    }

    return Swal.fire({ icon: "error", title, text, ...COLORS });
}

/**
 * Ask the user to confirm. Resolves to true / false.
 *
 *   if (!(await confirmAction({ title: "Delete report?" }))) return;
 */
export async function confirmAction({
    title = "Are you sure?",
    text = "",
    confirmText = "Yes",
    cancelText = "Cancel",
    icon = "warning",
    danger = false,
} = {}) {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        focusCancel: danger,
        ...COLORS,
        confirmButtonColor: danger ? "#dc2626" : COLORS.confirmButtonColor,
    });

    return result.isConfirmed;
}