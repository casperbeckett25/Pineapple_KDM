import React, { useState } from 'react';
import { Car, User, Shield, CheckCircle, AlertCircle, Phone, Mail, Calendar, MapPin, DollarSign } from 'lucide-react';

interface VehicleData {
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
  address: {
    addressLine: string;
    postalCode: number;
    suburb: string;
    latitude: number;
    longitude: number;
  };
  regularDriver: {
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
  };
}

interface QuoteResponse {
  success: boolean;
  data?: {
    premium?: number;
    excess?: number;
    quoteId?: string;
  };
  error?: string;
}

interface LeadTransferResponse {
  success: boolean;
  data?: {
    uuid?: string;
    redirect_url?: string;
  };
  error?: string;
}

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    year: 2019,
    make: '',
    model: '',
    mmCode: '',
    modified: 'N',
    category: '',
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
    address: {
      addressLine: '',
      postalCode: 0,
      suburb: '',
      latitude: 0,
      longitude: 0
    },
    regularDriver: {
      maritalStatus: 'Single',
      currentlyInsured: false,
      yearsWithoutClaims: 0,
      relationToPolicyHolder: 'Self',
      emailAddress: '',
      mobileNumber: '',
      idNumber: '',
      prvInsLosses: 0,
      licenseIssueDate: '',
      dateOfBirth: ''
    }
  });

  const [driverData, setDriverData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    licenseDate: ''
  });

  const [agentData, setAgentData] = useState({
    agentName: '',
    agentEmail: ''
  });

  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validateIdNumber = (idNumber: string): boolean => {
    return /^\d{13}$/.test(idNumber);
  };

  const validateAge = (age: string): boolean => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
  };

  const calculateDateOfBirth = (age: string): string => {
    if (!age) return '';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - parseInt(age);
    return `${birthYear}-01-01`;
  };

  const handleInputChange = (field: string, value: any, section?: string) => {
    if (section === 'driver') {
      setDriverData(prev => ({ ...prev, [field]: value }));
      
      // Clear validation errors when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: '' }));
      }
    } else if (section === 'agent') {
      setAgentData(prev => ({ ...prev, [field]: value }));
    } else if (section === 'regularDriver') {
      setVehicleData(prev => ({
        ...prev,
        regularDriver: { ...prev.regularDriver, [field]: value }
      }));
      
      // Clear validation errors when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: '' }));
      }
    } else if (section === 'address') {
      setVehicleData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setVehicleData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (currentStep === 2) {
      // Validate driver data
      if (!driverData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      if (!driverData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
      if (!driverData.age || !validateAge(driverData.age)) {
        errors.age = 'Age must be between 18 and 100';
      }
      if (!vehicleData.regularDriver.idNumber || !validateIdNumber(vehicleData.regularDriver.idNumber)) {
        errors.idNumber = 'ID number must be exactly 13 digits';
      }
      if (!vehicleData.regularDriver.emailAddress.trim()) {
        errors.emailAddress = 'Email is required';
      }
      if (!vehicleData.regularDriver.mobileNumber.trim()) {
        errors.mobileNumber = 'Mobile number is required';
      }
      if (!driverData.licenseDate) {
        errors.licenseDate = 'License issue date is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 2) {
        // Update vehicle data with driver information
        setVehicleData(prev => ({
          ...prev,
          regularDriver: {
            ...prev.regularDriver,
            dateOfBirth: calculateDateOfBirth(driverData.age),
            licenseIssueDate: driverData.licenseDate
          }
        }));
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleQuoteSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setQuoteResult(null);

    try {
      const quotePayload = {
        source: "KodomBranchOne",
        externalReferenceId: vehicleData.regularDriver.idNumber,
        vehicles: [vehicleData]
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotePayload)
      });

      const responseText = await response.text();
      let result;
      
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = { success: false, error: 'Invalid response format' };
        }
      } else {
        result = { success: false, error: 'Empty response' };
      }

      setQuoteResult(result);
      
      if (result.success) {
        setCurrentStep(4); // Move to results page
      }
    } catch (error) {
      console.error('Quote submission error:', error);
      setQuoteResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeadTransfer = async () => {
    setIsTransferring(true);

    try {
      const leadPayload = {
        source: "KodomBranchOne",
        first_name: driverData.firstName,
        last_name: driverData.lastName,
        email: vehicleData.regularDriver.emailAddress,
        id_number: vehicleData.regularDriver.idNumber,
        quote_id: quoteResult?.data?.quoteId || '',
        contact_number: vehicleData.regularDriver.mobileNumber,
        application_user: agentData.agentName || '',
        application_user_email: agentData.agentEmail || ''
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/motor-lead`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadPayload)
      });

      const responseText = await response.text();
      let result;
      
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = { success: false, error: 'Invalid response format' };
        }
      } else {
        result = { success: false, error: 'Empty response' };
      }

      if (result.success) {
        alert('Lead transferred successfully!');
        if (result.data?.redirect_url) {
          window.open(result.data.redirect_url, '_blank');
        }
      } else {
        alert(`Lead transfer failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Lead transfer error:', error);
      alert(`Lead transfer error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const renderVehicleStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Car className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Information</h2>
        <p className="text-gray-600">Tell us about your vehicle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <input
            type="number"
            value={vehicleData.year}
            onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 2019)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1990"
            max="2025"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
          <input
            type="text"
            value={vehicleData.make}
            onChange={(e) => handleInputChange('make', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Volkswagen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <input
            type="text"
            value={vehicleData.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Polo Tsi 1.2 Comfortline"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">MM Code</label>
          <input
            type="text"
            value={vehicleData.mmCode}
            onChange={(e) => handleInputChange('mmCode', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 00815170"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={vehicleData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Category</option>
            <option value="HB">Hatchback</option>
            <option value="SD">Sedan</option>
            <option value="SW">Station Wagon</option>
            <option value="SUV">SUV</option>
            <option value="UTE">Utility</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Colour</label>
          <input
            type="text"
            value={vehicleData.colour}
            onChange={(e) => handleInputChange('colour', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., White"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Engine Size (L)</label>
          <input
            type="number"
            step="0.1"
            value={vehicleData.engineSize}
            onChange={(e) => handleInputChange('engineSize', parseFloat(e.target.value) || 1.0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Retail Value (R)</label>
          <input
            type="number"
            value={vehicleData.retailValue}
            onChange={(e) => handleInputChange('retailValue', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Market Value (R)</label>
          <input
            type="number"
            value={vehicleData.marketValue}
            onChange={(e) => handleInputChange('marketValue', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Financed</label>
          <select
            value={vehicleData.financed}
            onChange={(e) => handleInputChange('financed', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="N">No</option>
            <option value="Y">Yes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Accessories</label>
          <select
            value={vehicleData.accessories}
            onChange={(e) => handleInputChange('accessories', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="N">No</option>
            <option value="Y">Yes</option>
          </select>
        </div>

        {vehicleData.accessories === 'Y' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accessories Amount (R)</label>
            <input
              type="number"
              value={vehicleData.accessoriesAmount}
              onChange={(e) => handleInputChange('accessoriesAmount', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Line</label>
            <input
              type="text"
              value={vehicleData.address.addressLine}
              onChange={(e) => handleInputChange('addressLine', e.target.value, 'address')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
            <input
              type="number"
              value={vehicleData.address.postalCode || ''}
              onChange={(e) => handleInputChange('postalCode', parseInt(e.target.value) || 0, 'address')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2196"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Suburb</label>
            <input
              type="text"
              value={vehicleData.address.suburb}
              onChange={(e) => handleInputChange('suburb', e.target.value, 'address')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Sandton"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overnight Parking</label>
            <select
              value={vehicleData.overnightParkingSituation}
              onChange={(e) => handleInputChange('overnightParkingSituation', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Garage">Garage</option>
              <option value="Driveway">Driveway</option>
              <option value="Street">Street</option>
              <option value="Parking Lot">Parking Lot</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDriverStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Driver Information</h2>
        <p className="text-gray-600">Tell us about the main driver</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={driverData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value, 'driver')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {validationErrors.firstName && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={driverData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value, 'driver')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {validationErrors.lastName && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
          <input
            type="number"
            value={driverData.age}
            onChange={(e) => handleInputChange('age', e.target.value, 'driver')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.age ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter age"
            min="18"
            max="100"
          />
          {validationErrors.age && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.age}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
          <input
            type="text"
            value={vehicleData.regularDriver.idNumber}
            onChange={(e) => handleInputChange('idNumber', e.target.value, 'regularDriver')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.idNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="13-digit ID number"
            maxLength={13}
          />
          {validationErrors.idNumber && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.idNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={vehicleData.regularDriver.emailAddress}
            onChange={(e) => handleInputChange('emailAddress', e.target.value, 'regularDriver')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.emailAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
          />
          {validationErrors.emailAddress && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.emailAddress}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
          <input
            type="tel"
            value={vehicleData.regularDriver.mobileNumber}
            onChange={(e) => handleInputChange('mobileNumber', e.target.value, 'regularDriver')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0821234567"
          />
          {validationErrors.mobileNumber && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.mobileNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">License Issue Date *</label>
          <input
            type="date"
            value={driverData.licenseDate}
            onChange={(e) => handleInputChange('licenseDate', e.target.value, 'driver')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.licenseDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.licenseDate && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.licenseDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
          <select
            value={vehicleData.regularDriver.maritalStatus}
            onChange={(e) => handleInputChange('maritalStatus', e.target.value, 'regularDriver')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currently Insured</label>
          <select
            value={vehicleData.regularDriver.currentlyInsured ? 'true' : 'false'}
            onChange={(e) => handleInputChange('currentlyInsured', e.target.value === 'true', 'regularDriver')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Years Without Claims</label>
          <input
            type="number"
            value={vehicleData.regularDriver.yearsWithoutClaims}
            onChange={(e) => handleInputChange('yearsWithoutClaims', parseInt(e.target.value) || 0, 'regularDriver')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            max="50"
          />
        </div>
      </div>
    </div>
  );

  const renderCoverageStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Coverage Options</h2>
        <p className="text-gray-600">Choose your coverage preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Type</label>
          <select
            value={vehicleData.coverCode}
            onChange={(e) => handleInputChange('coverCode', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Comprehensive">Comprehensive</option>
            <option value="Third Party">Third Party</option>
            <option value="Third Party Fire and Theft">Third Party Fire and Theft</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Use Type</label>
          <select
            value={vehicleData.useType}
            onChange={(e) => handleInputChange('useType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Private">Private</option>
            <option value="Business">Business</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
          <input
            type="text"
            value={agentData.agentName}
            onChange={(e) => handleInputChange('agentName', e.target.value, 'agent')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter agent full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agent Email</label>
          <input
            type="email"
            value={agentData.agentEmail}
            onChange={(e) => handleInputChange('agentEmail', e.target.value, 'agent')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter agent email"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleQuoteSubmit}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Getting Quote...</span>
            </>
          ) : (
            <>
              <DollarSign className="w-5 h-5" />
              <span>Get Quote</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        {quoteResult?.success ? (
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        ) : (
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        )}
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quote Results</h2>
        <p className="text-gray-600">Your insurance quote details</p>
      </div>

      {quoteResult?.success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-4">Quote Successful!</h3>
          
          {quoteResult.data?.premium && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-700">Monthly Premium:</span>
                <span className="text-2xl font-bold text-green-600">R{quoteResult.data.premium.toLocaleString()}</span>
              </div>
            </div>
          )}

          {quoteResult.data?.excess && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-700">Excess:</span>
                <span className="text-xl font-semibold text-blue-600">R{quoteResult.data.excess.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">Lead Transfer Information</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Name:</strong> {driverData.firstName} {driverData.lastName}</p>
              <p><strong>Email:</strong> {vehicleData.regularDriver.emailAddress}</p>
              <p><strong>Contact:</strong> {vehicleData.regularDriver.mobileNumber}</p>
              <p><strong>ID Number:</strong> {vehicleData.regularDriver.idNumber}</p>
              {agentData.agentName && <p><strong>Agent:</strong> {agentData.agentName}</p>}
              {agentData.agentEmail && <p><strong>Agent Email:</strong> {agentData.agentEmail}</p>}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleLeadTransfer}
              disabled={isTransferring}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center space-x-2"
            >
              {isTransferring ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Transferring Lead...</span>
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  <span>Transfer Lead</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-red-800 mb-4">Quote Failed</h3>
          <p className="text-red-700">{quoteResult?.error || 'Unknown error occurred'}</p>
          <button
            onClick={() => setCurrentStep(3)}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );

  const steps = [
    { number: 1, title: 'Vehicle', icon: Car },
    { number: 2, title: 'Driver', icon: User },
    { number: 3, title: 'Coverage', icon: Shield },
    { number: 4, title: 'Results', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Quick Insurance Quote</h1>
            <p className="text-xl text-gray-600">Get your motor insurance quote in minutes</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <React.Fragment key={step.number}>
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                      isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-white text-gray-500 border border-gray-300'
                    }`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 transition-colors duration-200 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {currentStep === 1 && renderVehicleStep()}
            {currentStep === 2 && renderDriverStep()}
            {currentStep === 3 && renderCoverageStep()}
            {currentStep === 4 && renderResultsStep()}

            {/* Navigation */}
            {currentStep < 3 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setQuoteResult(null);
                    setValidationErrors({});
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Start New Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;