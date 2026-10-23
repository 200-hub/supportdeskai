import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/theme/colors';
import {
  INITIAL_USER,
  INITIAL_TICKETS,
  INITIAL_CONVERSATIONS,
  INITIAL_NOTIFICATIONS,
} from './src/data/mockData';

// Reusable Navigation
import { BottomNavigation } from './src/components/common/BottomNavigation';

// All 14 Screens
import { WelcomeScreen } from './src/screens/WelcomeScreen'; // Screen 1
import { LoginScreen } from './src/screens/LoginScreen'; // Screen 2
import { RegistrationScreen } from './src/screens/RegistrationScreen'; // Screen 3
import { CustomerHomeScreen } from './src/screens/CustomerHomeScreen'; // Screen 4
import { AIChatScreen } from './src/screens/AIChatScreen'; // Screen 5
import { ConversationHistoryScreen } from './src/screens/ConversationHistoryScreen'; // Screen 6
import { MyTicketsScreen } from './src/screens/MyTicketsScreen'; // Screen 7
import { CreateTicketScreen } from './src/screens/CreateTicketScreen'; // Screen 8
import { TicketDetailsScreen } from './src/screens/TicketDetailsScreen'; // Screen 9
import { HelpCenterScreen } from './src/screens/HelpCenterScreen'; // Screen 10
import { AgentDashboardScreen } from './src/screens/AgentDashboardScreen'; // Screen 11
import { NotificationsScreen } from './src/screens/NotificationsScreen'; // Screen 12
import { ProfileScreen } from './src/screens/ProfileScreen'; // Screen 13
import { AdminSettingsScreen } from './src/screens/AdminSettingsScreen'; // Screen 14

