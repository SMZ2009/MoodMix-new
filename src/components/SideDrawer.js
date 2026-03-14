import { X, Music, Wine, User } from 'lucide-react';

const SideDrawer = ({
  isOpen,
  onClose,
  onMenuSelect,
  activeMenu = 'home'
}) => {
  const menuItems = [
    { id: 'music', label: '音乐库', icon: Music, ready: true },
    { id: 'drinks', label: '饮品库', icon: Wine, ready: true },
    { id: 'mine', label: '我的', icon: User, ready: true },
  ];

  const handleMenuClick = (item) => {
    if (item.ready) {
      onMenuSelect(item.id);
      onClose();
    }
  };

  return (
    <>
      {/* 半透明遮罩层 */}
      <div
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 抽屉本体 */}
      <div
        className={`fixed top-0 left-0 h-full w-[70vw] max-w-[280px] z-[95] 
                    bg-white/95 backdrop-blur-xl shadow-2xl
                    transform transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="导航菜单"
      >
        {/* 顶部安全区 */}
        <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4">
          <div>
            <h1
              className="text-xl font-bold text-gray-800"
              style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
            >
              MoodMix
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">情绪处方</p>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* 菜单项 */}
        <nav className="px-4 py-6 space-y-1">
          {menuItems.map(item => {
            const isActive = activeMenu === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item)}
                disabled={!item.ready}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all
                           ${isActive
                    ? 'bg-amber-50 text-amber-700'
                    : item.ready
                      ? 'hover:bg-gray-50 text-gray-700'
                      : 'text-gray-400 cursor-not-allowed'}`}
                style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center
                                ${isActive ? 'bg-amber-100' : 'bg-gray-100'}`}>
                  <Icon size={18} className={isActive ? 'text-amber-600' : 'text-gray-500'} />
                </div>
                <span className="font-medium text-[15px]">{item.label}</span>
                {!item.ready && (
                  <span className="ml-auto text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-400">
                    即将上线
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />

        </div>
      </div>
    </>
  );
};

export default SideDrawer;
