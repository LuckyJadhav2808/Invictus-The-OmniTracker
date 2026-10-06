import fs from 'fs';
import mongoose from 'mongoose';

let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MONGODB_URI=')) {
      uri = trimmed.substring('MONGODB_URI='.length).replace(/["']/g, '').trim();
      break;
    }
  }
}

async function auditMoneyDatasets() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log("=== MONEY DATASETS AUDIT ===");

  // 1. Transactions
  const txs = await db.collection('transactions').find({}).toArray();
  console.log(`\n1. Transactions (Total: ${txs.length})`);
  let invalidAmounts = 0;
  let invalidDates = 0;
  let missingCategory = 0;
  const categories = await db.collection('categories').find({}).toArray();
  const catMap = new Map(categories.map(c => [String(c.id || c._id), c.name]));

  txs.forEach(t => {
    if (typeof t.amount !== 'number' || isNaN(t.amount)) invalidAmounts++;
    if (!t.date || isNaN(new Date(t.date).getTime())) invalidDates++;
    if (t.categoryId && !catMap.has(String(t.categoryId))) missingCategory++;
  });

  console.log(`   - Invalid amounts: ${invalidAmounts}`);
  console.log(`   - Invalid dates: ${invalidDates}`);
  console.log(`   - Missing category reference: ${missingCategory}`);
  console.log(`   - Sample transactions:`);
  txs.slice(0, 5).forEach(t => {
    console.log(`     * [${t.date}] ${t.type.toUpperCase()} ₹${t.amount} | Cat: ${catMap.get(String(t.categoryId)) || t.categoryId} | Note: "${t.note || ''}"`);
  });

  // 2. Categories
  console.log(`\n2. Categories (Total: ${categories.length})`);
  const expenseCount = categories.filter(c => c.type === 'expense').length;
  const incomeCount = categories.filter(c => c.type === 'income').length;
  console.log(`   - Expense categories: ${expenseCount}`);
  console.log(`   - Income categories: ${incomeCount}`);

  // 3. Debts
  const debts = await db.collection('debts').find({}).toArray();
  console.log(`\n3. Debts (Total: ${debts.length})`);
  debts.forEach(d => {
    console.log(`   * Person: ${d.personName} | Amount: ₹${d.amount} | Type: ${d.type} | Status: ${d.status}`);
  });

  // 4. Savings Goals
  const savings = await db.collection('savingsgoals').find({}).toArray();
  console.log(`\n4. Savings Goals (Total: ${savings.length})`);

  // 5. Budget Preferences
  const budgetPrefs = await db.collection('budgetpreferences').find({}).toArray();
  console.log(`\n5. Budget Preferences (Total: ${budgetPrefs.length})`);

  await mongoose.disconnect();
}

auditMoneyDatasets().catch(console.error);
