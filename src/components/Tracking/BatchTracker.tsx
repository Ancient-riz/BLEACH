import React, { useState, useEffect } from 'react';
import { Search, Package, Calendar, User, QrCode, Download, CheckCircle, Thermometer, TestTube, Factory, Cpu } from 'lucide-react';
import blockchainService from '../../services/blockchainService';
import qrService from '../../services/qrService';

const BatchTracker: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingQR, setDownloadingQR] = useState(false);

  // Set up real-time updates
  useEffect(() => {
    const handleDataUpdate = () => {
      if (searchQuery && searchResult) {
        handleSearch(new Event('submit') as any, true);
      }
    };
    window.addEventListener('herbionyx-data-update', handleDataUpdate);
    return () => window.removeEventListener('herbionyx-data-update', handleDataUpdate);
  }, [searchQuery, searchResult]);

  const handleSearch = async (e: React.FormEvent, skipFormCheck = false) => {
    if (!skipFormCheck) {
      e.preventDefault();
      if (!searchQuery.trim()) return;
    }
    setLoading(true);
    setError('');
    if (!skipFormCheck) setSearchResult(null);
    try {
      const queryId = skipFormCheck ? searchQuery : searchQuery.trim();
      const result = await blockchainService.getBatchInfo(queryId);
      console.log('Batch Info Result:', JSON.stringify(result, null, 2)); // Debug: Log formatted result
      const collectionEvent = result.batch.events?.find((event: any) => event.eventType === 'COLLECTION');
      console.log('Collection Event Data:', collectionEvent?.data); // Debug: Log COLLECTION event data
      setSearchResult(result.batch);
    } catch (error) {
      console.error('Search error:', error);
      if (!skipFormCheck) {
        setError('Batch not found. Please check the Batch ID or Event ID.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = async (batch: any) => {
    setDownloadingQR(true);
    try {
      const latestEvent = batch.events[batch.events.length - 1];
      const currentStage = latestEvent.eventType.replace('_', ' ');
      const qrResult = await qrService.generatePrintableQR(
        batch.batchId,
        latestEvent.eventId,
        {
          herbSpecies: batch.herbSpecies,
          currentStage,
          participant: latestEvent.participant
        }
      );
      const link = document.createElement('a');
      link.href = qrResult;
      link.download = `${batch.batchId}-${batch.currentStatus}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccessNotification(`QR code downloaded: ${batch.batchId}-${batch.currentStatus}-QR.png`);
    } catch (error) {
      console.error('Error downloading QR:', error);
      showErrorNotification('Failed to download QR code');
    } finally {
      setDownloadingQR(false);
    }
  };

  const showSuccessNotification = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    toast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const showErrorNotification = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    toast.innerHTML = `
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COLLECTED': return 'bg-green-100 text-green-800';
      case 'QUALITY_TESTED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSED': return 'bg-purple-100 text-purple-800';
      case 'MANUFACTURED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'COLLECTION': return <Package className="h-4 w-4 text-green-600" />;
      case 'QUALITY_TEST': return <TestTube className="h-4 w-4 text-blue-600" />;
      case 'PROCESSING': return <Cpu className="h-4 w-4 text-purple-600" />;
      case 'MANUFACTURING': return <Factory className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderEventDetails = (event: any, batch: any) => {
    // Find COLLECTION event to use its coordinates as default
    const collectionEvent = batch.events?.find((e: any) => e.eventType === 'COLLECTION');
    const defaultCoordinates = collectionEvent?.data?.location
      ? {
          latitude: parseFloat(collectionEvent.data.location.latitude).toFixed(6),
          longitude: parseFloat(collectionEvent.data.location.longitude).toFixed(6)
        }
      : { latitude: 'Not available', longitude: 'Not available' };

    const details = [];
    switch (event.eventType) {
      case 'COLLECTION':
        details.push(
          <div key="collection" className="space-y-3 mt-4">
            <h4 className="font-semibold text-green-800 border-b border-green-200 pb-2">Collection Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-green-700">Herb Species:</span> <span className="text-green-900">{event.data?.herbSpecies || 'Not available'}</span></div>
              <div>
                <span className="font-medium text-green-700">Weight:</span>
                <span className="text-green-900">{event.data?.weight ? `${event.data.weight}g` : '100g'}</span>
              </div>
              <div>
                <span className="font-medium text-green-700">Quality Grade:</span>
                <span className="text-green-900">{event.data?.qualityGrade || 'Premium'}</span>
              </div>
              <div><span className="font-medium text-green-700">Harvest Date:</span> <span className="text-green-900">{new Date(event.timestamp).toLocaleDateString()}</span></div>
              <div className="col-span-2"><span className="font-medium text-green-700">Collection Zone:</span> <span className="text-green-900">{event.data?.location?.zone || 'Not specified'}</span></div>
              <div className="col-span-2">
                <span className="font-medium text-green-700">GPS Coordinates:</span>
                <span className="text-green-900 font-mono text-xs">
                  {event.data?.location?.latitude && event.data?.location?.longitude
                    ? `${parseFloat(event.data.location.latitude).toFixed(6)}, ${parseFloat(event.data.location.longitude).toFixed(6)}`
                    : 'Not available'}
                </span>
              </div>
              {event.data?.weather && (
                <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <span className="font-medium text-blue-700 flex items-center mb-2">
                    <Thermometer className="h-4 w-4 mr-1" />
                    Environmental Conditions
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-medium">Temperature:</span> {event.data.weather.temperature}</div>
                    <div><span className="font-medium">Humidity:</span> {event.data.weather.humidity}</div>
                    <div><span className="font-medium">Conditions:</span> {event.data.weather.description}</div>
                    <div><span className="font-medium">Wind:</span> {event.data.weather.windSpeed}</div>
                  </div>
                </div>
              )}
              {event.data?.notes && (
                <div className="col-span-2"><span className="font-medium text-green-700">Notes:</span> <span className="text-green-900">{event.data.notes}</span></div>
              )}
            </div>
          </div>
        );
        break;
      case 'QUALITY_TEST':
        details.push(
          <div key="quality" className="space-y-3 mt-4">
            <h4 className="font-semibold text-blue-800 border-b border-blue-200 pb-2">Quality Test Results</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-blue-700">Moisture Content:</span> <span className="text-blue-900">{event.data?.moistureContent}%</span></div>
              <div><span className="font-medium text-blue-700">Purity:</span> <span className="text-blue-900">{event.data?.purity}%</span></div>
              <div><span className="font-medium text-blue-700">Pesticide Level:</span> <span className="text-blue-900">{event.data?.pesticideLevel} ppm</span></div>
              <div><span className="font-medium text-blue-700">Test Method:</span> <span className="text-blue-900">{event.data?.testMethod || 'Standard Laboratory Test'}</span></div>
              <div className="col-span-2"><span className="font-medium text-blue-700">Test Location:</span> <span className="text-blue-900">{event.data?.testLocation?.zone || event.data?.location?.zone || 'Testing Facility'}</span></div>
              <div className="col-span-2">
                <span className="font-medium text-blue-700">GPS Coordinates:</span>
                <span className="text-blue-900 font-mono text-xs">
                  {(event.data?.testLocation?.latitude && event.data?.testLocation?.longitude) || (event.data?.location?.latitude && event.data?.location?.longitude)
                    ? `${parseFloat((event.data?.testLocation?.latitude || event.data?.location?.latitude)).toFixed(6)}, ${parseFloat((event.data?.testLocation?.longitude || event.data?.location?.longitude)).toFixed(6)}`
                    : `${defaultCoordinates.latitude}, ${defaultCoordinates.longitude}`}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-blue-700"></span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                  event.data?.purity >= 95 && event.data?.pesticideLevel <= 0.1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {event.data?.purity >= 95 && event.data?.pesticideLevel <= 0.1 ? 'PASSED' : 'COMPLETED'}
                </span>
              </div>
              {event.data?.customParameters && event.data.customParameters.length > 0 && (
                <div className="col-span-2">
                  <span className="font-medium text-blue-700">Additional Parameters:</span>
                  <div className="mt-1 space-y-1">
                    {event.data.customParameters.map((param: any, idx: number) => (
                      <div key={idx} className="text-xs bg-blue-50 p-2 rounded">
                        <span className="font-medium">{param.name}:</span> {param.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        break;
      case 'PROCESSING':
        details.push(
          <div key="processing" className="space-y-3 mt-4">
            <h4 className="font-semibold text-purple-800 border-b border-purple-200 pb-2">Processing Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-purple-700">Method:</span> <span className="text-purple-900">{event.data?.method}</span></div>
              <div><span className="font-medium text-purple-700">Output Yield:</span> <span className="text-purple-900">{event.data?.yield}g</span></div>
              {event.data?.temperature && (
                <div><span className="font-medium text-purple-700">Temperature:</span> <span className="text-purple-900">{event.data.temperature}°C</span></div>
              )}
              {event.data?.duration && (
                <div><span className="font-medium text-purple-700">Duration:</span> <span className="text-purple-900">{event.data.duration}</span></div>
              )}
              {event.data?.yieldPercentage && (
                <div><span className="font-medium text-purple-700">Yield Efficiency:</span> <span className="text-purple-900">{event.data.yieldPercentage.toFixed(2)}%</span></div>
              )}
              <div className="col-span-2"><span className="font-medium text-purple-700">Processing Location:</span> <span className="text-purple-900">{event.data?.processingLocation?.zone || event.data?.location?.zone || 'Processing Facility'}</span></div>
              <div className="col-span-2">
                <span className="font-medium text-purple-700">GPS Coordinates:</span>
                <span className="text-purple-900 font-mono text-xs">
                  {(event.data?.processingLocation?.latitude && event.data?.processingLocation?.longitude) || (event.data?.location?.latitude && event.data?.location?.longitude)
                    ? `${parseFloat((event.data?.processingLocation?.latitude || event.data?.location?.latitude)).toFixed(6)}, ${parseFloat((event.data?.processingLocation?.longitude || event.data?.location?.longitude)).toFixed(6)}`
                    : `${defaultCoordinates.latitude}, ${defaultCoordinates.longitude}`}
                </span>
              </div>
            </div>
          </div>
        );
        break;
      case 'MANUFACTURING':
        details.push(
          <div key="manufacturing" className="space-y-3 mt-4">
            <h4 className="font-semibold text-orange-800 border-b border-orange-200 pb-2">Manufacturing Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-orange-700">Product Name:</span> <span className="text-orange-900">{event.data?.productName}</span></div>
              <div><span className="font-medium text-orange-700">Product Type:</span> <span className="text-orange-900">{event.data?.productType}</span></div>
              <div><span className="font-medium text-orange-700">Quantity:</span> <span className="text-orange-900">{event.data?.quantity} {event.data?.unit}</span></div>
              <div><span className="font-medium text-orange-700">Manufacturing Date:</span> <span className="text-orange-900">{new Date(event.timestamp).toLocaleDateString()}</span></div>
              {event.data?.expiryDate && (
                <div><span className="font-medium text-orange-700">Expiry Date:</span> <span className="text-orange-900">{event.data.expiryDate}</span></div>
              )}
              {event.data?.brandName && (
                <div><span className="font-medium text-orange-700">Brand:</span> <span className="text-orange-900">{event.data.brandName}</span></div>
              )}
              {event.data?.certificationId && (
                <div><span className="font-medium text-orange-700">Certification ID:</span> <span className="text-orange-900">{event.data.certificationId}</span></div>
              )}
              <div className="col-span-2"><span className="font-medium text-orange-700">Manufacturing Location:</span> <span className="text-orange-900">{event.data?.manufacturingLocation?.zone || event.data?.location?.zone || 'Manufacturing Plant'}</span></div>
              <div className="col-span-2">
                <span className="font-medium text-orange-700">GPS Coordinates:</span>
                <span className="text-orange-900 font-mono text-xs">
                  {(event.data?.manufacturingLocation?.latitude && event.data?.manufacturingLocation?.longitude) || (event.data?.location?.latitude && event.data?.location?.longitude)
                    ? `${parseFloat((event.data?.manufacturingLocation?.latitude || event.data?.location?.latitude)).toFixed(6)}, ${parseFloat((event.data?.manufacturingLocation?.longitude || event.data?.location?.longitude)).toFixed(6)}`
                    : 'Not available'}
                </span>
              </div>
            </div>
          </div>
        );
        break;
    }
    return details;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
            <Search className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-800">Track Batch</h2>
            <p className="text-blue-600">Search and track batches by Batch ID or Event ID</p>
          </div>
        </div>
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Batch ID (HERB-...) or Event ID (COLLECTION-..., TEST-..., etc.)"
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Track</span>
                </>
              )}
            </button>
          </div>
        </form>
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {searchResult && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-blue-800">{searchResult.herbSpecies}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(searchResult.currentStatus)}`}>
                    {searchResult.currentStatus}
                  </span>
                  <button
                    onClick={() => handleDownloadQR(searchResult)}
                    disabled={downloadingQR}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download QR code for current stage"
                  >
                    {downloadingQR ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span className="text-sm">Download QR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-600">Batch ID</span>
                  <p className="text-blue-900 font-mono">{searchResult.batchId}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-600">Creator</span>
                  <p className="text-blue-900">{searchResult.creator}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-600">Total Events</span>
                  <p className="text-blue-900">{searchResult.events?.length || 0}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-6">Supply Chain Journey</h4>
              <div className="space-y-6">
                {searchResult.events?.map((event: any, index: number) => (
                  <div key={event.eventId} className="relative">
                    {index < searchResult.events.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 shadow-sm">
                        {getEventTypeIcon(event.eventType)}
                      </div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-gray-900">{event.eventType.replace('_', ' ')}</h5>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                            {index === searchResult.events.length - 1 && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Current Stage
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <span className="font-medium">{event.participant}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <QrCode className="h-4 w-4 mr-2" />
                            <span className="font-mono text-xs">{event.eventId}</span>
                          </div>
                        </div>
                        {renderEventDetails(event, searchResult)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {!searchResult && !loading && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Track Any Batch</h3>
            <p className="text-gray-600 mb-4">
              Enter a Batch ID or Event ID to view the complete supply chain journey
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-700 font-medium mb-2">View detailed information for each event below</p>
              <div className="space-y-1 text-sm text-blue-600">
                <p>• Complete participant details</p>
                <p>• Environmental conditions</p>
                <p>• Test parameters and results</p>
                <p>• Processing specifications</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTracker;