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
    const token = "KEY=Qr6Ty8Pw3Nv1Az5Gh7Lc9BmK SECRET=S1dF2gH3jK4lM5nP6qR7tV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2";

    // Get the request body
    const requestData = await req.json();
    
    // Store the quote request in Supabase first
    const { data: quoteData, error: quoteError } = await supabase
      .from('quick_quotes')
      .insert({
        source: requestData.source || 'KodomBranchOne',
        external_reference_id: requestData.externalReferenceId || '',
        vehicle_year: requestData.vehicles?.[0]?.year || null,
        vehicle_make: requestData.vehicles?.[0]?.make || '',
        vehicle_model: requestData.vehicles?.[0]?.model || '',
        mm_code: requestData.vehicles?.[0]?.mmCode || null,
        modified: requestData.vehicles?.[0]?.modified || 'N',
        category: requestData.vehicles?.[0]?.category || null,
        colour: requestData.vehicles?.[0]?.colour || null,
        engine_size: requestData.vehicles?.[0]?.engineSize || null,
        financed: requestData.vehicles?.[0]?.financed || 'N',
        owner: requestData.vehicles?.[0]?.owner || 'Y',
        party_is_regular_driver: requestData.vehicles?.[0]?.partyIsRegularDriver || 'Y',
        accessories: requestData.vehicles?.[0]?.accessories || 'N',
        accessories_amount: requestData.vehicles?.[0]?.accessoriesAmount || 0,
        retail_value: requestData.vehicles?.[0]?.retailValue || null,
        market_value: requestData.vehicles?.[0]?.marketValue || null,
        insured_value_type: requestData.vehicles?.[0]?.insuredValueType || 'Retail',
        use_type: requestData.vehicles?.[0]?.useType || 'Private',
        overnight_parking_situation: requestData.vehicles?.[0]?.overnightParkingSituation || null,
        cover_code: requestData.vehicles?.[0]?.coverCode || 'Comprehensive',
        address_line: requestData.vehicles?.[0]?.address?.addressLine || null,
        postal_code: requestData.vehicles?.[0]?.address?.postalCode || null,
        suburb: requestData.vehicles?.[0]?.address?.suburb || null,
        latitude: requestData.vehicles?.[0]?.address?.latitude || null,
        longitude: requestData.vehicles?.[0]?.address?.longitude || null,
        marital_status: requestData.vehicles?.[0]?.regularDriver?.maritalStatus || null,
        currently_insured: requestData.vehicles?.[0]?.regularDriver?.currentlyInsured || false,
        years_without_claims: requestData.vehicles?.[0]?.regularDriver?.yearsWithoutClaims || 0,
        relation_to_policy_holder: requestData.vehicles?.[0]?.regularDriver?.relationToPolicyHolder || 'Self',
        email_address: requestData.vehicles?.[0]?.regularDriver?.emailAddress || null,
        mobile_number: requestData.vehicles?.[0]?.regularDriver?.mobileNumber || null,
        driver_id_number: requestData.vehicles?.[0]?.regularDriver?.idNumber || null,
        prv_ins_losses: requestData.vehicles?.[0]?.regularDriver?.prvInsLosses || 0,
        license_issue_date: requestData.vehicles?.[0]?.regularDriver?.licenseIssueDate || null,
        date_of_birth: requestData.vehicles?.[0]?.regularDriver?.dateOfBirth || null,
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

    // Update the quote record with API response
    const updateData: any = {
      api_response: responseData,
      status: response.ok ? 'success' : 'error'
    };

    // Extract quote information if successful
    if (response.ok && typeof responseData === 'object') {
      if (responseData.quote_id || responseData.quoteId) {
        updateData.external_reference_id = responseData.quote_id || responseData.quoteId;
      }
      if (responseData.premium) {
        updateData.quote_amount = responseData.premium;
      }
      if (responseData.excess) {
        updateData.excess = responseData.excess;
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