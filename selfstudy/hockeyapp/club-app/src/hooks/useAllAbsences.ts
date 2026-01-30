import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Absence } from './useAbsences'; // 既存のAbsenceインターフェースを再利用

const useAllAbsences = () => {
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const absencesRef = collection(db, 'absences');
    const q = query(absencesRef, orderBy('createdAt', 'desc')); // 作成日時でソート

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const absencesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Absence[];
      setAllAbsences(absencesData);
      setLoading(false);
    }, (err) => {
      console.error("Firebase error fetching all absences:", err);
      setError(`Failed to fetch all absences: ${err.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // ユーザーの認証状態に依存せず、すべての欠席を取得

  return { allAbsences, loading, error };
};

export default useAllAbsences;
