import React from 'react';
import { NavBar } from './NavBar';

// Agent navigation: five destinations, the Material 3 maximum.
export const TabBar = ({ currentTab, onSelectTab, unreadCount = 0 }) => (
  <NavBar
    // Articles live inside Copilot, so the Copilot tab stays selected there.
    currentTab={currentTab === 'knowledge' ? 'copilot' : currentTab}
    onSelectTab={onSelectTab}
    tabs={[
      { key: 'dashboard', label: 'Queue', icon: 'albums' },
      { key: 'inbox', label: 'Inbox', icon: 'chatbubbles', badge: unreadCount },
      { key: 'copilot', label: 'Copilot', icon: 'sparkles' },
      { key: 'analytics', label: 'Reports', icon: 'stats-chart' },
      { key: 'settings', label: 'Me', icon: 'person' },
    ]}
  />
);
