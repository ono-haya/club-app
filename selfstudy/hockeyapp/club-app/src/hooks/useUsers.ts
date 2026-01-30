import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
}

const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'asc')); // 登録日時でソート

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id, // ドキュメントIDをuidとして使用
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      console.error("Firebase error fetching users:", err);
      setError(`Failed to fetch users: ${err.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // 認証状態に依存しない（全てのユーザーを取得するため）

  return { users, loading, error };
};

export default useUsers;
