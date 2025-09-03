import React, { useState } from 'react';
import { Car, User, Phone, Mail, CreditCard, Send, UserCheck } from 'lucide-react';
import { supabase } from './lib/supabase';

interface VehicleData {
  make: string;
  model: string;
  year: string;
  engineSize: string;
  mmCode: string;
  modified: string;
  category: string;
  colour: string;
  financed: string;
  owner: string;
  status: string;
  partyIsRegularDriver: string;
  accessories: string;
  accessoriesAmount: string;
  retailValue: string;
  marketValue: string;
  insuredValueType: string;
  useType: string;
  overnightParkingSituation: string;
  coverCode: string;
  addressLine: string;
  postalCode: string;
  suburb: string;
  latitude: string;
  longitude: string;
}

interface DriverData {
  firstName: string;
  lastName: string;
  age: string;
  maritalStatus: string;
  currentlyInsured: string;
  yearsWithoutClaims: string;
  relationToPolicyHolder: string;
  prvInsLosses: string;
  licenseIssueDate: string;
  dateOfBirth: string;
}

interface ContactData {
  email: string;
  phone: string;
  idNumber: string;
}

interface CoverageData {
  agentName: string;
  applicationUser: string;
  applicationUserEmail: string;
}

interface QuoteResponse {
  success: boolean;
  data?: {
    quoteId?: string;
    premium?: number;
    redirect_url?: string;
  };
  error?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('vehicle');
  const [isLoading, setIsLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [showLeadTransfer, setShowLeadTransfer] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [vehicleData, setVehicleData] = useState<VehicleData>({
    make: '',
    model: '',
    year: '',
    engineSize: '',
    mmCode: '',
    modified: 'N',
    category: '',
    colour: '',
    financed: 'N',
    owner: 'Y',
    status: 'New',
    partyIsRegularDriver: 'Y',
    accessories: 'N',
    accessoriesAmount: '0',
    retailValue: '',
    marketValue: '',
    insuredValueType: 'Retail',
    useType: '',
    overnightParkingSituation: '',
    coverCode: '',
    addressLine: '',
    postalCode: '',
    suburb: '',
    latitude: '',
    longitude: ''
  });

  const [driverData, setDriverData] = useState<DriverData>({
    firstName: '',
    lastName: '',
    age: '',
    maritalStatus: '',
    currentlyInsured: 'true',
    yearsWithoutClaims: '0',
    relationToPolicyHolder: 'Self',
    prvInsLosses: '0',
    licenseIssueDate: '',
    dateOfBirth: ''
  });

  const [contactData, setContactData] = useState<ContactData>({
    email: '',
    phone: '',
    idNumber: ''
  });

  const [coverageData, setCoverageData] = useState<CoverageData>({
    agentName: '',
    applicationUser: '',
    applicationUserEmail: ''
  });

  const [leadTransferData, setLeadTransferData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    idNumber: '',
    source: 'KodomBranchOne',
    quoteId: ''
  });

  // Auto-populate lead transfer data when driver/contact data changes
  React.useEffect(() => {
    setLeadTransferData(prev => ({
      ...prev,
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      email: contactData.email,
      contactNumber: contactData.phone,
      idNumber: contactData.idNumber,
      quoteId: quoteResult?.data?.quoteId || ''
    }));
  }, [driverData.firstName, driverData.lastName, contactData.email, contactData.phone, contactData.idNumber, quoteResult?.data?.quoteId]);

  // Validation functions
  const validateIdNumber = (idNumber: string): boolean => {
    // South African ID number validation (13 digits)
    const idRegex = /^\d{13}$/;
    return idRegex.test(idNumber);
  };

  const validateAge = (age: string): boolean => {
    const ageNum = parseInt(age);
    return ageNum >= 18 && ageNum <= 100;
  };

  const calculateDateOfBirth = (age: string): string => {
    if (!age) return '';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - parseInt(age);
    return `${birthYear}-01-01`; // Default to January 1st
  };

  // Update date of birth when age changes
  React.useEffect(() => {
    if (driverData.age) {
      const dob = calculateDateOfBirth(driverData.age);
      setDriverData(prev => ({ ...prev, dateOfBirth: dob }));
    }
  }, [driverData.age]);

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // ID Number validation
    if (contactData.idNumber && !validateIdNumber(contactData.idNumber)) {
      errors.push('ID Number must be exactly 13 digits');
    }

    // Age validation
    if (driverData.age && !validateAge(driverData.age)) {
      errors.push('Age must be between 18 and 100 years');
    }

