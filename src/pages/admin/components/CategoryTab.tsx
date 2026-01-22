import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { categoryService } from '../../../services/categoryService';
import { SkeletonBar } from '../../../components/common/SkeletonLoader';

const CategoryTab = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('📦');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const { data } = await categoryService.getAllCategoriesWithCounts();
        if (data) setCategories(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newCatName.trim()) return;
        const { error } = await categoryService.createCategory(newCatName, newCatIcon);
        if (!error) {
            setNewCatName('');
            setNewCatIcon('📦');
            fetchCategories();
        }
    };

    const handleDelete = async (id: string, count: number) => {
        if (count > 0) {
            if (!window.confirm(`Cette catégorie contient ${count} produits. Ces produits n'auront plus de catégorie. Supprimer quand même ?`)) return;
        } else if (!window.confirm('Supprimer cette catégorie ?')) return;

        const { error } = await categoryService.deleteCategory(id);
        if (!error) fetchCategories();
    };

    const startEdit = (cat: any) => {
        setEditingId(cat.id);
        setEditValue(cat.name);
        setEditIcon(cat.icon || '📦');
    };

    const saveEdit = async () => {
        if (!editingId || !editValue.trim()) return;
        const { error } = await categoryService.updateCategory(editingId, {
            name: editValue,
            icon: editIcon
        });
        if (!error) {
            setEditingId(null);
            fetchCategories();
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await categoryService.toggleCategoryStatus(id, !currentStatus);
        if (!error) fetchCategories();
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Gestion des Catégories 🏷️</h2>
                <div style={styles.addForm}>
                    <input
                        type="text"
                        placeholder="🎨"
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        style={{ ...styles.input, width: '60px', textAlign: 'center' }}
                    />
                    <input
                        type="text"
                        placeholder="Nouveau nom (ex: Électronique)"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleCreate} style={styles.addBtn}>
                        <Plus size={18} /> Ajouter
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={styles.tableCard} className="premium-card">
                    <div style={{ padding: '20px' }}>
                        <SkeletonBar width="100%" height={20} margin="0 0 12px 0" />
                        <SkeletonBar width="100%" height={20} margin="0 0 12px 0" />
                        <SkeletonBar width="100%" height={20} />
                    </div>
                </div>
            ) : (
                <div style={styles.tableCard} className="premium-card">
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.theadRow}>
                                <th style={styles.th}>ICÔNE</th>
                                <th style={styles.th}>NOM DE LA CATÉGORIE</th>
                                <th style={styles.th}>PRODUITS</th>
                                <th style={styles.th}>STATUT</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr
                                    key={cat.id}
                                    style={{
                                        ...styles.tr,
                                        opacity: cat.is_active ? 1 : 0.5
                                    }}
                                >
                                    <td style={styles.td}>
                                        {editingId === cat.id ? (
                                            <input
                                                style={{ ...styles.editInput, width: '50px', textAlign: 'center' }}
                                                value={editIcon}
                                                onChange={(e) => setEditIcon(e.target.value)}
                                            />
                                        ) : (
                                            <div style={styles.iconBox}>{cat.icon || '📦'}</div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {editingId === cat.id ? (
                                            <input
                                                style={styles.editInput}
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                            />
                                        ) : (
                                            <span style={styles.catName}>{cat.name}</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.countBadge}>{cat.product_count || 0}</span>
                                    </td>
                                    <td style={styles.td}>
                                        {cat.is_active ? (
                                            <span style={styles.activeBadge}>Actif</span>
                                        ) : (
                                            <span style={styles.inactiveBadge}>Inactif</span>
                                        )}
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'right' }}>
                                        <div style={styles.actions}>
                                            {editingId === cat.id ? (
                                                <>
                                                    <button onClick={saveEdit} style={styles.actionBtnSuccess}>
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} style={styles.actionBtn}>
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => toggleActive(cat.id, cat.is_active)}
                                                        style={styles.actionBtn}
                                                        title={cat.is_active ? 'Désactiver' : 'Activer'}
                                                    >
                                                        {cat.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                                    </button>
                                                    <button onClick={() => startEdit(cat)} style={styles.actionBtn}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(cat.id, cat.product_count)} style={styles.actionBtnDanger}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
    tableCard: {
        padding: '0',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '14px',
    },
    theadRow: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    th: {
        textAlign: 'left' as const,
        padding: '16px 20px',
        fontSize: '11px',
        fontWeight: '700',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    tr: {
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        transition: 'all 0.2s',
    },
    td: {
        padding: '16px 20px',
    },
    iconBox: {
        fontSize: '24px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
    },
    catName: {
        fontWeight: '600',
        color: 'white',
    },
    editInput: {
        background: 'rgba(138, 43, 226, 0.1)',
        border: '1px solid var(--primary)',
        borderRadius: '4px',
        color: 'white',
        padding: '4px 8px',
        width: '100%',
    },
    countBadge: {
        padding: '4px 8px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
    },
    activeBadge: {
        padding: '4px 10px',
        backgroundColor: 'rgba(0, 204, 102, 0.1)',
        border: '1px solid rgba(0, 204, 102, 0.3)',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#00CC66',
        textTransform: 'uppercase' as const,
    },
    inactiveBadge: {
        padding: '4px 10px',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        border: '1px solid rgba(255, 69, 58, 0.3)',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#FF453A',
        textTransform: 'uppercase' as const,
    },
    orderLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-secondary)',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
    },
    actionBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    actionBtnDanger: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        color: '#FF453A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    actionBtnSuccess: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: 'rgba(0, 204, 102, 0.1)',
        color: '#00CC66',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        color: 'var(--text-secondary)',
    }
};

export default CategoryTab;
