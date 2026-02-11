import smsService from './src/integrations/sms/smsService.js';
import logger from './src/utils/logger.js';

(async () => {
    console.log('=== SMS Service Test ===\n');

    // Check service status
    const status = smsService.getStatus();
    console.log('SMS Service Status:');
    console.log(`  - Configured: ${status.configured}`);
    console.log(`  - Phone Number: ${status.phoneNumber || 'Not set'}`);
    console.log(`  - Ready: ${smsService.isReady()}\n`);

    if (!smsService.isReady()) {
        console.error('❌ SMS service is NOT configured properly!');
        console.log('\nRequired environment variables:');
        console.log('  - TWILIO_ACCOUNT_SID');
        console.log('  - TWILIO_AUTH_TOKEN');
        console.log('  - TWILIO_PHONE_NUMBER');
        process.exit(1);
    }

    // Try sending a test SMS
    console.log('Attempting to send test SMS...\n');
    const result = await smsService.sendSMS(
        '+919876543210', // Test number
        'Test SMS from Smart Workflow Automation - Gold Price Update Test'
    );

    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
        console.log('\n✅ SMS sent successfully!');
    } else {
        console.log('\n❌ SMS failed to send');
        console.log('Error:', result.error);
    }

    process.exit(0);
})();
