
import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, User, Book } from './types';
import Login from './pages/Login';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Publish from './pages/Publish';
import Detail from './pages/Detail';
import Chat from './pages/Chat';
import Verification from './pages/Verification';
import Messages from './pages/Messages';
import PublishRequest from './pages/PublishRequest';
import MyPublished from './pages/MyPublished';
import Sold from './pages/Sold';
import Buying from './pages/Buying';
import OrderDetail from './pages/OrderDetail';

const MOCK_USER: User = {
  id: 'user_1',
  phone: '138****0000',
  name: 'Alex Rivera',
  avatar: 'https://picsum.photos/seed/alex/200/200',
  isVerified: true,
  creditScore: 95,
  department: '计算机科学',
  schoolName: '斯坦福大学',
  campus: '南校区',
  joinedDays: 365,
  likes: 1280
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const navigateTo = useCallback((newView: ViewState) => {
    setView(newView);
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser({ ...MOCK_USER, ...user });
    setView('HOME');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setView('LOGIN');
  }, []);

  const handleViewBook = useCallback((book: Book) => {
    setSelectedBook(book);
    navigateTo('DETAIL');
  }, [navigateTo]);

  const handleOpenChat = useCallback((book: Book) => {
    setSelectedBook(book);
    navigateTo('CHAT');
  }, [navigateTo]);

  const renderContent = () => {
    switch (view) {
      case 'LOGIN':
        return <Login onLogin={handleLogin} />;
      case 'HOME':
        return <Home onNavigate={navigateTo} onSelectBook={handleViewBook} />;
      case 'SEARCH':
        return <Search onNavigate={navigateTo} onSelectBook={handleViewBook} />;
      case 'PUBLISH':
        return <Publish onNavigate={navigateTo} user={currentUser} />;
      case 'PUBLISH_REQUEST':
        return <PublishRequest onNavigate={navigateTo} />;
      case 'MY_PUBLISHED':
        return <MyPublished onNavigate={navigateTo} />;
      case 'SOLD':
        return <Sold onNavigate={navigateTo} />;
      case 'BUYING':
        return <Buying onNavigate={navigateTo} />;
      case 'MESSAGES':
        return <Messages onNavigate={navigateTo} onOpenChat={handleOpenChat} />;
      case 'PROFILE':
        return (
          <Profile 
            user={currentUser || MOCK_USER} 
            onNavigate={navigateTo} 
            onStartVerification={() => navigateTo('VERIFICATION')}
            onLogout={handleLogout}
          />
        );
      case 'DETAIL':
        return <Detail book={selectedBook} onNavigate={navigateTo} onChat={() => navigateTo('CHAT')} />;
      case 'CHAT':
        return <Chat book={selectedBook} onNavigate={navigateTo} />;
      case 'ORDER_DETAIL':
        return <OrderDetail onNavigate={navigateTo} />;
      case 'VERIFICATION':
        return (
          <Verification 
            onNavigate={navigateTo} 
            onComplete={() => {
              if (currentUser) setCurrentUser({ ...currentUser, isVerified: true });
              navigateTo('PROFILE');
            }} 
          />
        );
      default:
        return <Home onNavigate={navigateTo} onSelectBook={handleViewBook} />;
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen">
      <div className="w-full max-w-[480px] bg-white relative flex flex-col shadow-2xl overflow-hidden h-screen">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
