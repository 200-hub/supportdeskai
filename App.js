import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { COLORS } from './src/theme/colors';

import {
  INITIAL_USER,
  INITIAL_TICKETS,
  INITIAL_CONVERSATIONS,
  INITIAL_NOTIFICATIONS,
} from './src/data/mockData';

import { BottomNavigation } from './src/components/common/BottomNavigation';

// All 14 Screens
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegistrationScreen } from './src/screens/RegistrationScreen';
import { CustomerHomeScreen } from './src/screens/CustomerHomeScreen';
import { AIChatScreen } from './src/screens/AIChatScreen';
import { ConversationHistoryScreen } from './src/screens/ConversationHistoryScreen';
import { MyTicketsScreen } from './src/screens/MyTicketsScreen';
import { CreateTicketScreen } from './src/screens/CreateTicketScreen';
import { TicketDetailsScreen } from './src/screens/TicketDetailsScreen';
import { HelpCenterScreen } from './src/screens/HelpCenterScreen';
import { AgentDashboardScreen } from './src/screens/AgentDashboardScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AdminSettingsScreen } from './src/screens/AdminSettingsScreen';

export default function App() {
  // Authentication state
  const [authScreen, setAuthScreen] = useState('welcome');

  // Current user
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);

  // Customer navigation tab
  const [customerTab, setCustomerTab] = useState('home');

  // Active overlay
  const [activeOverlay, setActiveOverlay] = useState(null);

  // Application data
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('all');

  // Authentication handlers
  const handleGetStarted = () => setAuthScreen('register');
  const handleGoToLogin = () => setAuthScreen('login');
  const handleGoToRegister = () => setAuthScreen('register');
  const handleBackToWelcome = () => setAuthScreen('welcome');

  const handleLoginSuccess = ({ email, role }) => {
    const updatedUser = {
      ...currentUser,
      email,
      role: role || 'customer',
      name:
        role === 'agent'
          ? 'Sayoni Bhattacharjee'
          : role === 'admin'
            ? 'Admin Sayoni'
            : 'Sarah Connor',
      avatarInitials:
        role === 'agent' ? 'SB' : role === 'admin' ? 'AS' : 'SC',
    };

    setCurrentUser(updatedUser);
    setAuthScreen(null);

    if (role === 'agent') {
      setActiveOverlay('agent_dashboard');
    } else if (role === 'admin') {
      setActiveOverlay('admin_settings');
    } else {
      setActiveOverlay(null);
      setCustomerTab('home');
    }
  };

  const handleRegisterSuccess = ({ name, email, role }) => {
    setCurrentUser({
      ...currentUser,
      name,
      email,
      role: role || 'customer',
      avatarInitials: name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    });

    setAuthScreen(null);
    setActiveOverlay(null);
    setCustomerTab('home');
  };

  const handleLogout = () => {
    setCurrentUser(INITIAL_USER);
    setAuthScreen('welcome');
    setActiveOverlay(null);
    setCustomerTab('home');
  };

  // Ticket handlers
  const handleOpenTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setActiveOverlay('ticket_details');
  };

  const handleCreateTicket = (newTicket) => {
    setTickets((previous) => [newTicket, ...previous]);

    const newNotification = {
      id: `notif-${Date.now()}`,
      title: `Ticket #${newTicket.id} Created`,
      description: `Subject: ${newTicket.subject}`,
      time: 'Just now',
      type: 'ticket',
      isRead: false,
      ticketId: newTicket.id,
    };

    setNotifications((previous) => [
      newNotification,
      ...previous,
    ]);
  };

  const handleUpdateTicket = (updatedTicket) => {
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    );

    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket);
    }
  };

  const handleOpenChatWithConv = (conversation) => {
    setSelectedConversation(conversation);
    setActiveOverlay(null);
    setCustomerTab('chat');
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
  };

  // Role switcher
  const handleCycleRole = (explicitRole) => {
    const nextRole =
      explicitRole ||
      (currentUser.role === 'customer'
        ? 'agent'
        : currentUser.role === 'agent'
          ? 'admin'
          : 'customer');

    setCurrentUser({
      ...currentUser,
      role: nextRole,
    });

    if (nextRole === 'agent') {
      setActiveOverlay('agent_dashboard');
    } else if (nextRole === 'admin') {
      setActiveOverlay('admin_settings');
    } else {
      setActiveOverlay(null);
      setCustomerTab('home');
    }
  };

  // Screen rendering
  const renderScreen = () => {
    // Authentication screens
    if (authScreen === 'welcome') {
      return (
        <WelcomeScreen
          onGetStarted={handleGetStarted}
          onLogin={handleGoToLogin}
        />
      );
    }

    if (authScreen === 'login') {
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={handleGoToRegister}
          onNavigateBack={handleBackToWelcome}
        />
      );
    }

    if (authScreen === 'register') {
      return (
        <RegistrationScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={handleGoToLogin}
          onNavigateBack={handleBackToWelcome}
        />
      );
    }

    // Ticket details
    if (activeOverlay === 'ticket_details' && selectedTicket) {
      return (
        <TicketDetailsScreen
          ticket={selectedTicket}
          user={currentUser}
          onNavigateBack={() => setActiveOverlay(null)}
          onUpdateTicket={handleUpdateTicket}
        />
      );
    }

    // Create ticket
    if (activeOverlay === 'create_ticket') {
      return (
        <CreateTicketScreen
          user={currentUser}
          onCreateTicket={handleCreateTicket}
          onNavigateBack={() => setActiveOverlay(null)}
          onViewTicket={handleOpenTicketDetails}
        />
      );
    }

    // Conversation history
    if (activeOverlay === 'conversation_history') {
      return (
        <ConversationHistoryScreen
          conversations={conversations}
          onSelectConversation={handleOpenChatWithConv}
          onNavigateBack={() => setActiveOverlay(null)}
          onNewChat={() => {
            setSelectedConversation(null);
            setActiveOverlay(null);
            setCustomerTab('chat');
          }}
        />
      );
    }

    // Notifications
    if (activeOverlay === 'notifications') {
      return (
        <NotificationsScreen
          notifications={notifications}
          onSelectNotification={(notification) => {
            if (notification.ticketId) {
              const matchedTicket = tickets.find(
                (ticket) => ticket.id === notification.ticketId
              );

              if (matchedTicket) {
                handleOpenTicketDetails(matchedTicket);
                return;
              }
            }

            setActiveOverlay(null);
          }}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onNavigateBack={() => setActiveOverlay(null)}
        />
      );
    }

    // Agent dashboard
    if (
      activeOverlay === 'agent_dashboard' ||
      currentUser.role === 'agent'
    ) {
      return (
        <AgentDashboardScreen
          user={currentUser}
          tickets={tickets}
          onSelectTicket={handleOpenTicketDetails}
          onSwitchRole={() => handleCycleRole()}
          onNavigateToNotifications={() =>
            setActiveOverlay('notifications')
          }
          onNavigateBack={() => handleCycleRole('customer')}
        />
      );
    }

    // Admin settings
    if (
      activeOverlay === 'admin_settings' ||
      currentUser.role === 'admin'
    ) {
      return (
        <AdminSettingsScreen
          user={currentUser}
          onNavigateBack={() => handleCycleRole('customer')}
          onSwitchRole={() => handleCycleRole()}
          onLogout={handleLogout}
        />
      );
    }

    // Customer tabs
    switch (customerTab) {
      case 'home':
        return (
          <CustomerHomeScreen
            user={currentUser}
            tickets={tickets}
            conversations={conversations}
            notifications={notifications}
            onNavigateToTicketDetails={handleOpenTicketDetails}
            onNavigateToMyTickets={(filter) => {
              setTicketFilter(filter || 'all');
              setCustomerTab('tickets');
            }}
            onNavigateToCreateTicket={() =>
              setActiveOverlay('create_ticket')
            }
            onNavigateToChat={(conversation) => {
              if (conversation) {
                setSelectedConversation(conversation);
              }
              setCustomerTab('chat');
            }}
            onNavigateToHistory={() =>
              setActiveOverlay('conversation_history')
            }
            onNavigateToHelpCenter={() => setCustomerTab('help')}
            onNavigateToNotifications={() =>
              setActiveOverlay('notifications')
            }
            onSwitchRole={() => handleCycleRole()}
          />
        );

      case 'tickets':
        return (
          <MyTicketsScreen
            tickets={tickets}
            initialFilter={ticketFilter}
            onSelectTicket={handleOpenTicketDetails}
            onNavigateToCreateTicket={() =>
              setActiveOverlay('create_ticket')
            }
          />
        );

      case 'chat':
        return (
          <AIChatScreen
            initialConversation={selectedConversation}
            onNavigateBack={() => setCustomerTab('home')}
            onNavigateToHistory={() =>
              setActiveOverlay('conversation_history')
            }
            onEscalateToTicket={() =>
              setActiveOverlay('create_ticket')
            }
          />
        );

      case 'help':
        return (
          <HelpCenterScreen
            onNavigateToCreateTicket={() =>
              setActiveOverlay('create_ticket')
            }
            onNavigateToChat={() => setCustomerTab('chat')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onNavigateToHelpCenter={() => setCustomerTab('help')}
            onNavigateToAdminSettings={() =>
              setActiveOverlay('admin_settings')
            }
            onSwitchRole={(role) => handleCycleRole(role)}
            onLogout={handleLogout}
          />
        );

      default:
        return (
          <CustomerHomeScreen
            user={currentUser}
            tickets={tickets}
            conversations={conversations}
            notifications={notifications}
            onNavigateToTicketDetails={handleOpenTicketDetails}
            onNavigateToMyTickets={() => setCustomerTab('tickets')}
            onNavigateToCreateTicket={() =>
              setActiveOverlay('create_ticket')
            }
            onNavigateToChat={() => setCustomerTab('chat')}
            onNavigateToHistory={() =>
              setActiveOverlay('conversation_history')
            }
            onNavigateToHelpCenter={() => setCustomerTab('help')}
            onNavigateToNotifications={() =>
              setActiveOverlay('notifications')
            }
            onSwitchRole={() => handleCycleRole()}
          />
        );
    }
  };

  const showBottomNav =
    authScreen === null &&
    activeOverlay === null &&
    currentUser.role === 'customer' &&
    customerTab !== 'chat'; // Hide bottom nav on chat tab so AIChatScreen fills the full screen

  const unreadTicketsCount = tickets.filter(
    (ticket) => ticket.status === 'open'
  ).length;

  const unreadNotifsCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryNavy}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderScreen()}

          {showBottomNav && (
            <BottomNavigation
              currentTab={customerTab}
              onSelectTab={(tab) => setCustomerTab(tab)}
              ticketBadge={unreadTicketsCount}
              chatBadge={1}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryNavy,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
});