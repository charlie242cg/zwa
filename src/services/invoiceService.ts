import jsPDF from 'jspdf';
import { Transaction } from './transactionService';

interface UserProfile {
    full_name?: string;
    email: string;
    id: string;
}

function formatMoney(amount: number): string {
    return Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

export const invoiceService = {
    /**
     * Générer une facture d'achat
     */
    generatePurchaseInvoice(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();
        const date = new Date(transaction.created_at);
        const ref = `ZWA-${transaction.id.substring(0, 8).toUpperCase()}`;

        let y = 30;
        const left = 25;
        const right = 185;

        // Logo / Titre
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text('ZWA', left, y);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Marketplace', left + 35, y);

        // Type document à droite
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('FACTURE', right, y, { align: 'right' });

        y += 25;

        // Ligne séparatrice
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);

        y += 20;

        // Infos en 2 colonnes
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Référence', left, y);
        doc.text('Date', 105, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.text(ref, left, y);
        doc.text(formatDate(date), 105, y);

        y += 15;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Client', left, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(user.full_name || 'Client', left, y);
        y += 5;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(user.email, left, y);

        y += 25;

        // Tableau simple
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);

        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUIT', left, y);
        doc.text('QTÉ', 120, y);
        doc.text('PRIX', 145, y);
        doc.text('TOTAL', right, y, { align: 'right' });

        y += 5;
        doc.line(left, y, right, y);

        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(transaction.product_name || 'Produit', left, y);
        doc.text((transaction.quantity || 1).toString(), 120, y);
        doc.text(formatMoney(transaction.unit_price || Math.abs(transaction.amount)), 145, y);
        doc.text(formatMoney(Math.abs(transaction.amount)), right, y, { align: 'right' });

        y += 8;
        doc.line(left, y, right, y);

        y += 15;

        // Total
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Total', 145, y);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text(formatMoney(Math.abs(transaction.amount)), right, y, { align: 'right' });

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Merci pour votre achat sur ZWA Marketplace', 105, pageHeight - 20, { align: 'center' });

        doc.save(`facture-${ref.toLowerCase()}.pdf`);
    },

    /**
     * Générer un reçu de vente
     */
    generateSaleReceipt(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();
        const date = new Date(transaction.created_at);
        const ref = `ZWA-${transaction.id.substring(0, 8).toUpperCase()}`;

        let y = 30;
        const left = 25;
        const right = 185;

        // Logo
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text('ZWA', left, y);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Marketplace', left + 35, y);

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('REÇU DE VENTE', right, y, { align: 'right' });

        y += 25;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);

        y += 20;

        // Infos
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Référence', left, y);
        doc.text('Date', 105, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.text(ref, left, y);
        doc.text(formatDate(date), 105, y);

        y += 15;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Vendeur', left, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(user.full_name || 'Vendeur', left, y);
        y += 5;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(user.email, left, y);

        y += 25;

        // Tableau
        doc.setDrawColor(220, 220, 220);
        doc.line(left, y, right, y);

        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUIT VENDU', left, y);
        doc.text('QTÉ', 120, y);
        doc.text('PRIX', 145, y);
        doc.text('TOTAL', right, y, { align: 'right' });

        y += 5;
        doc.line(left, y, right, y);

        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);

        const totalPrice = (transaction.unit_price || 0) * (transaction.quantity || 1);
        doc.text(transaction.product_name || 'Produit', left, y);
        doc.text((transaction.quantity || 1).toString(), 120, y);
        doc.text(formatMoney(transaction.unit_price || 0), 145, y);
        doc.text(formatMoney(totalPrice), right, y, { align: 'right' });

        y += 8;
        doc.line(left, y, right, y);

        y += 15;

        // Récap
        const commission = totalPrice - transaction.amount;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Prix de vente', 120, y);
        doc.setTextColor(30, 30, 30);
        doc.text(formatMoney(totalPrice), right, y, { align: 'right' });

        if (commission > 0) {
            y += 8;
            doc.setTextColor(100, 100, 100);
            doc.text('Commission affilié', 120, y);
            doc.setTextColor(30, 30, 30);
            doc.text('-' + formatMoney(commission), right, y, { align: 'right' });
        }

        y += 12;
        doc.setDrawColor(220, 220, 220);
        doc.line(120, y, right, y);

        y += 10;
        doc.setTextColor(100, 100, 100);
        doc.text('Net reçu', 120, y);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text(formatMoney(transaction.amount), right, y, { align: 'right' });

        y += 12;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Nouveau solde: ${formatMoney(transaction.balance_after)}`, 120, y);

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Merci de vendre sur ZWA Marketplace', 105, pageHeight - 20, { align: 'center' });

        doc.save(`recu-vente-${ref.toLowerCase()}.pdf`);
    },

    /**
     * Générer un reçu de commission
     */
    generateCommissionReceipt(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();
        const date = new Date(transaction.created_at);
        const ref = `COM-${transaction.id.substring(0, 8).toUpperCase()}`;

        let y = 30;
        const left = 25;
        const right = 185;

        // Logo
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text('ZWA', left, y);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Marketplace', left + 35, y);

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('COMMISSION', right, y, { align: 'right' });

        y += 25;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);

        y += 20;

        // Infos
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Référence', left, y);
        doc.text('Date', 105, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.text(ref, left, y);
        doc.text(formatDate(date), 105, y);

        y += 15;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Affilié', left, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(user.full_name || 'Affilié', left, y);
        y += 5;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(user.email, left, y);

        y += 25;

        // Détails
        doc.setDrawColor(220, 220, 220);
        doc.line(left, y, right, y);

        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAIL', left, y);
        doc.text('VALEUR', right, y, { align: 'right' });

        y += 5;
        doc.line(left, y, right, y);

        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text('Produit', left, y);
        doc.text(transaction.product_name || 'N/A', right, y, { align: 'right' });

        y += 8;
        doc.text('Taux de commission', left, y);
        doc.text(`${transaction.commission_rate || 0}%`, right, y, { align: 'right' });

        y += 8;
        doc.line(left, y, right, y);

        y += 15;

        // Total
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Commission gagnée', 120, y);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text(formatMoney(transaction.amount), right, y, { align: 'right' });

        y += 12;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Nouveau solde: ${formatMoney(transaction.balance_after)}`, 120, y);

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Merci pour votre parrainage sur ZWA', 105, pageHeight - 20, { align: 'center' });

        doc.save(`recu-commission-${ref.toLowerCase()}.pdf`);
    },

    /**
     * Générer un reçu de retrait
     */
    generateWithdrawalReceipt(transaction: Transaction, user: UserProfile) {
        const doc = new jsPDF();
        const date = new Date(transaction.created_at);
        const ref = `RET-${transaction.id.substring(0, 8).toUpperCase()}`;

        let y = 30;
        const left = 25;
        const right = 185;

        // Logo
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text('ZWA', left, y);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Marketplace', left + 35, y);

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('RETRAIT', right, y, { align: 'right' });

        y += 25;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);

        y += 20;

        // Infos
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Référence', left, y);
        doc.text('Date', 105, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.text(ref, left, y);
        doc.text(formatDate(date), 105, y);

        y += 15;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Bénéficiaire', left, y);
        doc.text('Destination', 105, y);

        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(user.full_name || 'Utilisateur', left, y);
        doc.text(transaction.withdrawal_method || 'Mobile Money', 105, y);

        y += 5;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(user.email, left, y);
        doc.text(transaction.withdrawal_number || '', 105, y);

        y += 25;

        // Tableau
        doc.setDrawColor(220, 220, 220);
        doc.line(left, y, right, y);

        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text('DESCRIPTION', left, y);
        doc.text('MONTANT', right, y, { align: 'right' });

        y += 5;
        doc.line(left, y, right, y);

        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text('Montant demandé', left, y);
        doc.text(formatMoney(Math.abs(transaction.amount)), right, y, { align: 'right' });

        y += 8;
        doc.text('Frais de retrait', left, y);
        doc.text('-' + formatMoney(transaction.withdrawal_fee || 0), right, y, { align: 'right' });

        y += 8;
        doc.line(left, y, right, y);

        y += 15;

        // Total
        const netReceived = Math.abs(transaction.amount) - (transaction.withdrawal_fee || 0);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Net envoyé', 120, y);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(138, 43, 226);
        doc.text(formatMoney(netReceived), right, y, { align: 'right' });

        y += 12;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Nouveau solde: ${formatMoney(transaction.balance_after)}`, 120, y);

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Merci d\'utiliser ZWA Marketplace', 105, pageHeight - 20, { align: 'center' });

        doc.save(`recu-retrait-${ref.toLowerCase()}.pdf`);
    },

    /**
     * Exporter l'historique en CSV
     */
    exportToCSV(transactions: Transaction[], filename: string = 'historique-zwa') {
        const headers = ['Date', 'Type', 'Description', 'Montant (FCFA)', 'Solde Après (FCFA)'];

        const rows = transactions.map(t => [
            new Date(t.created_at).toLocaleDateString('fr-FR'),
            this.getTypeLabel(t.type),
            t.description || '',
            t.amount.toString(),
            t.balance_after.toString()
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

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