    return errors;
  };

  const handleQuoteSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setIsLoading(true);
    setQuoteResult(null);

    try {
      const quotePayload = {
        source: "KodomBranchOne",
        externalReferenceId: `QUOTE_${Date.now()}`,
        application_user: coverageData.applicationUser || undefined,
        application_user_email: coverageData.applicationUserEmail || undefined,
        vehicles: [{
          year: parseInt(vehicleData.year),
          make: vehicleData.make,
          model: vehicleData.model,
          mmCode: vehicleData.mmCode,
          modified: vehicleData.modified,
          category: vehicleData.category,
          colour: vehicleData.colour,
          engineSize: parseFloat(vehicleData.engineSize) || 0,
          financed: vehicleData.financed,
          owner: vehicleData.owner,
          status: vehicleData.status,
          partyIsRegularDriver: vehicleData.partyIsRegularDriver,
          accessories: vehicleData.accessories,
          accessoriesAmount: parseInt(vehicleData.accessoriesAmount) || 0,
          retailValue: parseInt(vehicleData.retailValue) || 0,
          marketValue: parseInt(vehicleData.marketValue) || 0,
          insuredValueType: vehicleData.insuredValueType,
          useType: vehicleData.useType,
          overnightParkingSituation: vehicleData.overnightParkingSituation,
          coverCode: vehicleData.coverCode,
          address: {
            addressLine: vehicleData.addressLine,
            postalCode: parseInt(vehicleData.postalCode) || 0,
            suburb: vehicleData.suburb,
            latitude: parseFloat(vehicleData.latitude) || 0,
            longitude: parseFloat(vehicleData.longitude) || 0
          },
          regularDriver: {
            maritalStatus: driverData.maritalStatus,
            currentlyInsured: driverData.currentlyInsured === 'true',
            yearsWithoutClaims: parseInt(driverData.yearsWithoutClaims) || 0,
            relationToPolicyHolder: driverData.relationToPolicyHolder,
            emailAddress: contactData.email,
            mobileNumber: contactData.phone,
            idNumber: contactData.idNumber,
            prvInsLosses: parseInt(driverData.prvInsLosses) || 0,
            licenseIssueDate: driverData.licenseIssueDate,
            dateOfBirth: driverData.dateOfBirth
          }
        }]
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-quote`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(quotePayload)
      });

      const responseText = await response.text();
      let result;
      
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          result = { success: false, error: 'Invalid response format' };
        }
      } else {
        result = { success: false, error: 'Empty response from server' };
      }
      
      setQuoteResult(result);
      
      // Show lead transfer option after successful quote
      if (result.success) {
        setShowLeadTransfer(true);
      }
    } catch (error) {
      console.error('Quote submission error:', error);
      setQuoteResult({
        success: false,
        error: 'Failed to submit quote request'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadTransfer = async () => {
    setIsTransferring(true);

    try {
      const leadPayload = {
        source: leadTransferData.source,
        first_name: leadTransferData.firstName,
        last_name: leadTransferData.lastName,
        email: leadTransferData.email,
        id_number: leadTransferData.idNumber,
        quote_id: leadTransferData.quoteId,
        contact_number: leadTransferData.contactNumber
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/motor-lead`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(leadPayload)
      });

      const responseText = await response.text();
      let result;
      
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          result = { success: false, error: 'Invalid response format' };
        }
      } else {
        result = { success: false, error: 'Empty response from server' };
      }
      
      if (result.success) {
        alert('Lead transferred successfully!');
        setShowLeadTransfer(false);
      } else {
        alert('Lead transfer failed. Please try again.');
      }
    } catch (error) {
      console.error('Lead transfer error:', error);
      alert('Lead transfer failed. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const tabs = [
    { id: 'vehicle', label: 'Vehicle Info', icon: Car },
    { id: 'driver', label: 'Driver Info', icon: User },
    { id: 'contact', label: 'Contact Info', icon: Phone },
    { id: 'coverage', label: 'Coverage', icon: CreditCard },
    { id: 'lead-transfer', label: 'Lead Transfer', icon: UserCheck }
  ];

  const isFormValid = () => {
    const errors = validateForm();
    return errors.length === 0 &&
           vehicleData.make && vehicleData.model && vehicleData.year &&
           driverData.firstName && driverData.lastName && driverData.age &&
           contactData.email && contactData.phone &&
           vehicleData.coverCode;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Quotation</h1>
            <p className="text-gray-600">Get your motor insurance quote in minutes</p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <h3 className="text-red-900 font-semibold mb-2">Please fix the following errors:</h3>
              <ul className="list-disc list-inside text-red-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg shadow-sm p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 mx-1 mb-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Vehicle Information Tab */}
            {activeTab === 'vehicle' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Vehicle Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                    <input
                      type="text"
                      value={vehicleData.make}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Volkswagen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                    <input
                      type="text"
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Polo Tsi 1.2 Comfortline"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                    <input
                      type="number"
                      value={vehicleData.year}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="2019"
                      min="1990"
                      max="2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Engine Size</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vehicleData.engineSize}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, engineSize: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="1.2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MM Code</label>
                    <input
                      type="text"
                      value={vehicleData.mmCode}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, mmCode: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="00815170"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={vehicleData.category}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select category</option>
                      <option value="HB">Hatchback (HB)</option>
                      <option value="SD">Sedan (SD)</option>
                      <option value="SW">Station Wagon (SW)</option>
                      <option value="SUV">SUV</option>
                      <option value="BK">Bakkie (BK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colour</label>
                    <input
                      type="text"
                      value={vehicleData.colour}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, colour: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="White"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Modified</label>
                    <select
                      value={vehicleData.modified}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, modified: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Financed</label>
                    <select
                      value={vehicleData.financed}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, financed: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                    <select
                      value={vehicleData.owner}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, owner: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Use Type</label>
                    <select
                      value={vehicleData.useType}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, useType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select use type</option>
                      <option value="Private">Private</option>
                      <option value="Business">Business</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overnight Parking</label>
                    <select
                      value={vehicleData.overnightParkingSituation}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, overnightParkingSituation: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select parking situation</option>
                      <option value="Garage">Garage</option>
                      <option value="Driveway">Driveway</option>
                      <option value="Street">Street</option>
                      <option value="Secure Parking">Secure Parking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accessories</label>
                    <select
                      value={vehicleData.accessories}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, accessories: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accessories Amount (R)</label>
                    <input
                      type="number"
                      value={vehicleData.accessoriesAmount}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, accessoriesAmount: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="20000"
                      disabled={vehicleData.accessories === 'N'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retail Value (R)</label>
                    <input
                      type="number"
                      value={vehicleData.retailValue}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, retailValue: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="200000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Market Value (R)</label>
                    <input
                      type="number"
                      value={vehicleData.marketValue}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, marketValue: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="180000"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line</label>
                      <input
                        type="text"
                        value={vehicleData.addressLine}
                        onChange={(e) => setVehicleData(prev => ({ ...prev, addressLine: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="number"
                        value={vehicleData.postalCode}
                        onChange={(e) => setVehicleData(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="2196"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Suburb</label>
                      <input
                        type="text"
                        value={vehicleData.suburb}
                        onChange={(e) => setVehicleData(prev => ({ ...prev, suburb: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Sandton"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={vehicleData.latitude}
                        onChange={(e) => setVehicleData(prev => ({ ...prev, latitude: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="-26.10757"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={vehicleData.longitude}
                        onChange={(e) => setVehicleData(prev => ({ ...prev, longitude: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="28.0567"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Information Tab */}
            {activeTab === 'driver' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Driver Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={driverData.firstName}
                      onChange={(e) => setDriverData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Peter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={driverData.lastName}
                      onChange={(e) => setDriverData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age * (18-100)</label>
                    <input
                      type="number"
                      value={driverData.age}
                      onChange={(e) => setDriverData(prev => ({ ...prev, age: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        driverData.age && !validateAge(driverData.age) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="30"
                      min="18"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                    <select
                      value={driverData.maritalStatus}
                      onChange={(e) => setDriverData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select marital status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currently Insured</label>
                    <select
                      value={driverData.currentlyInsured}
                      onChange={(e) => setDriverData(prev => ({ ...prev, currentlyInsured: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years Without Claims</label>
                    <input
                      type="number"
                      value={driverData.yearsWithoutClaims}
                      onChange={(e) => setDriverData(prev => ({ ...prev, yearsWithoutClaims: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0"
                      min="0"
                      max="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previous Insurance Losses</label>
                    <input
                      type="number"
                      value={driverData.prvInsLosses}
                      onChange={(e) => setDriverData(prev => ({ ...prev, prvInsLosses: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Issue Date</label>
                    <input
                      type="date"
                      value={driverData.licenseIssueDate}
                      onChange={(e) => setDriverData(prev => ({ ...prev, licenseIssueDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth (Auto-calculated)</label>
                    <input
                      type="date"
                      value={driverData.dateOfBirth}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="peterSmith007@pineapple.co.za"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0737111119"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Number (13 digits)</label>
                    <input
                      type="text"
                      value={contactData.idNumber}
                      onChange={(e) => setContactData(prev => ({ ...prev, idNumber: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        contactData.idNumber && !validateIdNumber(contactData.idNumber) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="9510025800086"
                      maxLength={13}
                    />
                    {contactData.idNumber && !validateIdNumber(contactData.idNumber) && (
                      <p className="text-red-600 text-sm mt-1">ID Number must be exactly 13 digits</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Coverage Information Tab */}
            {activeTab === 'coverage' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Coverage Options</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Type *</label>
                    <select
                      value={vehicleData.coverCode}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, coverCode: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select cover type</option>
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Third Party">Third Party</option>
                      <option value="Third Party Fire and Theft">Third Party Fire and Theft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insured Value Type</label>
                    <select
                      value={vehicleData.insuredValueType}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, insuredValueType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="Retail">Retail</option>
                      <option value="Market">Market</option>
                      <option value="Agreed">Agreed</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                      <input
                        type="text"
                        value={coverageData.agentName}
                        onChange={(e) => setCoverageData(prev => ({ ...prev, agentName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Agent handling this quote"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application User (Optional)</label>
                      <input
                        type="text"
                        value={coverageData.applicationUser}
                        onChange={(e) => setCoverageData(prev => ({ ...prev, applicationUser: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Agent Fullname"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application User Email (Optional)</label>
                      <input
                        type="email"
                        value={coverageData.applicationUserEmail}
                        onChange={(e) => setCoverageData(prev => ({ ...prev, applicationUserEmail: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="agent@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Ready to Get Your Quote?</h3>
                  <p className="text-blue-700 mb-4">
                    Review your information and click the button below to get your personalized motor insurance quote.
                  </p>
                  <button
                    onClick={handleQuoteSubmit}
                    disabled={!isFormValid() || isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Get Quote
                      </>
                    )}
                  </button>
                </div>

                {/* Quote Result */}
                {quoteResult && (
                  <div className={`p-6 rounded-lg ${quoteResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`text-lg font-semibold mb-2 ${quoteResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {quoteResult.success ? 'Quote Generated Successfully!' : 'Quote Generation Failed'}
                    </h3>
                    {quoteResult.success ? (
                      <div className="space-y-2">
                        {quoteResult.data?.quoteId && (
                          <p className="text-green-700">Quote ID: {quoteResult.data.quoteId}</p>
                        )}
                        {quoteResult.data?.premium && (
                          <p className="text-green-700">Premium: R{quoteResult.data.premium}</p>
                        )}
                        <p className="text-green-700">Your quote has been saved and you can proceed with the lead transfer if needed.</p>
                      </div>
                    ) : (
                      <p className="text-red-700">{
                        typeof quoteResult.error === 'object' 
                          ? quoteResult.error?.message || 'An error occurred while generating your quote.'
                          : quoteResult.error || 'An error occurred while generating your quote.'
                      }</p>
                    )}
                  </div>
                )}

                {/* Lead Transfer Prompt */}
                {showLeadTransfer && quoteResult?.success && (
                  <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Transfer Lead?</h3>
                    <p className="text-yellow-700 mb-4">
                      Would you like to transfer this lead for further processing and follow-up?
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleLeadTransfer}
                        disabled={isTransferring}
                        className="bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                      >
                        {isTransferring ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Transferring...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Yes, Transfer Lead
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowLeadTransfer(false)}
                        className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-all duration-200"
                      >
                        No, Skip
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lead Transfer Tab */}
            {activeTab === 'lead-transfer' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Lead Transfer</h2>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-blue-700 text-sm">
                    This information is automatically populated from the driver and contact details you provided earlier.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={leadTransferData.firstName}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={leadTransferData.lastName}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={leadTransferData.email}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={leadTransferData.contactNumber}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                    <input
                      type="text"
                      value={leadTransferData.idNumber}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, idNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quote ID</label>
                    <input
                      type="text"
                      value={leadTransferData.quoteId}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, quoteId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Auto-populated from quote"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <input
                      type="text"
                      value={leadTransferData.source}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={coverageData.agentName}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="From coverage page"
                    />
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Transfer Lead</h3>
                  <p className="text-green-700 mb-4">
                    Click the button below to transfer this lead for further processing.
                  </p>
                  <button
                    onClick={handleLeadTransfer}
                    disabled={isTransferring || !leadTransferData.firstName || !leadTransferData.lastName || !leadTransferData.email}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {isTransferring ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Transferring Lead...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5 mr-2" />
                        Transfer Lead
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => {
                const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1].id);
                }
              }}
              disabled={activeTab === 'vehicle'}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>

            <button
              onClick={() => {
                const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1].id);
                }
              }}
              disabled={activeTab === 'lead-transfer'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;