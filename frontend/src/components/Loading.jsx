const Loading = ({ fullScreen = false, text = 'Yuklanmoqda...' }) => {
  const wrapper = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    </div>
  );
};

export default Loading;
