import React, { useState } from 'react';
import { Car, Shield, DollarSign, CheckCircle, AlertCircle, Loader2, Send, Calculator } from 'lucide-react';
import { supabase } from './lib/supabase';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  id_number: string;
  contact_number: string;
  agent_name: string;
}

interface QuickQuoteFormData {
  source: string;
  externalReferenceId: string;
  year: number;
  make: string;
  model: string;
  mmCode: string;
  modified: string;
  category: string;
  colour: string;
  engineSize: number;
  financed: string;
  owner: string;
  status: string;
  partyIsRegularDriver: string;
  accessories: string;
  accessoriesAmount: number;
  retailValue: number;
  marketValue: number;
  insuredValueType: string;
  useType: string;
  overnightParkingSituation: string;
  coverCode: string;
  addressLine: string;
  postalCode: string;
  suburb: string;
  latitude: number;
  longitude: number;
  maritalStatus: string;
  currentlyInsured: boolean;
  yearsWithoutClaims: number;
  relationToPolicyHolder: string;
  emailAddress: string;
  mobileNumber: string;
  idNumber: string;
  prvInsLosses: number;
  licenseIssueDate: string;
  dateOfBirth: string;
}

interface FormErrors {
  [key: string]: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'transfer' | 'quote'>('transfer');
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    id_number: '',
    contact_number: '',
    agent_name: '',
  });

  const [quickQuoteData, setQuickQuoteData] = useState<QuickQuoteFormData>({
    source: 'KodomBranchOne',
    externalReferenceId: '',
    year: new Date().getFullYear(),
    make: '',
    model: '',
    mmCode: '',
    modified: 'N',
    category: 'HB',
    colour: '',
    engineSize: 1.0,
    financed: 'N',
    owner: 'Y',
    status: 'New',
    partyIsRegularDriver: 'Y',
    accessories: 'N',
    accessoriesAmount: 0,
    retailValue: 0,
    marketValue: 0,
    insuredValueType: 'Retail',
    useType: 'Private',
    overnightParkingSituation: 'Garage',
    coverCode: 'Comprehensive',
    addressLine: '',
    postalCode: '',
    suburb: '',
    latitude: 0,
    longitude: 0,
    maritalStatus: 'Single',
    currentlyInsured: false,
    yearsWithoutClaims: 0,
    relationToPolicyHolder: 'Self',
    emailAddress: '',
    mobileNumber: '',
    idNumber: '',
    prvInsLosses: 0,
    licenseIssueDate: '',
    dateOfBirth: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [apiResponse, setApiResponse] = useState<any>(null);

  const validateTransferForm = (): boolean => {
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

  const validateQuickQuoteForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!quickQuoteData.make.trim()) {
      newErrors.make = 'Vehicle make is required';
    }
    
    if (!quickQuoteData.model.trim()) {
      newErrors.model = 'Vehicle model is required';
    }
    
    if (!quickQuoteData.colour.trim()) {
      newErrors.colour = 'Vehicle colour is required';
    }
    
    if (quickQuoteData.retailValue <= 0) {
      newErrors.retailValue = 'Retail value must be greater than 0';
    }
    
    if (quickQuoteData.marketValue <= 0) {
      newErrors.marketValue = 'Market value must be greater than 0';
    }
    
    if (!quickQuoteData.addressLine.trim()) {
      newErrors.addressLine = 'Address is required';
    }
    
    if (!quickQuoteData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    
    if (!quickQuoteData.suburb.trim()) {
      newErrors.suburb = 'Suburb is required';
    }
    
    if (!quickQuoteData.emailAddress.trim()) {
      newErrors.emailAddress = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(quickQuoteData.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }
    
    if (!quickQuoteData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    }
    
    if (!quickQuoteData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required';
    } else if (!/^[0-9]{13}$/.test(quickQuoteData.idNumber)) {
      newErrors.idNumber = 'ID number must be 13 digits';
    }
    
    if (!quickQuoteData.licenseIssueDate) {
      newErrors.licenseIssueDate = 'License issue date is required';
    }
    
    if (!quickQuoteData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    if (activeTab === 'transfer') {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    } else {
      setQuickQuoteData(prev => ({ ...prev, [name]: finalValue }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTransferForm()) return;
    
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
          source: 'KodomBranchOne',
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
        try {
          data = JSON.parse(data);
        } catch {}
      }

      const isSuccess = (
        (typeof data === "object" &&
          data.success === true &&
          data.data &&
          data.data.redirect_url) ||
        (typeof data === "string" && data.includes("redirect_url"))
      );

      if (isSuccess) {
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

  const handleQuickQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateQuickQuoteForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setApiResponse(null);
    
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-quote`;
      
      const requestBody = {
        source: quickQuoteData.source,
        externalReferenceId: quickQuoteData.externalReferenceId,
        vehicles: [
          {
            year: quickQuoteData.year,
            make: quickQuoteData.make,
            model: quickQuoteData.model,
            mmCode: quickQuoteData.mmCode,
            modified: quickQuoteData.modified,
            category: quickQuoteData.category,
            colour: quickQuoteData.colour,
            engineSize: quickQuoteData.engineSize,
            financed: quickQuoteData.financed,
            owner: quickQuoteData.owner,
            status: quickQuoteData.status,
            partyIsRegularDriver: quickQuoteData.partyIsRegularDriver,
            accessories: quickQuoteData.accessories,
            accessoriesAmount: quickQuoteData.accessoriesAmount,
            retailValue: quickQuoteData.retailValue,
            marketValue: quickQuoteData.marketValue,
            insuredValueType: quickQuoteData.insuredValueType,
            useType: quickQuoteData.useType,
            overnightParkingSituation: quickQuoteData.overnightParkingSituation,
            coverCode: quickQuoteData.coverCode,
            address: {
              addressLine: quickQuoteData.addressLine,
              postalCode: parseInt(quickQuoteData.postalCode),
              suburb: quickQuoteData.suburb,
              latitude: quickQuoteData.latitude,
              longitude: quickQuoteData.longitude
            },
            regularDriver: {
              maritalStatus: quickQuoteData.maritalStatus,
              currentlyInsured: quickQuoteData.currentlyInsured,
              yearsWithoutClaims: quickQuoteData.yearsWithoutClaims,
              relationToPolicyHolder: quickQuoteData.relationToPolicyHolder,
              emailAddress: quickQuoteData.emailAddress,
              mobileNumber: quickQuoteData.mobileNumber,
              idNumber: quickQuoteData.idNumber,
              prvInsLosses: quickQuoteData.prvInsLosses,
              licenseIssueDate: quickQuoteData.licenseIssueDate,
              dateOfBirth: quickQuoteData.dateOfBirth
            }
          }
        ]
      };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody),
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
        try {
          data = JSON.parse(data);
        } catch {}
      }

      if (response.ok) {
        setSubmitStatus('success');
        setApiResponse(data);
      } else {
        setApiResponse(data);
        console.error('API Response:', data);
        throw new Error('Failed to get quote');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error getting quote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserFriendlyErrorMessage = (apiResponse: any): string => {
    if (typeof apiResponse === 'object' && apiResponse.success === false && apiResponse.error) {
      const errorMessage = apiResponse.error.message;
      
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
      
      return errorMessage;
    }
    
    return "Something went wrong. Please try again or contact support.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-orange-400 to-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <img 
                src="https://kodomconnect.co.za/kodomconnectlogo.png" 
                alt="Kodom Connect Logo" 
                className="h-12 w-auto"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                Kodom Connect
              </h1>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">Trusted & Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-t-2xl shadow-lg border-b-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('transfer')}
              className={`flex-1 px-6 py-4 text-lg font-semibold rounded-tl-2xl transition-all duration-300 ${
                activeTab === 'transfer'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Transfer Lead</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quote')}
              className={`flex-1 px-6 py-4 text-lg font-semibold rounded-tr-2xl transition-all duration-300 ${
                activeTab === 'quote'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Quick Quote</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-b-2xl shadow-xl border-t-0">
          {activeTab === 'transfer' ? (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full mb-4">
                  <Send className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                  Transfer Lead
                </h2>
                <p className="text-gray-600">Submit lead information for processing</p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        errors.first_name
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-orange-400'
                      } focus:outline-none focus:ring-2 focus:ring-orange-100`}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                    )}
                  </div>

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
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        errors.last_name
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-orange-400'
                      } focus:outline-none focus:ring-2 focus:ring-orange-100`}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                  </div>
                </div>

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
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-orange-400'
                    } focus:outline-none focus:ring-2 focus:ring-orange-100`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        errors.contact_number
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-orange-400'
                      } focus:outline-none focus:ring-2 focus:ring-orange-100`}
                      placeholder="Enter phone number"
                    />
                    {errors.contact_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact_number}</p>
                    )}
                  </div>

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
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        errors.id_number
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-orange-400'
                      } focus:outline-none focus:ring-2 focus:ring-orange-100`}
                      placeholder="Enter ID number"
                    />
                    {errors.id_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.id_number}</p>
                    )}
                  </div>
                </div>

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
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                      errors.agent_name
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-orange-400'
                    } focus:outline-none focus:ring-2 focus:ring-orange-100`}
                    placeholder="Enter agent name"
                  />
                  {errors.agent_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.agent_name}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Transferring Lead...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Transfer Lead</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-4">
                  <Calculator className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Quick Quote
                </h2>
                <p className="text-gray-600">Get a comprehensive vehicle insurance quote</p>
              </div>

              <form onSubmit={handleQuickQuoteSubmit} className="space-y-8">
                {/* Vehicle Information */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Car className="h-5 w-5 mr-2 text-green-600" />
                    Vehicle Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                      <input
                        type="number"
                        name="year"
                        value={quickQuoteData.year}
                        onChange={handleInputChange}
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                      <input
                        type="text"
                        name="make"
                        value={quickQuoteData.make}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.make ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-400'
                        } focus:outline-none focus:ring-2 focus:ring-green-100`}
                        placeholder="e.g., Volkswagen"
                      />
                      {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                      <input
                        type="text"
                        name="model"
                        value={quickQuoteData.model}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.model ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-400'
                        } focus:outline-none focus:ring-2 focus:ring-green-100`}
                        placeholder="e.g., Polo TSI 1.2 Comfortline"
                      />
                      {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Colour *</label>
                      <input
                        type="text"
                        name="colour"
                        value={quickQuoteData.colour}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.colour ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-400'
                        } focus:outline-none focus:ring-2 focus:ring-green-100`}
                        placeholder="e.g., White"
                      />
                      {errors.colour && <p className="mt-1 text-sm text-red-600">{errors.colour}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Engine Size (L)</label>
                      <input
                        type="number"
                        name="engineSize"
                        value={quickQuoteData.engineSize}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0.1"
                        max="10"
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">MM Code</label>
                      <input
                        type="text"
                        name="mmCode"
                        value={quickQuoteData.mmCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Retail Value (R) *</label>
                      <input
                        type="number"
                        name="retailValue"
                        value={quickQuoteData.retailValue}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.retailValue ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-400'
                        } focus:outline-none focus:ring-2 focus:ring-green-100`}
                      />
                      {errors.retailValue && <p className="mt-1 text-sm text-red-600">{errors.retailValue}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Market Value (R) *</label>
                      <input
                        type="number"
                        name="marketValue"
                        value={quickQuoteData.marketValue}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.marketValue ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-400'
                        } focus:outline-none focus:ring-2 focus:ring-green-100`}
                      />
                      {errors.marketValue && <p className="mt-1 text-sm text-red-600">{errors.marketValue}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Type</label>
                      <select
                        name="coverCode"
                        value={quickQuoteData.coverCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                      >
                        <option value="Comprehensive">Comprehensive</option>
                        <option value="Third Party">Third Party</option>
                        <option value="Third Party Fire & Theft">Third Party Fire & Theft</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Address Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line *</label>
                      <input
                        type="text"
                        name="addressLine"
                        value={quickQuoteData.addressLine}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.addressLine ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                        placeholder="123 Main Street"
                      />
                      {errors.addressLine && <p className="mt-1 text-sm text-red-600">{errors.addressLine}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Suburb *</label>
                      <input
                        type="text"
                        name="suburb"
                        value={quickQuoteData.suburb}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.suburb ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                        placeholder="Sandton"
                      />
                      {errors.suburb && <p className="mt-1 text-sm text-red-600">{errors.suburb}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={quickQuoteData.postalCode}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.postalCode ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-100`}
                        placeholder="2196"
                      />
                      {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Driver Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="emailAddress"
                        value={quickQuoteData.emailAddress}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.emailAddress ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-400'
                        } focus:outline-none focus:ring-2 focus:ring-purple-100`}
                        placeholder="example@gmail.com"
                      />
                      {errors.emailAddress && <p className="mt-1 text-sm text-red-600">{errors.emailAddress}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={quickQuoteData.mobileNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.mobileNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-400'
                        } focus:outline-none focus:ring-2 focus:ring-purple-100`}
                        placeholder="0821234567"
                      />
                      {errors.mobileNumber && <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
                      <input
                        type="text"
                        name="idNumber"
                        value={quickQuoteData.idNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.idNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-400'
                        } focus:outline-none focus:ring-2 focus:ring-purple-100`}
                        placeholder="9404054800086"
                      />
                      {errors.idNumber && <p className="mt-1 text-sm text-red-600">{errors.idNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={quickQuoteData.dateOfBirth}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.dateOfBirth ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-400'
                        } focus:outline-none focus:ring-2 focus:ring-purple-100`}
                      />
                      {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">License Issue Date *</label>
                      <input
                        type="date"
                        name="licenseIssueDate"
                        value={quickQuoteData.licenseIssueDate}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                          errors.licenseIssueDate ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-400'
                        } focus:outline-none focus:ring-2 focus:ring-purple-100`}
                      />
                      {errors.licenseIssueDate && <p className="mt-1 text-sm text-red-600">{errors.licenseIssueDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                      <select
                        name="maritalStatus"
                        value={quickQuoteData.maritalStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years Without Claims</label>
                      <input
                        type="number"
                        name="yearsWithoutClaims"
                        value={quickQuoteData.yearsWithoutClaims}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">External Reference ID</label>
                      <input
                        type="text"
                        name="externalReferenceId"
                        value={quickQuoteData.externalReferenceId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                        placeholder="Optional reference ID"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Getting Quote...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      <span>Get Quick Quote</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="mx-8 mb-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                <div className="flex items-center space-x-2 text-green-700 mb-4">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">Success!</span>
                </div>
                {apiResponse && (
                  <div className="text-gray-700">
                    {activeTab === 'transfer' && apiResponse.data && (
                      <>
                        <div className="mb-4">
                          <strong>Lead Reference:</strong> {apiResponse.data.uuid}
                        </div>
                        {apiResponse.data.redirect_url && (
                          <a
                            href={apiResponse.data.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            Continue to Your Lead
                          </a>
                        )}
                      </>
                    )}
                    {activeTab === 'quote' && (
                      <div>
                        <p className="mb-4">Your quote has been generated successfully!</p>
                        <details className="mt-4">
                          <summary className="cursor-pointer text-green-700 font-medium">View Quote Details</summary>
                          <pre className="mt-2 text-xs bg-green-100 p-4 rounded overflow-auto">
                            {JSON.stringify(apiResponse, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="mx-8 mb-8">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border-2 border-red-200">
                <div className="flex items-center space-x-2 text-red-600 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Error occurred</span>
                </div>
                <p className="text-red-700 mb-4">{getUserFriendlyErrorMessage(apiResponse)}</p>
                
                {apiResponse && 
                 typeof apiResponse === 'object' && 
                 apiResponse.error && 
                 apiResponse.error.message && 
                 apiResponse.error.message.includes('lead already exists') && (
                  <div className="mb-4">
                    <button
                      onClick={() => window.open('mailto:support@quicksave.co.za?subject=Existing Quote Request&body=I need help with my existing quote request for phone number: ' + (activeTab === 'transfer' ? formData.contact_number : quickQuoteData.mobileNumber), '_blank')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
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
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border-2 border-orange-100 hover:shadow-xl transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg mb-4">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Coverage</h3>
            <p className="text-gray-600">Protection for your vehicle and peace of mind</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border-2 border-green-100 hover:shadow-xl transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg mb-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-600">Compare quotes from top insurers instantly</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border-2 border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg mb-4">
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