import logo from '../../assets/logo.png';

const Header = () => {
    return (
        <header style={styles.header}>
            <div style={styles.container}>
                <div style={styles.left}>
                    <div style={styles.logoContainer}>
                        <img src={logo} alt="Zwa Logo" style={styles.logo} />
                    </div>
                </div>
            </div>
        </header>
    );
};

const styles = {
    header: {
        width: '100%',
        background: 'rgba(18, 18, 18, 0.9)',
        backdropFilter: 'blur(15px)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    },
    container: {
        padding: '12px 16px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    left: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        height: '40px',
    },
    logo: {
        height: '100%',
        width: 'auto',
        objectFit: 'contain' as const,
    }
};

export default Header;
