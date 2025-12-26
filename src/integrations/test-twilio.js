/**
 * Test script to verify Twilio WhatsApp and SMS services
 * Run with: node src/integrations/test-twilio.js
 */

import dotenv from 'dotenv';
import whatsappService from './whatsapp/whatsappService.js';
import smsService from './sms/smsService.js';

dotenv.config();

async function testTwilioServices() {
    console.log('\n=== Twilio Integration Test ===\n');

    // Check WhatsApp service status
    console.log('📱 WhatsApp Service Status:');
    const whatsappStatus = whatsappService.getStatus();
    console.log(`  - Configured: ${whatsappStatus.configured}`);
    console.log(`  - WhatsApp Number: ${whatsappStatus.whatsappNumber || 'Not set'}`);
    console.log(`  - Ready: ${whatsappService.isReady()}`);
    console.log();

    // Check SMS service status
    console.log('💬 SMS Service Status:');
    const smsStatus = smsService.getStatus();
    console.log(`  - Configured: ${smsStatus.configured}`);
    console.log(`  - Phone Number: ${smsStatus.phoneNumber || 'Not set'}`);
    console.log(`  - Ready: ${smsService.isReady()}`);
    console.log();

    // Test message sending if services are configured
    if (whatsappService.isReady() || smsService.isReady()) {
        console.log('⚠️  Services are configured. To send a test message, uncomment the test code below.\n');

        // UNCOMMENT THE FOLLOWING LINES TO SEND TEST MESSAGES
        // Make sure to replace with your actual phone number

        /*
        const testPhoneNumber = '+919876543210'; // Replace with your phone number
        
        if (whatsappService.isReady()) {
          console.log('Sending test WhatsApp message...');
          const whatsappResult = await whatsappService.sendMessage(
            testPhoneNumber,
            '🎉 Test WhatsApp message from Smart Workflow Automation!'
          );
          console.log('WhatsApp Result:', whatsappResult);
          console.log();
        }
        
        if (smsService.isReady()) {
          console.log('Sending test SMS...');
          const smsResult = await smsService.sendSMS(
            testPhoneNumber,
            '🎉 Test SMS from Smart Workflow Automation!'
          );
          console.log('SMS Result:', smsResult);
          console.log();
        }
        */
    } else {
        console.log('ℹ️  To configure Twilio services:');
        console.log('1. Copy .env.example to .env (if not already done)');
        console.log('2. Add your Twilio credentials to .env:');
        console.log('   - TWILIO_ACCOUNT_SID');
        console.log('   - TWILIO_AUTH_TOKEN');
        console.log('   - TWILIO_PHONE_NUMBER');
        console.log('   - TWILIO_WHATSAPP_NUMBER');
        console.log('3. Restart the application');
        console.log();
    }

    console.log('=== Test Complete ===\n');
}

// Run the test
testTwilioServices().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
