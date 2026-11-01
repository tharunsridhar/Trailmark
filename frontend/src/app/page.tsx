'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Screen0RoleSelection } from '@/components/screens/Screen0RoleSelection';
import { Screen1TeamLeadDashboard } from '@/components/screens/Screen1TeamLeadDashboard';
import { Screen2DepartingQuestions } from '@/components/screens/Screen2DepartingQuestions';
import { Screen3TeamLeadReview } from '@/components/screens/Screen3TeamLeadReview';
import { Screen4IncomingHandover } from '@/components/screens/Screen4IncomingHandover';

export default function Home() {
  const { activeScreen } = useHandover();

  switch (activeScreen) {
    case 'role-select':
      return <Screen0RoleSelection />;
    case 'dashboard':
    case 'create':
      return <Screen1TeamLeadDashboard />;
    case 'questions':
    case 'my-handover-departing':
      return <Screen2DepartingQuestions />;
    case 'review':
      return <Screen3TeamLeadReview />;
    case 'incoming-handover':
    case 'evidence-gaps':
      return <Screen4IncomingHandover />;
    default:
      return <Screen0RoleSelection />;
  }
}

