import { db } from '../config/firebase.js';
import logger from '../utils/logger.js';

const clearSeededExecutions = async () => {
    try {
        logger.info('Starting execution cleanup...');

        // Find executions with input.seeded = true
        const snapshot = await db.collection('executions').where('input.seeded', '==', true).get();

        if (snapshot.empty) {
            logger.info('No seeded executions found to clear.');
            process.exit(0);
        }

        logger.info(`Found ${snapshot.size} seeded executions to delete.`);

        const batchSize = 400;
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const chunk = docs.slice(i, i + batchSize);

            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            logger.info(`Deleted batch ${Math.floor(i / batchSize) + 1}`);
        }

        logger.info('Cleanup completed successfully');
        process.exit(0);

    } catch (error) {
        logger.error('Cleanup failed', error);
        process.exit(1);
    }
};

clearSeededExecutions();
