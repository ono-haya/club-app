import React from 'react';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import useAbsences from '../hooks/useAbsences';
import { useAuth } from '../context/AuthContext';

interface AbsenceCounterProps {
  // 必要であれば、特定のユーザーのUIDを渡せるようにする
  // userId?: string;
}

const AbsenceCounter: React.FC<AbsenceCounterProps> = (/* { userId } */) => {
  const { currentUser } = useAuth();
  const { absences, loading, error } = useAbsences(); // useAbsencesフックは現在のユーザーの欠席のみを取得するように実装済み

  if (!currentUser) {
    return <Alert severity="info">ログインして欠席状況を確認してください。</Alert>;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 1 }}>欠席状況を読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
      <Typography variant="h6" component="p" gutterBottom>
        あなたの現在の欠席回数: <strong>{absences.length}</strong> 回
      </Typography>
      {/* 将来的に他のユーザーの欠席数を表示する際のためのコメント
      <Typography variant="body2">
        最新の欠席: {absences.length > 0 ? absences[0].createdAt.toDate().toLocaleDateString() : 'なし'}
      </Typography>
      */}
    </Box>
  );
};

export default AbsenceCounter;
