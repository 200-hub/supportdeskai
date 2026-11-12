import React from 'react';
import { NavBar } from './NavBar';

// Customer navigation.
export const BottomNavigation = ({ currentTab, onSelectTab, ticketBadge = 0, chatBadge = 0 }) => (
  <NavBar
    currentTab={currentTab}
    onSelectTab={onSelectTab}
    tabs={[
      { key: 'home', label: 'Home', icon: 'home' },
      { key: 'tickets', label: 'Tickets', icon: 'ticket', badge: ticketBadge },
      { key: 'chat', label: 'Assistant', icon: 'chatbubbles', badge: chatBadge },
      { key: 'help', label: 'Help', icon: 'help-circle' },
      { key: 'profile', label: 'Profile', icon: 'person' },
    ]}
  />
);
