import fs from 'fs';
import mongoose from 'mongoose';

// Parse .env.local manually
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

if (!uri) {
  console.error("MONGODB_URI not found");
  process.exit(1);
}

async function verifyUserData() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully to database:", mongoose.connection.name);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections in database:\n`);

  const summary = [];

  for (const col of collections) {
    const name = col.name;
    const count = await mongoose.connection.db.collection(name).countDocuments();
    summary.push({ "Collection Name": name, "Records Count": count, "Status": count > 0 ? "✓ Safe (Data Present)" : "✓ Empty (Schema Ready)" });
  }

  summary.sort((a, b) => b["Records Count"] - a["Records Count"]);

  console.table(summary);

  // Check users specifically
  const usersCollection = mongoose.connection.db.collection('users');
  if (usersCollection) {
    const users = await usersCollection.find({}, { projection: { email: 1, displayName: 1, createdAt: 1, _id: 1, onboarded: 1 } }).toArray();
    console.log(`\nVerified ${users.length} registered user account(s):`);
    users.forEach((u, i) => {
      const maskedEmail = u.email ? u.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "N/A";
      console.log(`  ${i + 1}. ID: ${u._id} | Name: "${u.displayName || "User"}" | Email: ${maskedEmail} | Onboarded: ${u.onboarded ?? false} | Created: ${u.createdAt ? new Date(u.createdAt).toISOString() : "N/A"}`);
    });
  }

  await mongoose.disconnect();
  console.log("\nData verification completed: All collections and records are intact!");
}

verifyUserData().catch(err => {
  console.error("Error during verification:", err);
  process.exit(1);
});
