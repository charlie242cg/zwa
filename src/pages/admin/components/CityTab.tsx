import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, MapPin } from 'lucide-react';
import { cityService } from '../../../services/cityService';

const CityTab = () => {
    const [cities, setCities] = useState<any[]>([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        setLoading(true);
        const { data } = await cityService.getAllCities();
        if (data) setCities(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        const { error } = await cityService.createCity(newName);
        if (!error) {
            setNewName('');
            fetchCities();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette ville ? Cela pourrait affecter les produits liés.')) return;
        const { error } = await cityService.deleteCity(id);
        if (!error) fetchCities();
    };

    const startEdit = (city: any) => {
        setEditingId(city.id);
        setEditValue(city.name);
    };

    const saveEdit = async () => {
        if (!editingId || !editValue.trim()) return;
        const { error } = await cityService.updateCity(editingId, { name: editValue });
        if (!error) {
            setEditingId(null);
            fetchCities();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Gestion des Villes 🇨🇬</h2>
                <div style={styles.addForm}>
                    <input
                        type="text"
                        placeholder="Ex: Brazzaville, Pointe-Noire"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleCreate} style={styles.addBtn}>
                        <Plus size={18} /> Ajouter
                    </button>
                </div>
            </div>

            <div style={styles.infoBox}>
                <MapPin size={16} /> Ces villes apparaîtront comme filtres pour les acheteurs.
            </div>

            {loading ? (
                <div style={styles.loading}>Chargement...</div>
            ) : (
                <div style={styles.grid}>
                    {cities.map((city) => (
                        <div key={city.id} style={styles.card} className="premium-card">
                            {editingId === city.id ? (
                                <div style={styles.editRow}>
                                    <input
                                        style={styles.editInput}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        autoFocus
                                    />
                                    <div style={styles.editActions}>
                                        <button onClick={saveEdit} style={styles.saveBtn}><Save size={14} /></button>
                                        <button onClick={() => setEditingId(null)} style={styles.cancelBtn}><X size={14} /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <span style={styles.cityName}>{city.name}</span>
                                    <div style={styles.cardActions}>
                                        <button onClick={() => startEdit(city)} style={styles.iconBtn}><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(city.id)} style={styles.iconBtnDanger}><Trash2 size={14} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: '16px',
    },
    title: {
        fontSize: '22px',
        fontWeight: '800',
    },
    addForm: {
        display: 'flex',
        gap: '10px',
    },
    input: {
        padding: '10px 16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        width: '240px',
    },
    addBtn: {
        padding: '10px 20px',
        backgroundColor: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    infoBox: {
        padding: '12px 16px',
        backgroundColor: 'rgba(138, 43, 226, 0.05)',
        border: '1px solid rgba(138, 43, 226, 0.2)',
        borderRadius: '12px',
        color: 'var(--primary)',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
    },
    card: {
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cityName: {
        fontWeight: '700',
        fontSize: '15px',
    },
    cardActions: {
        display: 'flex',
        gap: '8px',
    },
    editRow: {
        display: 'flex',
        width: '100%',
        gap: '8px',
    },
    editInput: {
        flex: 1,
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid var(--primary)',
        borderRadius: '4px',
        color: 'white',
        padding: '4px 8px',
    },
    editActions: {
        display: 'flex',
        gap: '4px',
    },
    iconBtn: {
        padding: '6px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
    },
    iconBtnDanger: {
        padding: '6px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        color: '#FF453A',
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '4px 8px',
        backgroundColor: '#00CC66',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    cancelBtn: {
        padding: '4px 8px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        color: 'var(--text-secondary)',
    }
};

export default CityTab;
