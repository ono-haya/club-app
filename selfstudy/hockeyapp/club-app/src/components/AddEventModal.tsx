import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel
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
  const [locationType, setLocationType] = useState<'学内練習' | '境町練習' | 'その他'>('学内練習');
  const [locationDetail, setLocationDetail] = useState('');
  const [timeType, setTimeType] = useState<'午前' | '放課後' | '1日' | 'その他'>('午前');
  const [timeDetail, setTimeDetail] = useState('');
  const [notes, setNotes] = useState('');

  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
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
    setLocationType('学内練習');
    setLocationDetail('');
    setTimeType('午前');
    setTimeDetail('');
    setNotes('');
    setError(null);
  }, [open, selectedDate]);

  const handleSubmit = async () => {
    if (!start || !end) {
      setError('開始日時と終了日時を入力してください。');
      return;
    }
    if (locationType === 'その他' && !locationDetail) {
      setError('「その他」の場所を具体的に入力してください。');
      return;
    }
    if (timeType === 'その他' && !timeDetail) {
      setError('「その他」の時間を具体的に入力してください。');
      return;
    }
    if (start.getTime() >= end.getTime()) {
      setError('終了時刻は開始時刻より後に設定してください。');
      return;
    }

    setLoading(true);
    setError(null);

    const newEventData = {
      locationType,
      ...(locationType === 'その他' && { locationDetail }),
      timeType,
      ...(timeType === 'その他' && { timeDetail }),
      notes,
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
    };

    const success = await addEvent(newEventData);

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

        {/* 場所の選択 */}
        <FormControl component="fieldset" margin="normal" fullWidth sx={{ mb: 2 }}>
          <FormLabel component="legend">場所</FormLabel>
          <RadioGroup row value={locationType} onChange={(e) => setLocationType(e.target.value as '学内練習' | '境町練習' | 'その他')}>
            <FormControlLabel value="学内練習" control={<Radio />} label="学内練習" />
            <FormControlLabel value="境町練習" control={<Radio />} label="境町練習" />
            <FormControlLabel value="その他" control={<Radio />} label="その他" />
          </RadioGroup>
          {locationType === 'その他' && (
            <TextField
              margin="dense"
              id="locationDetail"
              label="場所（詳細）"
              type="text"
              fullWidth
              variant="standard"
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
            />
          )}
        </FormControl>

        {/* 時間の選択 */}
        <FormControl component="fieldset" margin="normal" fullWidth sx={{ mb: 2 }}>
          <FormLabel component="legend">時間</FormLabel>
          <RadioGroup row value={timeType} onChange={(e) => setTimeType(e.target.value as '午前' | '放課後' | '1日' | 'その他')}>
            <FormControlLabel value="午前" control={<Radio />} label="午前" />
            <FormControlLabel value="放課後" control={<Radio />} label="放課後" />
            <FormControlLabel value="1日" control={<Radio />} label="1日" />
            <FormControlLabel value="その他" control={<Radio />} label="その他" />
          </RadioGroup>
          {timeType === 'その他' && (
            <TextField
              margin="dense"
              id="timeDetail"
              label="時間（詳細）"
              type="text"
              fullWidth
              variant="standard"
              value={timeDetail}
              onChange={(e) => setTimeDetail(e.target.value)}
            />
          )}
        </FormControl>

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

        {/* 備考 (任意) */}
        <TextField
          margin="dense"
          id="notes"
          label="備考 (任意)"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="standard"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
