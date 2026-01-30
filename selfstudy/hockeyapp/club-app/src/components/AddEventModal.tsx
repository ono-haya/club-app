import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Timestamp } from 'firebase/firestore';
import useEvents from '../hooks/useEvents';
import { ja } from 'date-fns/locale';

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ open, onClose, selectedDate }) => {
  const { addEvent } = useEvents();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      const defaultStart = new Date(selectedDate);
      defaultStart.setHours(9, 0, 0, 0);
      const defaultEnd = new Date(selectedDate);
      defaultEnd.setHours(22, 0, 0, 0);
      setStart(defaultStart);
      setEnd(defaultEnd);
    } else {
      setStart(null);
      setEnd(null);
    }
    setTitle('');
    setDescription('');
    setLocation('');
    setError(null);
  }, [open, selectedDate]);

  const handleSubmit = async () => {
    if (!title || !start || !end || !location) {
      setError('全ての項目を入力してください。');
      return;
    }
    if (start.getTime() >= end.getTime()) {
      setError('終了時刻は開始時刻より後に設定してください。');
      return;
    }

    setLoading(true);
    setError(null);
    const success = await addEvent({
      title,
      description,
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
      location,
    });

    setLoading(false);
    if (success) {
      onClose();
    } else {
      setError('イベントの追加に失敗しました。');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>新しい予定を追加</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          id="title"
          label="タイトル"
          type="text"
          fullWidth
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          id="description"
          label="説明"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="standard"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <DateTimePicker
            label="開始日時"
            value={start}
            onChange={(newValue) => setStart(newValue)}
            sx={{ width: '100%', mb: 2, mt: 1 }}
          />
          <DateTimePicker
            label="終了日時"
            value={end}
            onChange={(newValue) => setEnd(newValue)}
            sx={{ width: '100%', mb: 2 }}
          />
        </LocalizationProvider>
        <TextField
          margin="dense"
          id="location"
          label="場所"
          type="text"
          fullWidth
          variant="standard"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? '追加中...' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEventModal;
