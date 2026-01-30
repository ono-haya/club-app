import React, { useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import useUsers, { type UserProfile } from '../hooks/useUsers';
import useEvents, { type Event } from '../hooks/useEvents';
import useAllAbsences from '../hooks/useAllAbsences';

interface UserRanking extends UserProfile {
  attendanceRate: number;
  attendedEvents: number;
  totalEvents: number;
}

const Ranking: React.FC = () => {
  const { currentUser } = useAuth();
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { events, loading: eventsLoading, error: eventsError } = useEvents(); // 全イベント取得済み
  const { allAbsences, loading: absencesLoading, error: absencesError } = useAllAbsences();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const rankingData = useMemo(() => {
    if (usersLoading || eventsLoading || absencesLoading) {
      return [];
    }
    if (usersError || eventsError || absencesError) {
      return [];
    }

    const today = new Date();
    // 過去のイベントのみを対象にする (終了日時が今日より前のイベント)
    const pastEvents = events.filter(event => event.end.toDate() < today);

    const userAttendance: { [key: string]: { totalEvents: number; attendedEvents: number } } = {};

    users.forEach(user => {
      userAttendance[user.uid] = { totalEvents: 0, attendedEvents: 0 };
    });

    pastEvents.forEach(event => {
      users.forEach(user => {
        userAttendance[user.uid].totalEvents++; // 各ユーザーにとっての総活動日数

        const isUserAbsent = allAbsences.some(absence =>
          absence.eventId === event.id && absence.userId === user.uid
        );

        if (!isUserAbsent) {
          userAttendance[user.uid].attendedEvents++;
        }
      });
    });

    const calculatedRanking: UserRanking[] = users.map(user => {
      const stats = userAttendance[user.uid];
      const attendanceRate = stats.totalEvents > 0
        ? (stats.attendedEvents / stats.totalEvents) * 100
        : 0;

      return {
        ...user,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)), // 小数点以下2桁に丸める
        attendedEvents: stats.attendedEvents,
        totalEvents: stats.totalEvents,
      };
    });

    // 出席率で降順にソート
    return calculatedRanking.sort((a, b) => b.attendanceRate - a.attendanceRate);

  }, [users, events, allAbsences, usersLoading, eventsLoading, absencesLoading, usersError, eventsError, absencesError]);


  if (usersLoading || eventsLoading || absencesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>ランキングデータを読み込み中...</Typography>
      </Box>
    );
  }

  if (usersError || eventsError || absencesError) {
    return <Alert severity="error">ランキングデータの取得に失敗しました: {usersError || eventsError || absencesError}</Alert>;
  }


  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Club App - 出席率ランキング
          </Typography>
          {currentUser && (
            <Button color="inherit" onClick={handleLogout}>
              ログアウト
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3, maxWidth: 800, width: '100%' }}>
        <Typography variant="h4" gutterBottom align="center">
          出席率ランキング
        </Typography>
        <List>
          {rankingData.map((user, index) => (
            <React.Fragment key={user.uid}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{index + 1}. {user.displayName || user.email}</Typography>
                      <Typography variant="h6">{user.attendanceRate}%</Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ width: '100%', mt: 0.5 }}>
                      <LinearProgress variant="determinate" value={user.attendanceRate} sx={{ height: 10, borderRadius: 5 }} />
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        {user.attendedEvents} / {user.totalEvents} 回出席
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Ranking;
