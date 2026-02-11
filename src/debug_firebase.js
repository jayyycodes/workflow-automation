import { db } from './config/firebase.js';

console.log('Testing Firebase Connection...');
try {
    const collections = await db.listCollections();
    console.log('Connected! Collections:', collections.map(c => c.id));

    console.log('Testing access to "users" collection...');
    const users = await db.collection('users').get();
    console.log('Users found:', users.size);
} catch (error) {
    const fs = await import('fs');
    fs.writeFileSync('firebase_error.txt', `CODE: ${error.code}\nMESSAGE: ${error.message}`);
    console.error('CONNECTION ERROR MESSAGE:', error.message);
}
