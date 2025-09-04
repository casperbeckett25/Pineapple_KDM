const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method Not Allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  try {
    const api_url = "http://gw.pineapple.co.za/users/motor_lead";
    const token = "KEY=Qr6Ty8Pw3Nv1Az5Gh7Lc9BmK SECRET=S1dF2gH3jK4lM5nP6qR7tV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2";

    // Get the request body
    const requestData = await req.json();
    
    console.log('Lead transfer request:', requestData);

    // Make the API request to Pineapple
    const response = await fetch(api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    const responseText = await response.text();
    console.log('Pineapple API response:', responseText);
    
    let responseData;
    
    // Try to parse response as JSON
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    // Return structured JSON response
    const structuredResponse = {
      success: response.ok,
      status: response.status,
      data: response.ok ? responseData : null,
      error: response.ok ? null : (typeof responseData === 'object' && responseData.message ? responseData.message : responseText || 'API request failed'),
      redirect_url: responseData?.redirect_url || null
    };

    return new Response(JSON.stringify(structuredResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});