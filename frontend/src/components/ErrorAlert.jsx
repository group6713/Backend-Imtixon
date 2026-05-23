const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
      <p className="text-sm">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-red-600 hover:text-red-800 dark:text-red-300"
          aria-label="Yopish"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
