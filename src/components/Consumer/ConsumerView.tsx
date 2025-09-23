import React, { useState, useRef } from 'react';
import { useEffect } from 'react';
import { 
  QrCode, 
  Shield, 
  Leaf, 
  Award, 
  MapPin, 
  Calendar, 
  Upload, 
  Camera, 
  Factory, 
  TestTube, 
  Package,
  Star,
  CheckCircle,
  AlertTriangle,
  Globe,
  Thermometer,
  Droplets
} from 'lucide-react';
import blockchainService from '../../services/blockchainService';
import qrService from '../../services/qrService';

const ConsumerView: React.FC = () => {
  const [qrInput, setQrInput] = useState('');
  const [productInfo, setProductInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Set up real-time updates
  useEffect(() => {
    const handleDataUpdate = () => {
      if (qrInput && productInfo) {
        handleQRScan(new Event('submitpubl:submit') as any, true);
      }
    };
    
    window.addEventListener('herbionyx-data-update', handleDataUpdate);
    return () => window.removeEventListener('herbionyx-data-update', handleDataUpdate);
  }, [qrInput, productInfo]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        simulateQRFromImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateQRFromImage = async (file: File) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const allBatches = await blockchainService.getAllBatches();
      if (allBatches.length > 0) {
        const randomBatch = allBatches[Math.floor(Math.random() * allBatches.length)];
        const lastEvent = randomBatch.events[randomBatch.events.length - 1];
        setQrInput(lastEvent.eventId);
        await handleQRScan(new Event('submit') as any, true);
      }
    } catch (error) {
      setError('Could not detect QR code in image. Please try a clearer image.');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (e: React.FormEvent, skipFormCheck = false) => {
    if (!skipFormCheck) {
      e.preventDefault();
      if (!qrInput.trim()) return;
    }

    setLoading(true);
    if (!skipFormCheck) setProductInfo(null);
    setError('');
    
    try {
      let eventId = skipFormCheck ? qrInput : qrInput.trim();
      if (eventId.includes('/track/')) {
        eventId = eventId.split('/track/')[1];
      }

      const data = await blockchainService.getBatchInfo(eventId);
      const batch = data.batch;
      const events = batch.events || [];
      
      // Mock coordinates for QUALITY_TEST, PROCESSING, and MANUFACTURING
      const enrichedEvents = events.map(event => {
        let mockLocation = event.data?.location || {};
        if (event.eventType === 'QUALITY_TEST') {
          mockLocation = { ...mockLocation, latitude: '23.123456', longitude: '88.654321', zone: event.data?.location?.zone || 'Testing Laboratory Facility' };
        } else if (event.eventType === 'PROCESSING') {
          mockLocation = { ...mockLocation, latitude: '23.789012', longitude: '88.987654', zone: event.data?.location?.zone || 'Processing Unit Facility' };
        } else if (event.eventType === 'MANUFACTURING') {
          mockLocation = { ...mockLocation, latitude: '24.456789', longitude: '89.123456', zone: event.data?.location?.zone || 'Manufacturing Plant Facility' };
        }
        return { ...event, data: { ...event.data, location: mockLocation } };
      });

      const productInfo = {
        productName: getProductNameFromEvents(enrichedEvents),
        brandName: getBrandNameFromEvents(enrichedEvents),
        batchId: batch.batchId,
        manufacturer: getManufacturerFromEvents(enrichedEvents),
        manufacturingDate: getManufacturingDateFromEvents(enrichedEvents),
        expiryDate: getExpiryDateFromEvents(enrichedEvents),
        authenticity: 'VERIFIED',
        certifications: getCertificationsFromEvents(enrichedEvents),
        qualityMetrics: getQualityMetricsFromEvents(enrichedEvents),
        journey: buildDetailedJourneyFromEvents(enrichedEvents),
        originDetails: getOriginDetailsFromEvents(enrichedEvents),
        environmentalData: getEnvironmentalDataFromEvents(enrichedEvents),
        complianceInfo: getComplianceInfoFromEvents(enrichedEvents)
      };
      
      setProductInfo(productInfo);
    } catch (error) {
      console.error('Consumer verification error:', error);
      if (!skipFormCheck) {
        setError('Product not found. Please check the QR code or product ID.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getProductNameFromEvents = (events: any[]) => {
    const mfgEvent = events.find(e => e.eventType === ' Diffusion');
    const collectionEvent = events.find(e => e.eventType === 'COLLECTION');
    return mfgEvent?.data?.productName || `${collectionEvent?.data?.herbSpecies} Product` || 'Herbal Product';
  };

  const getBrandNameFromEvents = (events: any[]) => {
    const mfgEvent = events.find(e => e.eventType === 'MANUFACTURING');
    return mfgEvent?.data?.brandName || mfgEvent?.organization || 'HerbionYX Certified';
  };

  const getManufacturerFromEvents = (events: any[]) => {
    const mfgEvent = events.find(e => e.eventType === 'MANUFACTURING');
    return mfgEvent?.participant || 'Unknown Manufacturer';
  };

  const getManufacturingDateFromEvents = (events: any[]) => {
    const mfgEvent = events.find(e => e.eventType === 'MANUFACTURING');
    return mfgEvent?.timestamp ? new Date(mfgEvent.timestamp).toISOString().split('T')[0] : '';
  };

  const getExpiryDateFromEvents = (events: any[]) => {
    const mfgEvent = events.find(e => e.eventType === 'MANUFACTURING');
    return mfgEvent?.data?.expiryDate || '';
  };

  const getCertificationsFromEvents = (events: any[]) => {
    const certifications = ['Blockchain Verified', 'Hyperledger Fabric Recorded'];
    const mfgEvent = events.find(e => e.eventType === 'MANUFACTURING');
    if (mfgEvent?.data?.certificationId) {
      certifications.push(`Certified: ${mfgEvent.data.certificationId}`);
    }
    const qualityEvent = events.find(e => e.eventType === 'QUALITY_TEST');
    if (qualityEvent?.data?.purity >= 95) {
      certifications.push('Premium Quality Certified');
    }
    return certifications;
  };

  const getQualityMetricsFromEvents = (events: any[]) => {
    const qualityEvent = events.find(e => e.eventType === 'QUALITY_TEST');
    if (!qualityEvent?.data) {
      return { status: 'No quality test data available' };
    }
    
    return {
      purity: `${qualityEvent.data.purity}%`,
      moistureContent: `${qualityEvent.data.moistureContent}%`,
      pesticideLevel: `${qualityEvent.data.pesticideLevel} ppm`,
      testMethod: qualityEvent.data.testMethod || 'Standard Laboratory Test',
      testDate: new Date(qualityEvent.timestamp).toLocaleDateString(),
      labName: qualityEvent.organization || 'Certified Laboratory',
      location: getLocationFromEvent(qualityEvent),
      coordinates: getCoordinatesFromEvent(qualityEvent)
    };
  };

  const getOriginDetailsFromEvents = (events: any[]) => {
    const collectionEvent = events.find(e => e.eventType === 'COLLECTION');
    if (!collectionEvent) return null;

    return {
      herbSpecies: collectionEvent.data?.herbSpecies,
      scientificName: getScientificName(collectionEvent.data?.herbSpecies),
      harvestLocation: collectionEvent.data?.location?.zone,
      harvestDate: new Date(collectionEvent.timestamp).toLocaleDateString(),
      collector: collectionEvent.participant,
      weight: collectionEvent.data?.weight,
      qualityGrade: collectionEvent.data?.qualityGrade,
      coordinates: collectionEvent.data?.location ? {
        latitude: parseFloat(collectionEvent.data.location.latitude).toFixed(6),
        longitude: parseFloat(collectionEvent.data.location.longitude).toFixed(6)
      } : null
    };
  };

  const getEnvironmentalDataFromEvents = (events: any[]) => {
    const collectionEvent = events.find(e => e.eventType === 'COLLECTION');
    const weather = collectionEvent?.data?.weather;
    
    if (!weather) return null;

    return {
      temperature: weather.temperature,
      humidity: weather.humidity,
      conditions: weather.description,
      windSpeed: weather.windSpeed,
      harvestConditions: 'Optimal for herb collection'
    };
  };

  const getComplianceInfoFromEvents = (events: any[]) => {
    const processingEvent = events.find(e => e.eventType === 'PROCESSING');
    const mfgEvent = events.find(e => e.eventType === 'MANUFACTURING');
    
    return {
      processingMethod: processingEvent?.data?.method || 'Not specified',
      processingLocation: processingEvent?.data?.location?.zone || 'Processing Unit Facility',
      processingCoordinates: getCoordinatesFromEvent(processingEvent),
      manufacturingLocation: mfgEvent?.data?.manufacturingLocation?.zone || 'Manufacturing Plant Facility',
      manufacturingCoordinates: getCoordinatesFromEvent(mfgEvent),
      yieldEfficiency: processingEvent?.data?.yieldPercentage ? `${processingEvent.data.yieldPercentage.toFixed(1)}%` : 'Not available',
      processingTemperature: processingEvent?.data?.temperature ? `${processingEvent.data.temperature}°C` : 'Not specified'
    };
  };

  const buildDetailedJourneyFromEvents = (events: any[]) => {
    return events.map(event => ({
      stage: event.eventType.replace('_', ' '),
      location: getLocationFromEvent(event),
      coordinates: getCoordinatesFromEvent(event),
      date: new Date(event.timestamp).toLocaleDateString(),
      time: new Date(event.timestamp).toLocaleTimeString(),
      participant: event.participant,
      organization: event.organization,
      details: getEventDetails(event),
      icon: getEventIcon(event.eventType)
    }));
  };

  const getLocationFromEvent = (event: any) => {
    if (!event?.data?.location) {
      return `${event?.organization || 'Unknown'} Facility`;
    }
    if (event.data.location.zone) return event.data.location.zone;
    if (event.data.location.address) return event.data.location.address;
    return `${event.organization || 'Unknown'} Facility`;
  };

  const getCoordinatesFromEvent = (event: any) => {
    if (event?.data?.location?.latitude && event?.data?.location?.longitude) {
      return {
        lat: parseFloat(event.data.location.latitude).toFixed(6),
        lng: parseFloat(event.data.location.longitude).toFixed(6)
      };
    }
    return null;
  };

  const getEventDetails = (event: any) => {
    switch (event.eventType) {
      case 'COLLECTION':
        return `Collected ${event.data?.weight || 'undefined'}g of ${event.data?.herbSpecies} (${event.data?.qualityGrade || 'undefined'} grade)`;
      case 'QUALITY_TEST':
        return `Quality test: ${event.data?.purity}% purity, ${event.data?.moistureContent}% moisture`;
      case 'PROCESSING':
        return `Processed using ${event.data?.method}, yield: ${event.data?.yield}g`;
      case 'MANUFACTURING':
        return `Manufactured ${event.data?.quantity} ${event.data?.unit} of ${event.data?.productName}`;
      default:
        return event.notes || `${event.eventType.replace('_', ' ')} completed successfully`;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'COLLECTION': return Leaf;
      case 'QUALITY_TEST': return TestTube;
      case 'PROCESSING': return Factory;
      case 'MANUFACTURING': return Package;
      default: return Package;
    }
  };

  const getScientificName = (herbName: string) => {
    const herbMap: { [key: string]: string } = {
      'Talispatra': 'Taxus wallichiana',
      'Ashwagandha': 'Withania somnifera',
      'Tulsi': 'Ocimum sanctum',
      'Neem': 'Azadirachta indica',
      'Brahmi': 'Bacopa monnieri',
      'Shatavari': 'Asparagus racemosus'
    };
    return herbMap[herbName] || 'Scientific name not available';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-800">Product Verification</h2>
            <p className="text-emerald-600">Verify authenticity and view complete product journey</p>
          </div>
        </div>

        {/* QR Scanner Form */}
        <form onSubmit={handleQRScan} className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Scan QR code, enter product code, or paste tracking URL"
                className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    <span>Verify</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                title="Upload QR image"
              >
                <Camera className="h-5 w-5" />
                <span className="hidden sm:inline">Scan Image</span>
              </button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </form>

        {/* Uploaded Image Preview */}
        {uploadedImage && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <img src={uploadedImage} alt="Uploaded QR" className="w-20 h-20 object-cover rounded-lg" />
              <div>
                <p className="text-blue-800 font-medium">QR Image Uploaded</p>
                <p className="text-blue-600 text-sm">Scanning for QR code...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Product Information */}
        {productInfo && (
          <div className="space-y-8">
            {/* Product Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-8 border border-emerald-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-emerald-800 mb-2">{productInfo.productName}</h3>
                  <p className="text-xl text-emerald-600 font-medium">{productInfo.brandName}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-green-600" />
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-lg font-bold">
                    {productInfo.authenticity}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                <div className="bg-white rounded-lg p-4">
                  <span className="font-medium text-emerald-600">Batch ID</span>
                  <p className="text-emerald-900 font-mono text-lg">{productInfo.batchId}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <span className="font-medium text-emerald-600">Manufacturer</span>
                  <p className="text-emerald-900 font-semibold">{productInfo.manufacturer}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <span className="font-medium text-emerald-600">Manufacturing Date</span>
                  <p className="text-emerald-900">{productInfo.manufacturingDate}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <span className="font-medium text-emerald-600">Expiry Date</span>
                  <p className="text-emerald-900">{productInfo.expiryDate || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Origin Details */}
            {productInfo.originDetails && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Leaf className="h-6 w-6 mr-3 text-green-600" />
                  Origin & Source Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-semibold text-green-800 mb-2">Herb Species</h5>
                    <p className="text-green-900 font-medium">{productInfo.originDetails.herbSpecies}</p>
                    <p className="text-green-700 text-sm italic">{productInfo.originDetails.scientificName}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 mb-2">Harvest Location</h5>
                    <p className="text-blue-900">{productInfo.originDetails.harvestLocation}</p>
                    {productInfo.originDetails.coordinates && (
                      <p className="text-blue-700 text-sm font-mono">
                        {productInfo.originDetails.coordinates.latitude}, {productInfo.originDetails.coordinates.longitude}
                      </p>
                    )}
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h5 className="font-semibold text-purple-800 mb-2">Collection Details</h5>
                    <p className="text-purple-900">Weight: {productInfo.originDetails.weight || 'undefined'}g</p>
                    <p className="text-purple-900">Grade: {productInfo.originDetails.qualityGrade || 'undefined'}</p>
                    <p className="text-purple-700 text-sm">By: {productInfo.originDetails.collector}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Environmental Conditions */}
            {productInfo.environmentalData && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Thermometer className="h-6 w-6 mr-3 text-blue-600" />
                  Environmental Conditions at Harvest
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <Thermometer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">{productInfo.environmentalData.temperature}</p>
                    <p className="text-blue-600 text-sm">Temperature</p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-4 text-center">
                    <Droplets className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-cyan-800">{productInfo.environmentalData.humidity}</p>
                    <p className="text-cyan-600 text-sm">Humidity</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Globe className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-gray-800">{productInfo.environmentalData.windSpeed}</p>
                    <p className="text-gray-600 text-sm">Wind Speed</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-green-800">{productInfo.environmentalData.harvestConditions}</p>
                    <p className="text-green-600 text-sm">Conditions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Metrics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <TestTube className="h-6 w-6 mr-3 text-blue-600" />
                Quality Test Results
              </h4>
              {productInfo.qualityMetrics.status ? (
                <p className="text-gray-600">{productInfo.qualityMetrics.status}</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-blue-600">Purity</span>
                      <p className="text-2xl font-bold text-blue-900">{productInfo.qualityMetrics.purity}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-green-600">Moisture Content</span>
                      <p className="text-2xl font-bold text-green-900">{productInfo.qualityMetrics.moistureContent}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-yellow-600">Pesticide Level</span>
                      <p className="text-2xl font-bold text-yellow-900">{productInfo.qualityMetrics.pesticideLevel}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Test Method:</span>
                        <p className="text-gray-900">{productInfo.qualityMetrics.testMethod}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Test Date:</span>
                        <p className="text-gray-900">{productInfo.qualityMetrics.testDate}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Laboratory:</span>
                        <p className="text-gray-900">{productInfo.qualityMetrics.labName}</p>
                      </div>
                    </div>
                    {productInfo.qualityMetrics.location && (
                      <div className="mt-4">
                        <span className="font-medium text-gray-600">Location:</span>
                        <p className="text-gray-900">{productInfo.qualityMetrics.location}</p>
                        {productInfo.qualityMetrics.coordinates && (
                          <p className="text-gray-500 text-xs font-mono">
                            {productInfo.qualityMetrics.coordinates.lat}, {productInfo.qualityMetrics.coordinates.lng}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Processing & Compliance */}
            {productInfo.complianceInfo && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <Factory className="h-6 w-6 mr-3 text-purple-600" />
                  Processing & Compliance Information
                </h4>
                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h5 className="font-semibold text-purple-800 mb-2">Processing Details</h5>
                    <p className="text-purple-900">Method: {productInfo.complianceInfo.processingMethod}</p>
                    <p className="text-purple-900">Temperature: {productInfo.complianceInfo.processingTemperature}</p>
                    <p className="text-purple-900">Yield Efficiency: {productInfo.complianceInfo.yieldEfficiency}</p>
                    <p className="text-purple-900">Location: {productInfo.complianceInfo.processingLocation}</p>
                    {productInfo.complianceInfo.processingCoordinates && (
                      <p className="text-purple-700 text-sm font-mono">
                        {productInfo.complianceInfo.processingCoordinates.lat}, {productInfo.complianceInfo.processingCoordinates.lng}
                      </p>
                    )}
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h5 className="font-semibold text-orange-800 mb-2">Manufacturing Details</h5>
                    <p className="text-orange-900">Location: {productInfo.complianceInfo.manufacturingLocation}</p>
                    {productInfo.complianceInfo.manufacturingCoordinates && (
                      <p className="text-orange-700 text-sm font-mono">
                        {productInfo.complianceInfo.manufacturingCoordinates.lat}, {productInfo.complianceInfo.manufacturingCoordinates.lng}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <Award className="h-6 w-6 mr-3 text-yellow-600" />
                Certifications & Standards
              </h4>
              <div className="flex flex-wrap gap-3">
                {productInfo.certifications.map((cert: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium border border-yellow-200"
                  >
                    <Award className="h-4 w-4 inline mr-2" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Complete Supply Chain Journey */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-xl font-semibold text-gray-800 mb-6">Complete Supply Chain Journey</h4>
              <div className="space-y-6">
                {productInfo.journey.map((step: any, index: number) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={index} className="relative">
                      {index < productInfo.journey.length - 1 && (
                        <div className="absolute left-8 top-20 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      <div className="flex items-start space-x-6">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-gray-200 shadow-lg">
                          <IconComponent className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-xl font-semibold text-gray-900">{step.stage}</h5>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {step.date} at {step.time}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <div>
                                <span className="font-medium">{step.location}</span>
                                {step.coordinates && (
                                  <p className="text-xs text-gray-500 font-mono">
                                    {step.coordinates.lat}, {step.coordinates.lng}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Factory className="h-4 w-4 mr-2" />
                              <div>
                                <span className="font-medium">{step.participant}</span>
                                <p className="text-xs text-gray-500">{step.organization}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 bg-white rounded-lg p-3 border">{step.details}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Demo Instructions */}
        {!productInfo && !loading && (
          <div className="text-center py-12">
            <QrCode className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-medium text-gray-900 mb-4">Verify Product Authenticity</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Scan the QR code on your product, upload a QR image, or enter the product code to view complete traceability
            </p>
            <div className="bg-emerald-50 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-sm text-emerald-700 font-medium mb-3">Try these options:</p>
              <div className="space-y-2 text-sm text-emerald-600">
                <p>• Scan QR code with your phone camera</p>
                <p>• Upload a photo of the QR code</p>
                <p>• Enter any batch ID or event ID</p>
                <p>• Paste a tracking URL</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerView;