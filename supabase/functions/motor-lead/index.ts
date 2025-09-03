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

    const api_url = "http://gw.pineapple.co.za/users/motor_lead";
    const token = "KEY=Qr6Ty8Pw3Nv1Az5Gh7Lc9BmK SECRET=S1dF2gH3jK4lM5nP6qR7tV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2";

    // Get the request body
    const requestData = await req.json();
    
    // Store the lead in Supabase first
    const { data: leadData, error: leadError } = await supabase
      .from('motor_leads')
      .insert({
        source: requestData.source || 'Kodom_Connect',
        first_name: requestData.first_name,
        last_name: requestData.last_name,
        email: requestData.email,
        contact_number: requestData.contact_number,
        id_number: requestData.id_number || '',
        quote_id: requestData.quote_id || '',
        status: 'pending'
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error storing lead:', leadError);
      return new Response(
        JSON.stringify({ error: `Database error: ${leadError.message}` }),
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
        "Authorization": `Bearer ${token}`,
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

    // Update the lead record with API response
    const updateData: any = {
      api_response: responseData,
      status: response.ok ? 'success' : 'error'
    };

    // Extract quote reference and redirect URL if successful
    if (response.ok && typeof responseData === 'object' && responseData.success === true && responseData.data) {
      if (responseData.data.uuid) {
        updateData.quote_reference = responseData.data.uuid;
      }
      if (responseData.data.redirect_url) {
        updateData.redirect_url = responseData.data.redirect_url;
      }
    }

    await supabase
      .from('motor_leads')
      .update(updateData)
      .eq('id', leadData.id);

    // Return structured JSON response
    const structuredResponse = {
      success: response.ok,
      status: response.status,
      data: response.ok ? responseData : null,
      error: response.ok ? null : (typeof responseData === 'string' ? responseData : responseData?.message || 'API request failed'),
      quote_reference: updateData.quote_reference || null,
      redirect_url: updateData.redirect_url || null
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