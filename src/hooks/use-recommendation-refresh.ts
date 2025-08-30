
'use client';

import { useState, useEffect } from 'react';
import { shouldPromptForRefresh } from '@/lib/preferences';

export function useRecommendationRefresh() {
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);

  useEffect(() => {
    if (shouldPromptForRefresh()) {
      setShowRefreshDialog(true);
    }
  }, []);

  return { showRefreshDialog, setShowRefreshDialog };
}
