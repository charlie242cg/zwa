import React, { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import OverviewTab from './components/OverviewTab';
import CategoryTab from './components/CategoryTab';
import CityTab from './components/CityTab';
import WithdrawalTab from './components/WithdrawalTab';
import ModerationTab from './components/ModerationTab';
import DisputeTab from './components/DisputeTab';
import SettingsTab from './components/SettingsTab';
import { Menu, X as CloseIcon } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'categories': return <CategoryTab />;
            case 'cities': return <CityTab />;
            case 'withdrawals': return <WithdrawalTab />;
            case 'settings': return <SettingsTab />;
            case 'moderation': return <ModerationTab />;
            case 'disputes': return <DisputeTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div style={styles.dashboardLayout}>
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    style={styles.overlay}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div style={{
                ...styles.sidebarWrapper,
                transform: !isMobile || isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            }}>
                <AdminSidebar
                    activeTab={activeTab}
                    setActiveTab={(tab) => {
                        setActiveTab(tab);
                        if (isMobile) setIsSidebarOpen(false);
                    }}
                />
            </div>

            {/* Main Content */}
            <main style={styles.main}>
                <header style={styles.header}>
                    <div style={styles.headerTitleRow}>
                        {isMobile && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                style={styles.menuBtn}
                            >
                                <Menu size={24} />
                            </button>
                        )}
                        <h1 style={styles.title}>
                            {activeTab === 'overview' && 'Tableau de Bord 🛡️'}
                            {activeTab === 'categories' && 'Catalogues'}
                            {activeTab === 'cities' && 'Localisations'}
                            {activeTab === 'withdrawals' && 'Finances'}
                            {activeTab === 'settings' && 'Paramètres'}
                            {activeTab === 'moderation' && 'Modération'}
                            {activeTab === 'disputes' && 'Arbitrage'}
                        </h1>
                    </div>
                </header>

                <div style={styles.content}>
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

const styles = {
    dashboardLayout: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        width: '100%',
    },
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 90,
    },
    sidebarWrapper: {
        position: 'sticky' as const,
        top: 0,
        height: '100vh',
        transition: 'transform 0.3s ease',
        zIndex: 100,
        backgroundColor: 'var(--surface)',
        // Simple trick to handle both mobile absolute and desktop relative
        width: 'auto',
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        minWidth: 0, // Critical for flex children text wrapping
    },
    header: {
        padding: '24px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(18, 18, 18, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 80,
    },
    headerTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    menuBtn: {
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        padding: '4px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '900',
        color: 'white',
    },
    content: {
        padding: '40px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        flex: 1,
    }
};

export default AdminDashboard;
