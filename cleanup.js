const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const fs = require('fs');
const envConfig = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    let value = values.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
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

async function cleanup() {
  const auth = getAuth();
  for (const email of ['participant@hopengo.com', 'volunteer@hopengo.com', 'part2@hopengo.com', 'vol2@hopengo.com']) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
      console.log(`Deleted ${email} from Auth.`);
    } catch (e) {
       console.log(`Could not delete ${email}: ${e.message}`);
    }
  }
  process.exit(0);
}
cleanup();
