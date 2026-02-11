import { createRequire } from 'module';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);

console.log('TRACE: Starting firebase.js');

let admin;
let db;
let auth;

try {
    console.log('TRACE: Requiring firebase-admin');
    admin = require('firebase-admin');
    console.log('TRACE: firebase-admin required');

    let serviceAccount;
    try {
        console.log('TRACE: Loading service account');
        serviceAccount = require('../../serviceAccountKey.json');
        console.log('TRACE: Service account loaded');
    } catch (error) {
        logger.warn('serviceAccountKey.json not found, checking environment variables');
    }

    if (serviceAccount) {
        if (!admin.apps.length) {
            console.log('TRACE: Initializing app with cert');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            logger.info('Firebase Admin initialized with serviceAccountKey.json');
        }
    } else {
        if (!admin.apps.length) {
            console.log('TRACE: Initializing app with default creds');
            admin.initializeApp();
            logger.info('Firebase Admin initialized with default credentials');
        }
    }

    console.log('TRACE: Getting firestore');
    db = admin.firestore();
    auth = admin.auth();
    console.log('TRACE: Done');

} catch (error) {
    logger.error('FIREBASE INIT ERROR MESSAGE: ' + error.message);
    console.error('FULL ERROR:', error);
    process.exit(1);
}

export { db, auth };
export default admin;