export default function App() {
  // Authentication state: 'welcome' | 'login' | 'register' | null (authenticated)
  const [authScreen, setAuthScreen] = useState('welcome');

  // User state with role: 'customer' | 'agent' | 'admin'
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);

  // Customer navigation tab: 'home' | 'tickets' | 'chat' | 'help' | 'profile'
  const [customerTab, setCustomerTab] = useState('home');

  // Modal / Detailed Screen overlay:
  // null | 'create_ticket' | 'ticket_details' | 'conversation_history' | 'notifications' | 'agent_dashboard' | 'admin_settings'
  const [activeOverlay, setActiveOverlay] = useState(null);

  // Data states
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('all');

  // Handlers for Authentication
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
        role === 'agent'
          ? 'SB'
          : role === 'admin'
          ? 'AS'
          : 'SC',
    };
    setCurrentUser(updatedUser);
    setAuthScreen(null);

    // If agent or admin, open respective view directly
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
        .map((p) => p[0])
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

  // Handlers for Tickets & Chat
  const handleOpenTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setActiveOverlay('ticket_details');
  };

  const handleCreateTicket = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    // Also create a notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `Ticket #${newTicket.id} Created`,
      description: `Subject: ${newTicket.subject}`,
      time: 'Just now',
      type: 'ticket',
      isRead: false,
      ticketId: newTicket.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleUpdateTicket = (updated) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTicket && selectedTicket.id === updated.id) {
      setSelectedTicket(updated);
    }
  };

  const handleOpenChatWithConv = (conv) => {
    setSelectedConversation(conv);
    setActiveOverlay(null);
    setCustomerTab('chat');
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Persona / Role Switcher toggle (Customer -> Agent -> Admin -> Customer)
  const handleCycleRole = (explicitRole) => {
    const nextRole =
      explicitRole ||
      (currentUser.role === 'customer'
        ? 'agent'
        : currentUser.role === 'agent'
        ? 'admin'
        : 'customer');

    const updated = { ...currentUser, role: nextRole };
    setCurrentUser(updated);

    if (nextRole === 'agent') {
      setActiveOverlay('agent_dashboard');
    } else if (nextRole === 'admin') {
      setActiveOverlay('admin_settings');
    } else {
      setActiveOverlay(null);
      setCustomerTab('home');
    }
  };

  // Screen Rendering Logic
  const renderScreen = () => {
    // 1. Unauthenticated screens
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

    // 2. Overlay / Modal Screens (Can be opened from anywhere)
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

    if (activeOverlay === 'create_ticket') {
      return (
        <CreateTicketScreen
          user={currentUser}
          onCreateTicket={handleCreateTicket}
          onNavigateBack={() => setActiveOverlay(null)}
          onViewTicket={(ticket) => handleOpenTicketDetails(ticket)}
        />
      );
    }

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

    if (activeOverlay === 'notifications') {
      return (
        <NotificationsScreen
          notifications={notifications}
          onSelectNotification={(notif) => {
            if (notif.ticketId) {
              const matched = tickets.find((t) => t.id === notif.ticketId);
              if (matched) {
                handleOpenTicketDetails(matched);
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

    if (activeOverlay === 'agent_dashboard' || currentUser.role === 'agent') {
      return (
        <AgentDashboardScreen
          user={currentUser}
          tickets={tickets}
          onSelectTicket={handleOpenTicketDetails}
          onSwitchRole={() => handleCycleRole()}
          onNavigateToNotifications={() => setActiveOverlay('notifications')}
          onNavigateBack={() => {
            handleCycleRole('customer');
          }}
        />
      );
    }

    if (activeOverlay === 'admin_settings' || currentUser.role === 'admin') {
      return (
        <AdminSettingsScreen
          user={currentUser}
          onNavigateBack={() => {
            handleCycleRole('customer');
          }}
          onSwitchRole={() => handleCycleRole()}
          onLogout={handleLogout}
        />
      );
    }

    // 3. Customer Tab Screens
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
            onNavigateToCreateTicket={() => setActiveOverlay('create_ticket')}
            onNavigateToChat={(conv) => {
              if (conv) setSelectedConversation(conv);
              setCustomerTab('chat');
            }}
            onNavigateToHistory={() => setActiveOverlay('conversation_history')}
            onNavigateToHelpCenter={() => setCustomerTab('help')}
            onNavigateToNotifications={() => setActiveOverlay('notifications')}
            onSwitchRole={() => handleCycleRole()}
          />
        );

      case 'tickets':
        return (
          <MyTicketsScreen
            tickets={tickets}
            initialFilter={ticketFilter}
            onSelectTicket={handleOpenTicketDetails}
            onNavigateToCreateTicket={() => setActiveOverlay('create_ticket')}
          />
        );

      case 'chat':
        return (
          <AIChatScreen
            initialConversation={selectedConversation}
            onNavigateBack={() => setCustomerTab('home')}
            onNavigateToHistory={() => setActiveOverlay('conversation_history')}
            onEscalateToTicket={() => setActiveOverlay('create_ticket')}
          />
        );

      case 'help':
        return (
          <HelpCenterScreen
            onNavigateToCreateTicket={() => setActiveOverlay('create_ticket')}
            onNavigateToChat={() => setCustomerTab('chat')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onNavigateToHelpCenter={() => setCustomerTab('help')}
            onNavigateToAdminSettings={() => setActiveOverlay('admin_settings')}
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
            onNavigateToCreateTicket={() => setActiveOverlay('create_ticket')}
            onNavigateToChat={() => setCustomerTab('chat')}
            onNavigateToHistory={() => setActiveOverlay('conversation_history')}
            onNavigateToHelpCenter={() => setCustomerTab('help')}
            onNavigateToNotifications={() => setActiveOverlay('notifications')}
            onSwitchRole={() => handleCycleRole()}
          />
        );
    }
  };

  const showBottomNav =
    authScreen === null &&
    activeOverlay === null &&
    currentUser.role === 'customer';

  const unreadTicketsCount = tickets.filter((t) => t.status === 'open').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryNavy} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderScreen()}

          {/* Customer Bottom Navigation Bar */}
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
