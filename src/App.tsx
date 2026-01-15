import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './styles/variables.css';
import './styles/global.css';
import BottomNav from './components/layout/BottomNav';
import Header from './components/common/Header';
import AuthPage from './pages/auth/AuthPage';
import Home from './pages/home/Home';
import ProductDetail from './pages/products/ProductDetail';
import ChatRoom from './pages/chat/ChatRoom';
import MessagesList from './pages/chat/MessagesList';
import SellerDashboard from './pages/seller/SellerDashboard';
import AddProduct from './pages/seller/AddProduct';
import EditProduct from './pages/seller/EditProduct';
import EditStore from './pages/seller/EditStore';
import AffiliateDashboard from './pages/affiliate/AffiliateDashboard';
import OrdersList from './pages/orders/OrdersList';
import ProfilePage from './pages/profile/ProfilePage';
import AccountSettings from './pages/profile/AccountSettings';
import TransactionHistory from './pages/profile/TransactionHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import StorePage from './pages/store/StorePage';
import PaymentSuccess from './pages/orders/PaymentSuccess';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

function AppContent() {
    const { user, profile, loading } = useAuth();
    const routerLocation = useLocation();
    const location = window.location;

    // Global Affiliate Tracking
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ref = params.get('ref');
        if (ref) {
            console.log("Affiliate tracking detected:", ref);
            sessionStorage.setItem('zwa_affiliate_id', ref);
            // Optional: Remove ref from URL to keep it clean
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, '', newUrl);
        }
    }, [location.search]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#121212',
                color: 'var(--primary)',
                gap: '20px'
            }}>
                <div className="loading-spinner"></div>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Chargement...</span>
            </div>
        );
    }

    // Hide bottom nav only on admin routes, not based on user role
    const isAdminRoute = routerLocation.pathname.startsWith('/admin');

    return (
        <div className="app-container">
            {user && <Header />}
            <main style={{ flex: 1, paddingBottom: isAdminRoute ? '0' : '90px', width: '100%' }}>
                <Routes>
                    <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />

                    {/* Public Routes - Accessible to visitors */}
                    <Route path="/" element={<Home />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/store/:sellerId" element={<StorePage />} />
                    <Route path="/search" element={<Navigate to="/" replace />} />

                    {/* Protected Routes - Require authentication */}
                    <Route path="/messages" element={user ? <MessagesList /> : <Navigate to="/auth" />} />
                    <Route path="/chat/:id" element={user ? <ChatRoom /> : <Navigate to="/auth" />} />
                    <Route path="/orders" element={user ? <OrdersList /> : <Navigate to="/auth" />} />
                    <Route path="/payment-success" element={user ? <PaymentSuccess /> : <Navigate to="/auth" />} />
                    <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
                    <Route path="/profile/settings" element={user ? <AccountSettings /> : <Navigate to="/auth" />} />
                    <Route path="/profile/transactions" element={user ? <TransactionHistory /> : <Navigate to="/auth" />} />

                    {/* Admin Routes */}
                    <Route
                        path="/admin"
                        element={user && profile?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />}
                    />

                    {/* Seller Routes */}
                    <Route path="/seller/dashboard" element={user ? <SellerDashboard /> : <Navigate to="/auth" />} />
                    <Route path="/seller/add-product" element={user ? <AddProduct /> : <Navigate to="/auth" />} />
                    <Route path="/seller/edit-product/:id" element={user ? <EditProduct /> : <Navigate to="/auth" />} />
                    <Route path="/seller/edit-store" element={user ? <EditStore /> : <Navigate to="/auth" />} />

                    {/* Affiliate Routes */}
                    <Route
                        path="/affiliate"
                        element={
                            user ? (
                                profile?.role === 'affiliate' ? <AffiliateDashboard /> :
                                    profile ? <Navigate to="/" /> : null // Show nothing (or a loader) while profile is fetching
                            ) : <Navigate to="/auth" />
                        }
                    />
                </Routes>
            </main>
            {!isAdminRoute && <BottomNav />}
        </div>
    );
}

export default App;
