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
    const token = "KEY=PIConeT2hy1xGyAxsxQXcYkn SECRET=U3vV5mDa5EHTLy8FIeq7EjH7FBEGGaPcoYVtObHpgvGpz7cK4Km3qrxZGEPPN5KF";

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
        agent_name: requestData.agent_name || '',
        meta_data: requestData.meta_data || {},
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

    // Return the response with the same status code
    return new Response(responseText, {
      status: response.status,
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