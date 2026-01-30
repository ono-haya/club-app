import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Event } from '../hooks/useEvents';
import useAbsences from '../hooks/useAbsences';
import { useAuth } from '../context/AuthContext';

interface EventDetailsModalProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ open, onClose, event }) => {
  const { currentUser } = useAuth();
  const { absences, addAbsence, removeAbsence, isAbsent } = useAbsences();
  const [absenceStatus, setAbsenceStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event && currentUser) {
      setAbsenceStatus(isAbsent(event.id));
    }
  }, [event, currentUser, isAbsent]);

  const handleToggleAbsence = async () => {
    if (!event || !currentUser) return;
    setLoading(true);
    setError(null);

    try {
      if (absenceStatus) {
        // 欠席を取り消す
        const absenceRecord = absences.find(abs => abs.eventId === event.id && abs.userId === currentUser.uid);
        if (absenceRecord) {
          await removeAbsence(absenceRecord.id);
          setAbsenceStatus(false);
        }
      } else {
        // 欠席を登録する
        await addAbsence(event.id);
        setAbsenceStatus(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{event.title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>日時:</strong> {format(event.start.toDate(), 'yyyy年M月d日 (EE) HH:mm', { locale: ja })} 〜 {format(event.end.toDate(), 'HH:mm', { locale: ja })}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>場所:</strong> {event.location}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {event.description}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color={absenceStatus ? "secondary" : "primary"}
            onClick={handleToggleAbsence}
            disabled={loading}
            fullWidth
          >
            {loading ? '処理中...' : (absenceStatus ? '欠席を取り消す' : 'この予定を欠席する')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsModal;
