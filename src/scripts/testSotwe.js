
const runTest = async () => {
    const url = 'https://api.sotwe.com/v1/users/nikhilkamathcio';
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Status: ${response.status}`);
            const text = await response.text();
            console.error(`Body: ${text.substring(0, 200)}`);
            return;
        }
        const data = await response.json();
        console.log("Success! Found user:", data.info ? data.info.name : 'Unknown');
        console.log("Tweets found:", data.data ? data.data.length : 0);
    } catch (error) {
        console.error("Error:", error.message);
    }
};

runTest();
