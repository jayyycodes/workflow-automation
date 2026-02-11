
const runTest = async () => {
    const url = 'https://syndication.twitter.com/srv/timeline-profile/screen-name/nikhilkamathcio';
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log("Body length:", text.length);
        console.log("Body preview:", text.substring(0, 500));
    } catch (error) {
        console.error("Error:", error.message);
    }
};

runTest();
