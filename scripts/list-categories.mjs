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

async function listCats() {
  await mongoose.connect(uri);
  const cats = await mongoose.connection.db.collection('categories').find({}).toArray();
  console.log(`TOTAL_CATEGORIES_IN_DB: ${cats.length}`);

  const userGroups = {};
  cats.forEach(c => {
    const uid = String(c.userId || 'GLOBAL');
    if (!userGroups[uid]) userGroups[uid] = [];
    userGroups[uid].push(c);
  });

  for (const [uid, uCats] of Object.entries(userGroups)) {
    console.log(`\nUser: ${uid} (Total: ${uCats.length} categories)`);
    uCats.forEach((c, idx) => {
      console.log(`  ${idx + 1}. [${c.type || 'expense'}] [${c.icon || '💰'}] ${c.name} ${c.archived ? '(Archived)' : ''}`);
    });
  }

  await mongoose.disconnect();
}

listCats().catch(console.error);
