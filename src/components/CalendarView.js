import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 辅助函数：获取月份的天数
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// 辅助函数：获取月份第一天是星期几
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

// 辅助函数：判断两个日期是否同一天
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// 辅助函数：判断是否是今天
const isToday = (date) => {
  return isSameDay(date, new Date());
};

const CalendarView = ({ 
  prescriptionHistory = [], 
  onSelectDate,
  onBack
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 计算当月有记录的天数
  const recordedDaysCount = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return prescriptionHistory.filter(p => {
      const date = new Date(p.date);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length;
  }, [prescriptionHistory, currentMonth]);

  // 生成日历网格数据
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // 填充月初空白
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, isEmpty: true });
    }
    
    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const prescription = prescriptionHistory.find(p => isSameDay(new Date(p.date), date));
      days.push({
        date,
        day,
        isEmpty: false,
        prescription,
        isToday: isToday(date)
      });
    }
    
    return days;
  }, [currentMonth, prescriptionHistory]);

  // 切换月份
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 格式化月份显示
  const monthYearString = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div 
      className="flex-1 flex flex-col bg-dreamy-gradient min-h-[100svh] w-full"
      style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
    >
      {/* 头部 */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4">
        {/* 返回按钮 + 标题 */}
        <div className="flex items-center mb-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-800 ml-1">我的处方</h1>
        </div>

        {/* 统计信息 */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            本月已记录 
            <span className="text-2xl font-bold text-amber-600 mx-2">{recordedDaysCount}</span>
            天
          </p>
        </div>

        {/* 月份切换 */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={goToPrevMonth}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-lg font-medium text-gray-800">{monthYearString}</span>
          <button 
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 星期头部 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div 
              key={day} 
              className="text-center text-xs text-gray-400 py-2 font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((item, index) => {
            if (item.isEmpty) {
              return <div key={index} className="aspect-square" />;
            }

            const hasRecord = !!item.prescription;
            const todayColor = item.prescription?.todayColor?.hex;
            
            return (
              <button
                key={index}
                onClick={() => hasRecord && onSelectDate(item.prescription)}
                disabled={!hasRecord}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center 
                           text-sm transition-all relative overflow-hidden
                           ${hasRecord 
                             ? 'shadow-sm hover:scale-105 cursor-pointer active:scale-95' 
                             : 'border border-gray-200/60 text-gray-400'
                           }
                           ${item.isToday && !hasRecord ? 'border-amber-300 border-2' : ''}`}
                style={hasRecord ? { 
                  backgroundColor: todayColor || '#f3f4f6',
                } : {}}
              >
                {/* 日期数字 */}
                <span 
                  className={`relative z-10 font-medium
                             ${hasRecord ? getTextColorForBg(todayColor) : 'text-gray-400'}`}
                >
                  {item.day}
                </span>
                
                {/* 今日标记 */}
                {item.isToday && (
                  <span 
                    className={`text-[8px] relative z-10 mt-0.5
                               ${hasRecord ? getTextColorForBg(todayColor) : 'text-amber-500'}`}
                  >
                    今
                  </span>
                )}

                {/* 有记录的装饰效果 */}
                {hasRecord && (
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 50%)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 历史记录列表（可选） */}
      <div className="flex-1 px-5 py-4">
        <h3 className="text-sm text-gray-500 mb-3">最近记录</h3>
        <div className="space-y-2">
          {prescriptionHistory.slice(0, 5).map((prescription, index) => {
            const date = new Date(prescription.date);
            const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
            return (
              <button
                key={index}
                onClick={() => onSelectDate(prescription)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/60 
                          backdrop-blur-sm hover:bg-white/80 transition-colors"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: prescription.todayColor?.hex || '#f3f4f6' }}
                />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {prescription.todayColor?.name || '未命名'}
                  </p>
                  <p className="text-xs text-gray-500">{dateStr}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            );
          })}
          
          {prescriptionHistory.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>还没有处方记录</p>
              <p className="text-sm mt-1">回到首页，开始今日的处方吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 辅助函数：根据背景色计算文字颜色
function getTextColorForBg(hexColor) {
  if (!hexColor) return 'text-gray-600';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'text-gray-800' : 'text-white';
}

export default CalendarView;
