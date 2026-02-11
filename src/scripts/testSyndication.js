
const runTest = async () => {
    const url = 'https://syndication.twitter.com/srv/timeline-profile/screen-name/nikhilkamathcio';
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Status: ${response.status}`);
            return;
        }
        const data = await response.json();
        const html = data.__html || "";
        console.log("Success! Received HTML length:", html.length);
        // It returns HTML inside JSON. We still need regex, but at least we get the content!
    } catch (error) {
        console.error("Error:", error.message);
    }
};

runTest();
