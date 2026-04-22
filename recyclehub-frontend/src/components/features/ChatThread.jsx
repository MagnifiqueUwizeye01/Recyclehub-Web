import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Smile, Mic, Image as ImageIcon, MessageSquare } from 'lucide-react';
import ChatBubble from './ChatBubble';
import Spinner from '../ui/Spinner';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';

export default function ChatThread({ otherUserId, materialId, orderId, className = '' }) {
  const { user } = useAuth();
  const { activeThread, loadThread, sendMessage, loadingThread } = useMessages();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (otherUserId) loadThread(otherUserId, materialId);
  }, [otherUserId, materialId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setSending(true);
      await sendMessage({ receiverUserId: otherUserId, messageText: text, materialId, orderId });
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col bg-transparent ${className}`}>
      
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-hide">
        {loadingThread ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-10 h-10 border-2 border-emerald-500/10 border-t-emerald-500 rounded-2xl rotate-45 animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 animate-pulse italic">Loading conversation</p>
          </div>
        ) : activeThread.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-16 h-16 bg-white border border-gray-100 shadow-xl shadow-gray-100 rounded-[2rem] flex items-center justify-center rotate-12">
                <MessageSquare size={32} className="text-emerald-500" />
             </div>
             <div className="text-center space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-gray-900 italic">Secure chat</p>
                <p className="text-[10px] font-bold text-gray-400 max-w-[200px]">Messages are end-to-end encrypted</p>
             </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
             {activeThread.map((msg, idx) => {
               const prevMsg = activeThread[idx - 1];
               const showTime = !prevMsg || (new Date(msg.createdAt) - new Date(prevMsg.createdAt) > 600000); // 10 mins
               
               return (
                  <div key={msg.id} className="space-y-4">
                     {showTime && (
                        <div className="flex justify-center my-8">
                           <span className="bg-white/50 backdrop-blur-sm border border-gray-100 px-4 py-1 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
                              {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     )}
                     <ChatBubble message={msg} isOwn={msg.senderUserId === user?.id} />
                  </div>
               );
             })}
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Modern WhatsApp-style Input Bar */}
      <div className="px-8 py-6 bg-white border-t border-gray-50">
        <form onSubmit={handleSend} className="flex items-end gap-4 max-w-5xl mx-auto">
          
          <div className="flex gap-2 pb-2 mr-2">
             <button type="button" className="p-2 text-gray-300 hover:text-emerald-500 transition-colors">
                <Smile size={24} />
             </button>
             <button type="button" className="p-2 text-gray-300 hover:text-emerald-500 transition-colors">
                <Paperclip size={24} />
             </button>
          </div>

          <div className="flex-1 relative">
             <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend(e);
                  }
               }}
               rows={1}
               placeholder="Type a message..."
               className="w-full bg-gray-50/50 border border-gray-100 rounded-[2rem] pl-6 pr-14 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all resize-none min-h-[56px] max-h-[150px] font-medium leading-relaxed"
             />
             <button type="button" className="absolute right-4 bottom-3 p-2 text-gray-300 hover:text-emerald-500 transition-colors">
                <ImageIcon size={20} />
             </button>
          </div>

          <div className="pb-1">
             {text.trim() ? (
                <button 
                  type="submit" 
                  disabled={sending} 
                  className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-90 transition-all disabled:opacity-50"
                >
                  <Send size={20} strokeWidth={3} />
                </button>
             ) : (
                <button 
                  type="button" 
                  className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 active:scale-90 transition-all"
                >
                  <Mic size={20} />
                </button>
             )}
          </div>
        </form>
        <p className="text-center mt-4 text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Encrypted messaging enabled</p>
      </div>
    </div>
  );
}
