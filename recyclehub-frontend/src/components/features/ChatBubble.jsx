import { Check, CheckCheck } from 'lucide-react';

export default function ChatBubble({ message, isOwn }) {
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
      <div 
        className={`max-w-[85%] sm:max-w-[70%] relative px-5 py-4 shadow-sm group-hover:shadow-md transition-shadow
          ${isOwn 
            ? 'bg-emerald-600 text-white rounded-[2rem] rounded-tr-[0.5rem]' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-[2rem] rounded-tl-[0.5rem]'
          }`}
      >
        {/* Attachment Handler */}
        {message.attachmentUrl && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-white/10">
             <img src={message.attachmentUrl} alt="attachment" className="w-full h-auto max-h-60 object-cover" />
          </div>
        )}

        {/* Message Content */}
        <p className="text-sm font-medium leading-relaxed tracking-tight whitespace-pre-wrap">
          {message.messageText}
        </p>

        {/* Info Strip (Time + Status) */}
        <div className={`flex items-center justify-end gap-1.5 mt-2 opacity-60`}>
          <span className="text-[10px] font-black uppercase tracking-tighter">
            {timeStr}
          </span>
          {isOwn && (
             <div className="flex">
                <CheckCheck size={12} className="text-emerald-300" />
             </div>
          )}
        </div>

        {/* Bubble Tail */}
        <div className={`absolute top-0 w-4 h-4 
           ${isOwn 
             ? '-right-1 bg-emerald-600 rounded-bl-full' 
             : '-left-1 bg-white border-l border-t border-gray-100 rounded-br-full'
           } pointer-events-none`} 
        />
      </div>
    </div>
  );
}
