import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const SessionTimeoutModal = () => {
  const { user, isTimeoutModalOpen, setIsTimeoutModalOpen, signOut } = useAuth();
  
  // กำหนดให้ตรงกับไฟล์ AuthContext
  const EXEMPT_EMAILS = ['cardboard.tavern@officialshop.com']; 

  // ป้องกันการเรนเดอร์ Modal สำหรับอีเมลที่ยกเว้น หรือในกรณีที่ Modal ยังไม่ถูกสั่งให้เปิด
  if (!isTimeoutModalOpen || (user?.email && EXEMPT_EMAILS.includes(user.email))) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    // ถ้าใช้ react-router-dom สามารถใช้ navigate('/login') แทนการ reload ได้
    window.location.href = '/'; 
  };

  const handleContinue = () => {
    setIsTimeoutModalOpen(false);
    // เมื่อกด "ใช้งานต่อ" (เกิด Event click/mousedown) 
    // ตัว Timer ใน AuthContext จะถูกรีเซ็ตใหม่อัตโนมัติทันที
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-yellow-100 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            เซสชันของคุณกำลังจะหมดอายุ
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            ระบบตรวจพบว่าคุณไม่ได้ใช้งานเป็นระยะเวลาหนึ่ง เพื่อความปลอดภัย กรุณายืนยันว่าคุณยังต้องการใช้งานต่อหรือไม่?
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogout}
            className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-red-600 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            ออกจากระบบ
          </button>
          <button
            onClick={handleContinue}
            className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            ใช้งานต่อ
          </button>
        </div>
      </div>
    </div>
  );
};
