import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from './transactionService';

interface UserProfile {
    full_name?: string;
    email: string;
    id: string;
}

export const invoiceService = {
    /**
     * Générer une facture d'achat (pour buyers)
     */
    generatePurchaseInvoice(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();

        // En-tête
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ZWA MARKETPLACE', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('www.zwa.com', 105, 27, { align: 'center' });

        // Titre facture
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`FACTURE #ZWA-${transaction.id.substring(0, 8).toUpperCase()}`, 14, 45);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const date = new Date(transaction.created_at);
        doc.text(`Date: ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`, 14, 52);

        // Informations client
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENT', 14, 65);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nom: ${user.full_name || 'N/A'}`, 14, 72);
        doc.text(`Email: ${user.email}`, 14, 79);
        doc.text(`ID: ${user.id.substring(0, 12)}...`, 14, 86);

        // Détails de la commande
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAILS DE LA COMMANDE', 14, 100);

        // Tableau des produits
        autoTable(doc, {
            startY: 105,
            head: [['Produit', 'Quantité', 'Prix Unitaire', 'Total']],
            body: [[
                transaction.product_name || 'Produit',
                transaction.quantity?.toString() || '1',
                `${transaction.unit_price?.toLocaleString() || '0'} FCFA`,
                `${Math.abs(transaction.amount).toLocaleString()} FCFA`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [138, 43, 226], textColor: 255 },
            styles: { fontSize: 10 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;

        // Total
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL: ${Math.abs(transaction.amount).toLocaleString()} FCFA`, 14, finalY);

        // Informations de paiement
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Paiement reçu avec succès', 14, finalY + 10);
        doc.text('Méthode: Portefeuille Zwa', 14, finalY + 16);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Merci pour votre achat sur Zwa!', 105, 280, { align: 'center' });
        doc.text('Cette facture a été générée automatiquement.', 105, 285, { align: 'center' });

        // Télécharger
        doc.save(`facture-zwa-${transaction.id.substring(0, 8)}.pdf`);
    },

    /**
     * Générer un reçu de vente (pour sellers)
     */
    generateSaleReceipt(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();

        // En-tête
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ZWA MARKETPLACE', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('www.zwa.com', 105, 27, { align: 'center' });

        // Titre reçu
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`REÇU DE VENTE #${transaction.id.substring(0, 8).toUpperCase()}`, 14, 45);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const date = new Date(transaction.created_at);
        doc.text(`Date: ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`, 14, 52);

        // Informations vendeur
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('VENDEUR', 14, 65);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nom: ${user.full_name || 'N/A'}`, 14, 72);
        doc.text(`Email: ${user.email}`, 14, 79);

        // Détails de la vente
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAILS DE LA VENTE', 14, 95);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Produit: ${transaction.product_name}`, 14, 102);
        doc.text(`Quantité: ${transaction.quantity} unité(s)`, 14, 109);
        doc.text(`Prix unitaire: ${transaction.unit_price?.toLocaleString()} FCFA`, 14, 116);

        // Calculs
        const totalPrice = (transaction.unit_price || 0) * (transaction.quantity || 1);
        const commissionAmount = totalPrice - transaction.amount;

        doc.text(`Prix total: ${totalPrice.toLocaleString()} FCFA`, 14, 128);

        if (commissionAmount > 0) {
            doc.text(`Commission affilié: -${commissionAmount.toLocaleString()} FCFA`, 14, 135);
            doc.setFont('helvetica', 'bold');
            doc.text(`Net reçu: ${transaction.amount.toLocaleString()} FCFA`, 14, 145);
        } else {
            doc.setFont('helvetica', 'bold');
            doc.text(`Net reçu: ${transaction.amount.toLocaleString()} FCFA`, 14, 135);
        }

        // Solde
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Nouveau solde wallet: ${transaction.balance_after.toLocaleString()} FCFA`, 14, 160);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Merci d\'avoir vendu sur Zwa!', 105, 280, { align: 'center' });
        doc.text('Ce reçu a été généré automatiquement.', 105, 285, { align: 'center' });

        // Télécharger
        doc.save(`recu-vente-zwa-${transaction.id.substring(0, 8)}.pdf`);
    },

    /**
     * Générer un reçu de commission (pour affiliates)
     */
    generateCommissionReceipt(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();

        // En-tête
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ZWA MARKETPLACE', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('www.zwa.com', 105, 27, { align: 'center' });

        // Titre reçu
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`REÇU COMMISSION #${transaction.id.substring(0, 8).toUpperCase()}`, 14, 45);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const date = new Date(transaction.created_at);
        doc.text(`Date: ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`, 14, 52);

        // Informations affilié
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('AFFILIÉ', 14, 65);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nom: ${user.full_name || 'N/A'}`, 14, 72);
        doc.text(`Email: ${user.email}`, 14, 79);

        // Détails de la commission
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAILS DE LA COMMISSION', 14, 95);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Produit parrainé: ${transaction.product_name}`, 14, 102);
        doc.text(`Taux de commission: ${transaction.commission_rate}%`, 14, 109);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Commission gagnée: ${transaction.amount.toLocaleString()} FCFA`, 14, 125);

        // Solde
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Nouveau solde wallet: ${transaction.balance_after.toLocaleString()} FCFA`, 14, 140);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Merci pour votre parrainage sur Zwa!', 105, 280, { align: 'center' });
        doc.text('Ce reçu a été généré automatiquement.', 105, 285, { align: 'center' });

        // Télécharger
        doc.save(`recu-commission-zwa-${transaction.id.substring(0, 8)}.pdf`);
    },

    /**
     * Générer un reçu de retrait (pour tous)
     */
    generateWithdrawalReceipt(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();

        // En-tête
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ZWA MARKETPLACE', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('www.zwa.com', 105, 27, { align: 'center' });

        // Titre reçu
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`REÇU DE RETRAIT #${transaction.id.substring(0, 8).toUpperCase()}`, 14, 45);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const date = new Date(transaction.created_at);
        doc.text(`Date: ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`, 14, 52);

        // Informations utilisateur
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('BÉNÉFICIAIRE', 14, 65);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nom: ${user.full_name || 'N/A'}`, 14, 72);
        doc.text(`Email: ${user.email}`, 14, 79);

        // Détails du retrait
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAILS DU RETRAIT', 14, 95);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Méthode: ${transaction.withdrawal_method || 'N/A'}`, 14, 102);
        doc.text(`Numéro destinataire: ${transaction.withdrawal_number || 'N/A'}`, 14, 109);
        doc.text(`Montant demandé: ${Math.abs(transaction.amount).toLocaleString()} FCFA`, 14, 116);
        doc.text(`Frais de retrait: ${transaction.withdrawal_fee?.toLocaleString() || '0'} FCFA`, 14, 123);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const netReceived = Math.abs(transaction.amount) - (transaction.withdrawal_fee || 0);
        doc.text(`Net reçu: ${netReceived.toLocaleString()} FCFA`, 14, 135);

        // Solde
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Nouveau solde wallet: ${transaction.balance_after.toLocaleString()} FCFA`, 14, 150);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Merci d\'utiliser Zwa!', 105, 280, { align: 'center' });
        doc.text('Ce reçu a été généré automatiquement.', 105, 285, { align: 'center' });

        // Télécharger
        doc.save(`recu-retrait-zwa-${transaction.id.substring(0, 8)}.pdf`);
    },

    /**
     * Exporter l'historique en CSV
     */
    exportToCSV(transactions: Transaction[], filename: string = 'historique-zwa') {
        const headers = ['Date', 'Type', 'Description', 'Montant (FCFA)', 'Solde Après (FCFA)'];

        const rows = transactions.map(t => [
            new Date(t.created_at).toLocaleString('fr-FR'),
            this.getTypeLabel(t.type),
            t.description || '',
            t.amount.toLocaleString(),
            t.balance_after.toLocaleString()
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        // Télécharger
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Obtenir le libellé du type de transaction
     */
    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            purchase: 'Achat',
            sale: 'Vente',
            commission: 'Commission',
            withdrawal: 'Retrait'
        };
        return labels[type] || type;
    }
};
