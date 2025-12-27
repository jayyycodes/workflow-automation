const sendEmail = async (params, context) => {
    // Auto-replace generic email with logged-in user's email
    let recipientEmail = params.to;

    if (!recipientEmail || recipientEmail === 'user@example.com') {
        recipientEmail = context.user?.email;

        if (!recipientEmail) {
            throw new Error('No recipient email specified and user email not available');
        }

        logger.info('Using logged-in user email for notification', { email: recipientEmail });
    }

    // PRIORITY: Check for digest FIRST (overrides params.body)
    const previousStepOutputs = context.stepOutputs || {};
    const digestData = Object.values(previousStepOutputs).find(output => output?.digest);

    let emailBody;

    if (digestData?.digest) {
        // Use digest from format_web_digest step
        emailBody = digestData.digest;
        logger.info('Using digest from format_web_digest step');
    } else {
        // Check for stock price data
        const stockData = Object.values(previousStepOutputs).find(output => output?.symbol && output?.price);

        if (stockData) {
            emailBody = `
Stock Update: ${stockData.symbol}

Current Price: ${stockData.currency || ''} ${stockData.price}
Change: ${stockData.change} (${stockData.changePercent})
Market State: ${stockData.marketState || 'Unknown'}
Last Updated: ${new Date(stockData.timestamp).toLocaleString()}

---
This is an automated notification from your Smart Workflow Automation system.
            `.trim();
            logger.info('Enhanced email with stock data', { symbol: stockData.symbol, price: stockData.price });
        } else {
            // Fallback to params
            emailBody = params.body || params.message || 'Automation notification';
        }
    }

    return notify({
        channel: 'email',
        ...params,
        to: recipientEmail,
        body: emailBody
    }, context);
};
