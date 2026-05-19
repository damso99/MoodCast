import styles from "./AuthToast.module.css";

const toastIcon = {
  success: "✓",
  error: "!",
  info: "i",
};

const AuthToast = ({ toast }) => {
  // toast.show false면 렌더링 안함
  if (!toast.show) {
    return null;
  }

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <span className={styles.icon}>{toastIcon[toast.type] || "i"}</span>
      <span className={styles.message}>{toast.message}</span>
      <span className={styles.progress} />
    </div>
  );
};

export default AuthToast;
