
try {
    const url = 'https://hack2skill.com/';
    console.log(`Testing fetch to ${url}...`);

    // Test with default headers
    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
        console.error('Fetch failed with status:', response.status);
    } else {
        const text = await response.text();
        console.log(`Successfully fetched ${text.length} bytes.`);
        console.log('Snippet:', text.substring(0, 200));
    }

} catch (error) {
    console.error('Fetch threw an error:', error);
    if (error.cause) {
        console.error('Cause:', error.cause);
    }
}
