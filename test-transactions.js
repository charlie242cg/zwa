// Test script pour vérifier la table transactions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTransactions() {
    console.log('🔍 Test de la table transactions...\n');

    // 1. Vérifier si la table existe
    console.log('1️⃣ Test de lecture de la table...');
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(5);

    if (error) {
        console.error('❌ Erreur:', error);
    } else {
        console.log('✅ Table accessible!');
        console.log('📊 Nombre de transactions:', data.length);
        console.log('📄 Données:', data);
    }

    // 2. Vérifier le schéma
    console.log('\n2️⃣ Test de la structure...');
    const { data: schema, error: schemaError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);

    if (schema && schema.length > 0) {
        console.log('📋 Colonnes disponibles:', Object.keys(schema[0]));
    }
}

testTransactions();
