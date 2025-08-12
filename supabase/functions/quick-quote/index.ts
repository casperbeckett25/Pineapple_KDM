import { createClient } from 'npm:@supabase/supabase-js@2'

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
      JSON.stringify({ error: "Method Not Allowed" }),
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
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const api_url = "http://gw.pineapple.co.za/api/v1/quote/quick-quote";
    const apiKey = "Qr6Ty8Pw3Nv1Az5Gh7Lc9BmK";
    const apiSecret = "S1dF2gH3jK4lM5nP6qR7tV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2";

    // Get the request body
    const requestData = await req.json();
    
    // Store the quote request in Supabase first
    const { data: quoteData, error: quoteError } = await supabase
      .from('quick_quotes')
      .insert({
        source: requestData.source || 'KodomBranchOne',
        external_reference_id: requestData.externalReferenceId || '',
        vehicle_data: requestData.vehicles?.[0] || {},
        request_data: requestData,
        status: 'pending'
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error storing quote request:', quoteError);
      return new Response(
        JSON.stringify({ error: `Database error: ${quoteError.message}` }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Make the API request to Pineapple
    const response = await fetch(api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
      body: JSON.stringify(requestData),
    });

    const responseText = await response.text();
    let responseData;
    
    // Try to parse response as JSON
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Update the quote record with API response
    const updateData: any = {
      api_response: responseData,
      status: response.ok ? 'success' : 'error'
    };

    // Extract quote information if successful
    if (response.ok && typeof responseData === 'object') {
      if (responseData.quoteId) {
        updateData.quote_id = responseData.quoteId;
      }
      if (responseData.premium) {
        updateData.premium = responseData.premium;
      }
    }

    await supabase
      .from('quick_quotes')
      .update(updateData)
      .eq('id', quoteData.id);

    // Return structured JSON response
    const structuredResponse = {
      success: response.ok,
      status: response.status,
      data: response.ok ? responseData : null,
      error: response.ok ? null : (typeof responseData === 'string' ? responseData : responseData?.message || 'API request failed')
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
      JSON.stringify({ error: `Request failed: ${error.message}` }),
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