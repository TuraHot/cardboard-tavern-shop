import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isTimeoutModalOpen: boolean;
  setIsTimeoutModalOpen: (isOpen: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 1. กำหนดอีเมลที่ต้องการยกเว้นไม่ให้เซสชันหมดอายุตรงนี้ (สามารถใส่ได้หลายอีเมล)
const EXEMPT_EMAILS = ['cardboard.tavern@officialshop.com']; 
const INACTIVITY_LIMIT = 15 * 60 * 1000; // ตั้งเวลาหมดอายุที่ 30 นาที

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ตรวจสอบและติดตามสถานะการล็อกอินผ่าน Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ระบบตรวจจับ Inactivity และตั้งเวลา Timeout
  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 2. ถ้ามี User และอีเมลนั้นตรงกับที่ระบุใน EXEMPT_EMAILS ให้ Return ทิ้งไปเลย (ไม่ต้องจับเวลา)
      if (user?.email && EXEMPT_EMAILS.includes(user.email)) {
        return;
      }

      // 3. สำหรับ User ทั่วไป ให้เริ่มจับเวลา
      if (user) {
        timeoutRef.current = setTimeout(() => {
          setIsTimeoutModalOpen(true);
        }, INACTIVITY_LIMIT);
      }
    };

    // อีเวนต์ที่จะทำให้เวลาถูกรีเซ็ต (ขยับเมาส์, พิมพ์คีย์บอร์ด, เลื่อนจอ ฯลฯ)
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      resetTimer();
    };

    if (user) {
      events.forEach((event) => document.addEventListener(event, handleUserActivity));
      resetTimer(); // เริ่มจับเวลาครั้งแรกเมื่อล็อกอินสำเร็จ
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => document.removeEventListener(event, handleUserActivity));
    };
  }, [user]); // ทำงานใหม่ทุกครั้งเมื่อ state ของ user เปลี่ยน

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsTimeoutModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isTimeoutModalOpen, setIsTimeoutModalOpen }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
