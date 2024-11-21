// Function to fetch the user's IP address and location with a fallback mechanism
async function getIPAndLocation() {
  const primaryIPAPI = 'https://api.ipify.org?format=json'; // Primary IP API
  const secondaryIPAPI = 'https://jsonip.com'; // Secondary IP API
  const primaryLocationAPI = 'http://ip-api.com/json'; // Primary Location API
  const secondaryLocationAPI = 'https://ipwhois.app/json'; // Secondary Location API

  try {
    // Fetch the IP address using the primary API
    const primaryIPResponse = await fetch(primaryIPAPI);
    const primaryIPData = await primaryIPResponse.json();
    console.log('Primary API Public IP:', primaryIPData.ip);

    // Fetch location data using the primary location API
    const primaryLocationResponse = await fetch(`${primaryLocationAPI}/${primaryIPData.ip}`);
    const primaryLocationData = await primaryLocationResponse.json();
    console.log('Primary API Location Data:', primaryLocationData);

    if (
      primaryLocationData.query &&
      primaryLocationData.city &&
      primaryLocationData.regionName &&
      primaryLocationData.country
    ) {
      return {
        ip: primaryLocationData.query,
        location: `${primaryLocationData.city}, ${primaryLocationData.regionName}, ${primaryLocationData.country}`,
      };
    } else {
      throw new Error('Primary location API failed');
    }
  } catch (primaryError) {
    console.error('Primary API failed:', primaryError);

    try {
      // Fallback to the secondary IP API
      const secondaryIPResponse = await fetch(secondaryIPAPI);
      const secondaryIPData = await secondaryIPResponse.json();
      console.log('Secondary API Public IP:', secondaryIPData.ip);

      // Fetch location data using the secondary location API
      const secondaryLocationResponse = await fetch(`${secondaryLocationAPI}/${secondaryIPData.ip}`);
      const secondaryLocationData = await secondaryLocationResponse.json();
      console.log('Secondary API Location Data:', secondaryLocationData);

      if (
        secondaryLocationData.ip &&
        secondaryLocationData.city &&
        secondaryLocationData.region &&
        secondaryLocationData.country
      ) {
        return {
          ip: secondaryLocationData.ip,
          location: `${secondaryLocationData.city}, ${secondaryLocationData.region}, ${secondaryLocationData.country}`,
        };
      } else {
        throw new Error('Secondary location API failed');
      }
    } catch (secondaryError) {
      console.error('Secondary API failed:', secondaryError);

      // Return default values if both APIs fail
      return {
        ip: 'Unable to fetch IP',
        location: 'Unable to fetch location',
      };
    }
  }
}

// Function to fetch the local network IP address
async function getLocalIPAddress() {
  return new Promise((resolve, reject) => {
    const rtcConnection = new RTCPeerConnection();
    rtcConnection.createDataChannel(''); // Create a dummy data channel
    rtcConnection.createOffer()
      .then(offer => rtcConnection.setLocalDescription(offer))
      .catch(error => {
        console.error('Error creating offer:', error);
        reject('Failed to create WebRTC offer');
      });

    rtcConnection.onicecandidate = event => {
      if (event && event.candidate && event.candidate.candidate) {
        const candidate = event.candidate.candidate;
        const ipRegex = /(\d{1,3}\.){3}\d{1,3}/; // Matches IPv4 addresses
        const ipMatch = candidate.match(ipRegex);

        if (ipMatch) {
          resolve(ipMatch[0]); // Return the first matched IP address
          rtcConnection.close(); // Clean up the connection
        }
      } else if (!event.candidate) {
        reject('No local IP address found');
        rtcConnection.close();
      }
    };

    setTimeout(() => {
      reject('Timeout while fetching local IP');
      rtcConnection.close();
    }, 5000); // 5 seconds timeout
  });
}

// Example usage
(async () => {
  const result = await getIPAndLocation();
  console.log('IP and Location:', result);

  try {
    const localIP = await getLocalIPAddress();
    console.log('Local IP Address:', localIP);
  } catch (localIPError) {
    console.error('Error fetching local IP address:', localIPError);
  }
})();
