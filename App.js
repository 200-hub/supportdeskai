import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { COLORS } from './src/theme/colors';
import { useTopInset } from './src/hooks/useTopInset';
import {
  INITIAL_USER,
  INITIAL_TICKETS,
  INITIAL_CONVERSATIONS,
  INITIAL_NOTIFICATIONS,
} from './src/data/mockData';

import { BottomNavigation } from './src/components/common/BottomNavigation';
import { TabBar } from './src/components/common/TabBar';

// All Screens
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
import { InboxScreen } from './src/screens/InboxScreen';
import { AICopilotScreen } from './src/screens/AICopilotScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { KnowledgeBaseScreen } from './src/screens/KnowledgeBaseScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { authService } from './src/services/authService';
import { syncManager } from './src/services/syncManager';
import { offlineStorage } from './src/services/offlineStorage';

export default function App() {
  // Authentication state
  const [authScreen, setAuthScreen] = useState('welcome');

  // Current user
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);

  // Customer navigation tab
  const [customerTab, setCustomerTab] = useState('home');

  // Agent navigation tab: 'dashboard' | 'inbox' | 'copilot' | 'analytics' | 'knowledge' | 'settings'
  const [agentTab, setAgentTab] = useState('dashboard');

  // Modal / Detailed Screen overlay:
  // null | 'create_ticket' | 'ticket_details' | 'conversation_history' | 'notifications' | 'agent_dashboard' | 'admin_settings'
  const [activeOverlay, setActiveOverlay] = useState(null);

  // Application data
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('all');

  // Restore authenticated session and offline cache on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const session = await authService.restoreSession();
        if (session.isAuthenticated && session.user && isMounted) {
          setCurrentUser(session.user);
          setAuthScreen(null);
          // Load tickets from offline cache / backend
          const ticketRes = await syncManager.loadTickets(session.token);
          if (ticketRes.tickets?.length > 0 && isMounted) {
            setTickets(ticketRes.tickets);
          }
          // Process any offline queued actions
          await syncManager.processOfflineQueue(session.token);
        }
      } catch (e) {
        console.warn('Session restoration failed:', e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Authentication handlers
  const handleGetStarted = () => setAuthScreen('register');
  const handleGoToLogin = () => setAuthScreen('login');
  const handleGoToRegister = () => setAuthScreen('register');
  const handleBackToWelcome = () => setAuthScreen('welcome');

  const handleLoginSuccess = ({ email, role, name, user, token }) => {
    const updatedUser = user || {
      ...currentUser,
      email,
      role: role || 'customer',
      name: name || (role === 'agent' ? 'Sayoni Bhattacharjee' : role === 'admin' ? 'Admin Sayoni' : 'Sarah Connor'),
      avatarInitials: role === 'agent' ? 'SB' : role === 'admin' ? 'AS' : 'SC',
    };

    if (token) {
      syncManager.loadTickets(token).then((res) => {
        if (res.tickets?.length > 0) setTickets(res.tickets);
      });
      syncManager.processOfflineQueue(token);
    }

    setCurrentUser(updatedUser);
    setAuthScreen(null);

    if (role === 'agent') {
      setActiveOverlay(null);
      setAgentTab('dashboard');
    } else if (role === 'admin') {
      setActiveOverlay('admin_settings');
    } else {
      setActiveOverlay(null);
      setCustomerTab('home');
    }
  };

  const handleRegisterSuccess = ({ name, email, role }) => {
    const userRole = role || 'customer';
    setCurrentUser({
      ...currentUser,
      name,
      email,
      role: userRole,
      avatarInitials: name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    });

    setAuthScreen(null);
    if (userRole === 'agent') {
      setActiveOverlay(null);
      setAgentTab('dashboard');
    } else if (userRole === 'admin') {
      setActiveOverlay('admin_settings');
    } else {
      setActiveOverlay(null);
      setCustomerTab('home');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(INITIAL_USER);
    setAuthScreen('welcome');
    setActiveOverlay(null);
    setCustomerTab('home');
    setAgentTab('dashboard');
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

  const handleUpdateConversation = (updatedConv) => {
    setSelectedConversation(updatedConv);
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === updatedConv.id);
      if (exists) {
        return prev.map((c) => (c.id === updatedConv.id ? updatedConv : c));
      }
      return [updatedConv, ...prev];
    });
  };

  const handleOpenChatWithConv = (conv) => {
    setSelectedConversation(conv);
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
      setActiveOverlay(null);
      setAgentTab('dashboard');
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

    if (activeOverlay === 'agent_dashboard' || currentUser.role === 'agent') {
      switch (agentTab) {
        case 'inbox':
          return (
            <InboxScreen
              tickets={tickets}
              onSelectTicket={handleOpenTicketDetails}
              onNewTicket={() => setActiveOverlay('create_ticket')}
            />
          );
        case 'copilot':
          return <AICopilotScreen />;
        case 'analytics':
          return <AnalyticsScreen />;
        case 'knowledge':
          return <KnowledgeBaseScreen />;
        case 'settings':
          return <SettingsScreen />;
        case 'dashboard':
        default:
          return (
            <AgentDashboardScreen
              user={currentUser}
              tickets={tickets}
              onSelectTicket={handleOpenTicketDetails}
              onUpdateTicket={handleUpdateTicket}
              onSwitchRole={() => handleCycleRole()}
              onNavigateToNotifications={() => setActiveOverlay('notifications')}
              onNavigateBack={() => {
                handleCycleRole('customer');
              }}
            />
          );
      }
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
            onUpdateConversation={handleUpdateConversation}
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

  const showAgentTabBar =
    authScreen === null &&
    activeOverlay === null &&
    currentUser.role === 'agent';

  const unreadTicketsCount = tickets.filter((t) => t.status === 'open').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryNavy}
      />

      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <StatusBarSpacer />
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

          {/* Agent Bottom TabBar */}
          {showAgentTabBar && (
            <TabBar
              currentTab={agentTab}
              onSelectTab={(tab) => setAgentTab(tab)}
              unreadCount={unreadTicketsCount}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const StatusBarSpacer = () => { const topInset = useTopInset(); return <View style={{ height: topInset }} />; }

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