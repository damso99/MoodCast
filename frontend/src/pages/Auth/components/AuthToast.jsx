import styles from "./AuthToast.module.css";

const AuthToast = ({ toast }) => {
  // toast.show false면 렌더링 안함
  if (!toast.show) {
    return null;
  }

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      {toast.message}
    </div>
  );
};

export default AuthToast;
