import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // src/firebase.ts から db オブジェクトをインポート
import { useAuth } from '../context/AuthContext';

export interface Event {
  id: string;
  title: string;
  description: string;
  start: Timestamp;
  end: Timestamp;
  location: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth(); // 現在のユーザー情報を取得

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('start', 'asc')); // 開始日でソート

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsData);
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch events:", err);
      setError("Failed to fetch events.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]); // currentUser が変更されたときに再実行

  const addEvent = async (newEvent: Omit<Event, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) {
      throw new Error("User not authenticated.");
    }
    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (err: any) {
      console.error("Error adding event:", err);
      setError(err.message);
      return false;
    }
  };

  // 他の操作 (updateEvent, deleteEvent) もここに追加可能

  return { events, loading, error, addEvent };
};

export default useEvents;
