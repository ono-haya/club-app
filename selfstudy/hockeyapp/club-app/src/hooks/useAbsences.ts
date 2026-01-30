import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export interface Absence {
  id: string;
  userId: string;
  eventId: string;
  reason?: string;
  createdAt: Timestamp;
}

const useAbsences = () => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const absencesRef = collection(db, 'absences');
    // 現在のユーザーに関連する欠席情報のみを取得
    const q = query(absencesRef, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const absencesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Absence[];
      setAbsences(absencesData);
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch absences:", err);
      setError("Failed to fetch absences.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addAbsence = async (eventId: string, reason?: string) => {
    if (!currentUser) {
      throw new Error("User not authenticated.");
    }
    try {
      await addDoc(collection(db, 'absences'), {
        userId: currentUser.uid,
        eventId,
        reason: reason || null,
        createdAt: Timestamp.now(),
      });
      return true;
    } catch (err: any) {
      console.error("Error adding absence:", err);
      setError(err.message);
      return false;
    }
  };

  const removeAbsence = async (absenceId: string) => {
    if (!currentUser) {
      throw new Error("User not authenticated.");
    }
    try {
      // ユーザーが自身の欠席のみを削除できることを保証するためのチェック（省略可、セキュリティルールで制御推奨）
      const absenceToRemove = absences.find(abs => abs.id === absenceId);
      if (absenceToRemove && absenceToRemove.userId !== currentUser.uid) {
        throw new Error("Unauthorized to remove this absence.");
      }

      await deleteDoc(doc(db, 'absences', absenceId));
      return true;
    } catch (err: any) {
      console.error("Error removing absence:", err);
      setError(err.message);
      return false;
    }
  };

  // 特定のイベントIDに対するユーザーの欠席があるかチェックするヘルパー関数
  const isAbsent = (eventId: string) => {
    return absences.some(abs => abs.eventId === eventId && abs.userId === currentUser?.uid);
  };

  return { absences, loading, error, addAbsence, removeAbsence, isAbsent };
};

export default useAbsences;
