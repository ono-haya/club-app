import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import AddEventModal from '../components/AddEventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import AbsenceCounter from '../components/AbsenceCounter';
import useEvents, { type Event } from '../hooks/useEvents';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Value>(new Date());
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [dateForAddEventModal, setDateForAddEventModal] = useState<Date | undefined>(undefined);

  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { events, loading, error } = useEvents();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCalendarDayClick = (date: Date) => {
    setDateForAddEventModal(date);
    setIsAddEventModalOpen(true);
  };

  const handleCloseAddEventModal = () => {
    setIsAddEventModalOpen(false);
    setDateForAddEventModal(undefined);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailsModalOpen(true);
  };

  const handleCloseEventDetailsModal = () => {
    setIsEventDetailsModalOpen(false);
    setSelectedEvent(null);
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayEvents = events.filter(event =>
        event.start.toDate().toDateString() === date.toDateString()
      );

      return (
        <Box>
          {dayEvents.map(event => (
            <Typography
              key={event.id}
              variant="caption"
              display="block"
              sx={{
                fontSize: '0.6rem',
                color: 'blue',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleEventClick(event);
              }}
            >
              {event.title}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };
  
  const activeDate = Array.isArray(selectedCalendarDate) ? selectedCalendarDate[0] : selectedCalendarDate;
  
  const eventsForSelectedDate = activeDate ? events.filter(event =>
    event.start.toDate().toDateString() === activeDate.toDateString()
  ) : [];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Club App
          </Typography>
          {currentUser && (
            <Button color="inherit" onClick={handleLogout}>
              ログアウト
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          ようこそ、{currentUser?.email}さん！
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          ここはメンバー専用のページです。
        </Typography>
        <AbsenceCounter />
        {loading && <Typography>予定を読み込み中...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center">
          <Calendar
            onChange={setSelectedCalendarDate}
            value={selectedCalendarDate}
            onClickDay={handleCalendarDayClick}
            tileContent={tileContent}
            locale="ja-JP"
          />
          <Box sx={{ mt: 3, width: '100%', maxWidth: 800 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {activeDate ? format(activeDate, 'yyyy年M月d日 (EE)', { locale: ja }) : ''} の予定
            </Typography>
            {eventsForSelectedDate.length > 0 ? (
              <List>
                {eventsForSelectedDate.map(event => (
                  <React.Fragment key={event.id}>
                    <ListItemButton onClick={() => handleEventClick(event)}>
                      <ListItemText
                        primary={event.title}
                        secondary={`${format(event.start.toDate(), 'HH:mm', { locale: ja })} - ${format(event.end.toDate(), 'HH:mm', { locale: ja })} @ ${event.location} - ${event.description}`}
                      />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography>この日には予定がありません。</Typography>
            )}
          </Box>
        </Box>
      </Box>
      <AddEventModal
        open={isAddEventModalOpen}
        onClose={handleCloseAddEventModal}
        selectedDate={dateForAddEventModal}
      />
      <EventDetailsModal
        open={isEventDetailsModalOpen}
        onClose={handleCloseEventDetailsModal}
        event={selectedEvent}
      />
    </Box>
  );
};

export default Home;
