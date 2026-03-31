const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Since we're running this locally using require we'll manually load the .env.local variables
const fs = require('fs');
const envConfig = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    let value = values.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    // Replace literal "\n"s in the key with actual newlines
    if (key === 'FIREBASE_PRIVATE_KEY') value = value.replace(/\\n/g, '\n');
    acc[key.trim()] = value;
    return acc;
  }, {});

Object.assign(process.env, envConfig);

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});

const args = process.argv.slice(2);
const defaultEmail = args[0] || "admin@hopengo.com";
const defaultPassword = args[1] || "Admin123!";

async function run() {
  try {
    const auth = getAuth();
    const db = getFirestore();

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(defaultEmail);
      console.log("User already exists inside Auth, updating role in Firestore...");
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: defaultEmail,
            password: defaultPassword,
            displayName: 'System Admin',
          });
          console.log("Admin account created within Firebase Authentication.");
      } else {
        throw e;
      }
    }

    await db.collection('users').doc(userRecord.uid).set({
      email: defaultEmail,
      role: 'admin',
      isApproved: true,
      isActive: true,
      fullName: 'System Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    console.log(`🎉 SUCCESS!`);
    console.log(`Email:   ${defaultEmail}`);
    console.log(`Password: ${defaultPassword}`);

    process.exit(0);

  } catch (err) {
    console.error("Failed to create admin:", err.message);
    process.exit(1);
  }
}

run();
