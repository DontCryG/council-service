import { useState, useEffect } from 'react';
import { db } from '../core/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAppStore } from '../store';

export function useCouncilMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showAlert } = useAppStore();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_state', 'council_members'), (docSnap) => {
      if (docSnap.exists()) {
        setMembers(docSnap.data().members || []);
      } else {
        setMembers([]);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching council members:", err);
      setError(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveMembers = async (newMembers) => {
    try {
      await setDoc(doc(db, 'app_state', 'council_members'), {
        members: newMembers,
        updated_at: new Date().getTime()
      });
      return true;
    } catch (e) {
      console.error("Error saving council members:", e);
      showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      return false;
    }
  };

  return {
    members,
    loading,
    error,
    saveMembers
  };
}
