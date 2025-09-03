import React, { useState } from 'react';
import { Car, User, Phone, Mail, CreditCard, Send, UserCheck } from 'lucide-react';
import { supabase } from './lib/supabase';

interface VehicleData {
  make: string;
  model: string;
  year: string;
  engineSize: string;
  fuelType: string;
  transmission: string;
  vehicleType: string;
  vehicleUse: string;
  parkingLocation: string;
  securityFeatures: string[];
  modifications: string;
  estimatedValue: string;
}

interface DriverData {
  firstName: string;
  lastName: string;
  agentName: string;
  age: string;
  licenseType: string;
  yearsLicensed: string;
  previousClaims: string;
  criminalRecord: string;
}

interface ContactData {
  email: string;
  phone: string;
  idNumber: string;
}

interface CoverageData {
  coverType: string;
  excess: string;
  additionalCover: string[];
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

  const [vehicleData, setVehicleData] = useState<VehicleData>({
    make: '',
    model: '',
    year: '',
    engineSize: '',
    fuelType: '',
    transmission: '',
    vehicleType: '',
    vehicleUse: '',
    parkingLocation: '',
    securityFeatures: [],
    modifications: '',
    estimatedValue: ''
  });

  const [driverData, setDriverData] = useState<DriverData>({
    firstName: '',
    lastName: '',
    agentName: '',
    age: '',
    licenseType: '',
    yearsLicensed: '',
    previousClaims: '',
    criminalRecord: ''
  });

  const [contactData, setContactData] = useState<ContactData>({
    email: '',
    phone: '',
    idNumber: ''
  });

  const [coverageData, setCoverageData] = useState<CoverageData>({
    coverType: '',
    excess: '',
    additionalCover: []
  });

