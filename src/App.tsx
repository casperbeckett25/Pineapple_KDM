import React, { useState } from 'react';
import { Car, Shield, DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  id_number: string;
  contact_number: string;
  agent_name: string;
}

interface FormErrors {
  [key: string]: string;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    id_number: '',
    contact_number: '',
    agent_name: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [apiResponse, setApiResponse] = useState<any>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required';
    } else if (!/^[0-9]{10}$/.test(formData.contact_number.replace(/\s+/g, ''))) {
      newErrors.contact_number = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.id_number && !/^[0-9]{13}$/.test(formData.id_number)) {
      newErrors.id_number = 'ID number must be 13 digits';
    }
    
    if (!formData.agent_name.trim()) {
      newErrors.agent_name = 'Agent name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setApiResponse(null);
    
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/motor-lead`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          source: 'Kodom_Connect',
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          id_number: formData.id_number || '',
          meta_data: {},
          contact_number: formData.contact_number,
          agent_name: formData.agent_name,
        }),
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
        // Try to parse if it's a JSON string
        try {
          data = JSON.parse(data);
        } catch {}
      }

      // Check for success based on the response structure
      const isSuccess = (
        (typeof data === "object" &&
          data.success === true &&
          data.data &&
          data.data.redirect_url) ||
        (typeof data === "string" && data.includes("redirect_url"))
      );

      if (isSuccess) {
        // If data is string, parse it
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch {}
        }
        
        setSubmitStatus('success');
        setApiResponse(data);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          id_number: '',
          contact_number: '',
          agent_name: '',
        });
      } else {
        setApiResponse(data);
        console.error('API Response:', data);
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserFriendlyErrorMessage = (apiResponse: any): string => {
    if (typeof apiResponse === 'object' && apiResponse.success === false && apiResponse.error) {
      const errorMessage = apiResponse.error.message;
      
      // Handle specific error cases with user-friendly messages
      if (errorMessage.includes('lead already exists') && errorMessage.includes('contact number') && errorMessage.includes('90 days')) {
        return "We found an existing quote request with this phone number from the last 90 days. Please use a different phone number or contact our support team if you need assistance with your existing quote.";
      }
      
      if (errorMessage.includes('email') && errorMessage.includes('already exists')) {
        return "This email address has already been used for a recent quote request. Please use a different email address or contact support.";
      }
      
      if (errorMessage.includes('invalid') && errorMessage.includes('email')) {
        return "Please enter a valid email address.";
      }
      
      if (errorMessage.includes('invalid') && errorMessage.includes('phone') || errorMessage.includes('contact_number')) {
        return "Please enter a valid phone number.";
      }
      
      if (errorMessage.includes('required field')) {
        return "Please fill in all required fields and try again.";
      }
      
      // Return the original message if no specific case matches
      return errorMessage;
    }
    
    return "Something went wrong. Please try again or contact support.";
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://kodomconnect.co.za/kodomconnectlogo.png" 
                alt="Kodom Connect Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-bold text-gray-900">Kodom Connect</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Trusted & Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <img 
              src="https://kodomconnect.co.za/kodomconnectlogo.png" 
              alt="Kodom Connect Logo" 
              className="h-auto w-auto"
            />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Quick Quotation
          </h2>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                    errors.first_name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                  placeholder="Enter your first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                    errors.last_name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                  placeholder="Enter your last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contact_number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                  errors.contact_number
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                placeholder="Enter your phone number"
              />
              {errors.contact_number && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_number}</p>
              )}
            </div>

            {/* ID Number */}
            <div>
              <label htmlFor="id_number" className="block text-sm font-medium text-gray-700 mb-2">
                ID Number (Optional)
              </label>
              <input
                type="text"
                id="id_number"
                name="id_number"
                value={formData.id_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                  errors.id_number
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                placeholder="Enter your ID number"
              />
              {errors.id_number && (
                <p className="mt-1 text-sm text-red-600">{errors.id_number}</p>
              )}
            </div>

            {/* Agent Name */}
            <div>
              <label htmlFor="agent_name" className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                id="agent_name"
                name="agent_name"
                value={formData.agent_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                  errors.agent_name
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                placeholder="Enter the agent's name"
              />
              {errors.agent_name && (
                <p className="mt-1 text-sm text-red-600">{errors.agent_name}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Sending Client Info...</span>
                </>
              ) : (
                <>
                  <span>Submit Lead</span>
                  <DollarSign className="h-5 w-5" />
                </>
              )}
            </button>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 text-green-600 mb-4">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">Success!</span>
                </div>
                {apiResponse && apiResponse.data && (
                  <>
                    <div className="text-gray-700 mb-4">
                      <strong>Lead Reference:</strong> {apiResponse.data.uuid}
                    </div>
                    {apiResponse.data.redirect_url && (
                      <a
                        href={apiResponse.data.redirect_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                      >
                        Continue to Your Lead
                      </a>
                    )}
                  </>
                )}
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2 text-red-600 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Error occurred</span>
                </div>
                <p className="text-red-700 mb-4">{getUserFriendlyErrorMessage(apiResponse)}</p>
                
                {/* Show contact support button for duplicate lead errors */}
                {apiResponse && 
                 typeof apiResponse === 'object' && 
                 apiResponse.error && 
                 apiResponse.error.message && 
                 apiResponse.error.message.includes('lead already exists') && (
                  <div className="mb-4">
                    <button
                      onClick={() => window.open('mailto:support@quicksave.co.za?subject=Existing Quote Request&body=I need help with my existing quote request for phone number: ' + formData.contact_number, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Contact Support
                    </button>
                  </div>
                )}
                
                {apiResponse && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-red-600 font-medium">View Technical Details</summary>
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {typeof apiResponse === "string" ? apiResponse : JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-blue-100">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Coverage</h3>
            <p className="text-gray-600">Protection for your vehicle and peace of mind</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-blue-100">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-600">Compare quotes from top insurers instantly</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-blue-100">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Process</h3>
            <p className="text-gray-600">Get your quote in under 5 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;