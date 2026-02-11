import { db } from '../config/firebase.js';
import logger from '../utils/logger.js';

const seedExecutions = async () => {
    try {
        logger.info('Starting execution seeding...');

        // Get all users
        const usersSnapshot = await db.collection('users').get();
        if (usersSnapshot.empty) {
            logger.info('No users found. Creating a default user...');
            const newUser = {
                name: 'Demo User',
                email: 'demo@example.com',
                created_at: new Date().toISOString()
            };
            const userRef = await db.collection('users').add(newUser);
            logger.info('Created default user', { userId: userRef.id });

            // Re-fetch to proceed
            const usersSnapshotRetry = await db.collection('users').get();
            var user = usersSnapshotRetry.docs[0];
        } else {
            var user = usersSnapshot.docs[0];
        }
        const userId = user.id;

        // Create a dummy automation if none exists
        let automationId;
        const autoSnapshot = await db.collection('automations').where('user_id', '==', userId).limit(1).get();

        if (autoSnapshot.empty) {
            const newAuto = {
                user_id: userId,
                name: 'Seeded Automation',
                description: 'Created for seeding executions',
                trigger: { type: 'schedule', cron: '0 0 * * *' },
                steps: [{ type: 'log', message: 'Seeded Hello' }],
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const docRef = await db.collection('automations').add(newAuto);
            automationId = docRef.id;
            logger.info('Created dummy automation', { automationId });
        } else {
            automationId = autoSnapshot.docs[0].id;
        }

        // Generate executions for the last 365 days
        const executions = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            // Random number of executions per day (0-5)
            const count = Math.floor(Math.random() * 6);

            for (let i = 0; i < count; i++) {
                const executionDate = new Date(d);
                // Random time during the day
                executionDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

                executions.push({
                    automationId: automationId,
                    status: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED', // 90% success rate
                    input: { seeded: true },
                    created_at: executionDate.toISOString(),
                    duration: Math.floor(Math.random() * 5000) + 100 // 100ms - 5100ms
                });
            }
        }

        logger.info(`Generating ${executions.length} executions...`);

        // Batch write (Firestore limits batches to 500 ops)
        const batchSize = 400;
        for (let i = 0; i < executions.length; i += batchSize) {
            const batch = db.batch();
            const chunk = executions.slice(i, i + batchSize);

            chunk.forEach(exec => {
                const docRef = db.collection('executions').doc();
                batch.set(docRef, exec);
            });

            await batch.commit();
            logger.info(`Committed batch ${Math.floor(i / batchSize) + 1}`);
        }

        logger.info('Seeding completed successfully');
        process.exit(0);

    } catch (error) {
        logger.error('Seeding failed', error);
        process.exit(1);
    }
};

seedExecutions();