  const [leadTransferData, setLeadTransferData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    idNumber: '',
    agentName: '',
    source: 'Kodom_Connect',
    metaData: {}
  });

  // Auto-populate lead transfer data when driver/contact data changes
  React.useEffect(() => {
    setLeadTransferData(prev => ({
      ...prev,
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      agentName: driverData.agentName,
      email: contactData.email,
      contactNumber: contactData.phone,
      idNumber: contactData.idNumber
    }));
  }, [driverData.firstName, driverData.lastName, driverData.agentName, contactData.email, contactData.phone, contactData.idNumber]);

  const handleSecurityFeatureChange = (feature: string, checked: boolean) => {
    setVehicleData(prev => ({
      ...prev,
      securityFeatures: checked
        ? [...prev.securityFeatures, feature]
        : prev.securityFeatures.filter(f => f !== feature)
    }));
  };

  const handleAdditionalCoverChange = (cover: string, checked: boolean) => {
    setCoverageData(prev => ({
      ...prev,
      additionalCover: checked
        ? [...prev.additionalCover, cover]
        : prev.additionalCover.filter(c => c !== cover)
    }));
  };

  const handleQuoteSubmit = async () => {
    setIsLoading(true);
    setQuoteResult(null);

    try {
      const quotePayload = {
        source: "KodomBranchOne",
        externalReferenceId: `QUOTE_${Date.now()}`,
        vehicles: [{
          make: vehicleData.make,
          model: vehicleData.model,
          year: parseInt(vehicleData.year),
          engineSize: vehicleData.engineSize,
          fuelType: vehicleData.fuelType,
          transmission: vehicleData.transmission,
          vehicleType: vehicleData.vehicleType,
          vehicleUse: vehicleData.vehicleUse,
          parkingLocation: vehicleData.parkingLocation,
          securityFeatures: vehicleData.securityFeatures,
          modifications: vehicleData.modifications,
          estimatedValue: parseFloat(vehicleData.estimatedValue) || 0
        }],
        driver: {
          firstName: driverData.firstName,
          lastName: driverData.lastName,
          age: parseInt(driverData.age),
          licenseType: driverData.licenseType,
          yearsLicensed: parseInt(driverData.yearsLicensed),
          previousClaims: driverData.previousClaims,
          criminalRecord: driverData.criminalRecord === 'yes'
        },
        contact: {
          email: contactData.email,
          phone: contactData.phone,
          idNumber: contactData.idNumber
        },
        coverage: {
          coverType: coverageData.coverType,
          excess: parseFloat(coverageData.excess) || 0,
          additionalCover: coverageData.additionalCover
        }
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

      const result = await response.json();
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
        contact_number: leadTransferData.contactNumber,
        id_number: leadTransferData.idNumber,
        agent_name: leadTransferData.agentName,
        meta_data: {
          ...leadTransferData.metaData,
          quote_reference: quoteResult?.data?.quoteId,
          vehicle_info: vehicleData,
          coverage_info: coverageData
        }
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
    return vehicleData.make && vehicleData.model && vehicleData.year &&
           driverData.firstName && driverData.lastName && driverData.age &&
           contactData.email && contactData.phone &&
           coverageData.coverType;
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
                      placeholder="e.g., Toyota"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                    <input
                      type="text"
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Corolla"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                    <input
                      type="number"
                      value={vehicleData.year}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="2020"
                      min="1990"
                      max="2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Engine Size</label>
                    <input
                      type="text"
                      value={vehicleData.engineSize}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, engineSize: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., 1.6L"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                    <select
                      value={vehicleData.fuelType}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, fuelType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select fuel type</option>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
                    <select
                      value={vehicleData.transmission}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, transmission: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select transmission</option>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                    <select
                      value={vehicleData.vehicleType}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, vehicleType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="sedan">Sedan</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="suv">SUV</option>
                      <option value="bakkie">Bakkie</option>
                      <option value="coupe">Coupe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Use</label>
                    <select
                      value={vehicleData.vehicleUse}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, vehicleUse: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select vehicle use</option>
                      <option value="private">Private</option>
                      <option value="business">Business</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parking Location</label>
                    <select
                      value={vehicleData.parkingLocation}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, parkingLocation: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select parking location</option>
                      <option value="garage">Garage</option>
                      <option value="driveway">Driveway</option>
                      <option value="street">Street</option>
                      <option value="secure_parking">Secure Parking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Value (R)</label>
                    <input
                      type="number"
                      value={vehicleData.estimatedValue}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="250000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Security Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Alarm', 'Immobilizer', 'Tracking Device', 'Central Locking', 'Security Gates', 'Armed Response'].map((feature) => (
                      <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vehicleData.securityFeatures.includes(feature)}
                          onChange={(e) => handleSecurityFeatureChange(feature, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modifications</label>
                  <textarea
                    value={vehicleData.modifications}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, modifications: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={3}
                    placeholder="Describe any modifications to the vehicle..."
                  />
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
                      placeholder="John"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                    <input
                      type="number"
                      value={driverData.age}
                      onChange={(e) => setDriverData(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="30"
                      min="18"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
                    <select
                      value={driverData.licenseType}
                      onChange={(e) => setDriverData(prev => ({ ...prev, licenseType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select license type</option>
                      <option value="code_b">Code B (Light Motor Vehicle)</option>
                      <option value="code_c">Code C (Heavy Motor Vehicle)</option>
                      <option value="code_eb">Code EB (Light Motor Vehicle with Trailer)</option>
                      <option value="code_ec">Code EC (Heavy Motor Vehicle with Trailer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years Licensed</label>
                    <input
                      type="number"
                      value={driverData.yearsLicensed}
                      onChange={(e) => setDriverData(prev => ({ ...prev, yearsLicensed: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="10"
                      min="0"
                      max="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previous Claims</label>
                    <select
                      value={driverData.previousClaims}
                      onChange={(e) => setDriverData(prev => ({ ...prev, previousClaims: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select claims history</option>
                      <option value="none">No previous claims</option>
                      <option value="1">1 claim</option>
                      <option value="2">2 claims</option>
                      <option value="3+">3 or more claims</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Criminal Record</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="criminalRecord"
                          value="no"
                          checked={driverData.criminalRecord === 'no'}
                          onChange={(e) => setDriverData(prev => ({ ...prev, criminalRecord: e.target.value }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="criminalRecord"
                          value="yes"
                          checked={driverData.criminalRecord === 'yes'}
                          onChange={(e) => setDriverData(prev => ({ ...prev, criminalRecord: e.target.value }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={driverData.agentName}
                      onChange={(e) => setDriverData(prev => ({ ...prev, agentName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Agent handling this quote"
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
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0123456789"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                    <input
                      type="text"
                      value={contactData.idNumber}
                      onChange={(e) => setContactData(prev => ({ ...prev, idNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="9001010000000"
                    />
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
                      value={coverageData.coverType}
                      onChange={(e) => setCoverageData(prev => ({ ...prev, coverType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select cover type</option>
                      <option value="comprehensive">Comprehensive</option>
                      <option value="third_party">Third Party</option>
                      <option value="third_party_fire_theft">Third Party, Fire & Theft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Excess Amount (R)</label>
                    <select
                      value={coverageData.excess}
                      onChange={(e) => setCoverageData(prev => ({ ...prev, excess: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select excess</option>
                      <option value="0">R0</option>
                      <option value="2500">R2,500</option>
                      <option value="5000">R5,000</option>
                      <option value="7500">R7,500</option>
                      <option value="10000">R10,000</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Additional Cover Options</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Roadside Assistance', 'Rental Car', 'Personal Accident', 'Windscreen Cover', 'Hail Damage', 'Tyre & Rim'].map((cover) => (
                      <label key={cover} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={coverageData.additionalCover.includes(cover)}
                          onChange={(e) => handleAdditionalCoverChange(cover, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{cover}</span>
                      </label>
                    ))}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={leadTransferData.agentName}
                      onChange={(e) => setLeadTransferData(prev => ({ ...prev, agentName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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