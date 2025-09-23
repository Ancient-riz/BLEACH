import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Calendar,
  User,
  QrCode,
  Download,
  Thermometer,
  TestTube,
  Factory,
  Cpu,
} from 'lucide-react';
import blockchainService from '../../services/blockchainService';
import qrService from '../../services/qrService';

const BatchTracker: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingQR, setDownloadingQR] = useState(false);

  // ✅ Coordinate validation helpers
  const isValidCoordinate = (coord: any): boolean => {
    if (coord === null || coord === undefined) return false;
    const num = typeof coord === 'string' ? parseFloat(coord) : Number(coord);
    return !isNaN(num);
  };

  const formatCoordinates = (lat: any, lon: any): string => {
    if (isValidCoordinate(lat) && isValidCoordinate(lon)) {
      return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
    }
    return 'Not available';
  };

  // Live updates
  useEffect(() => {
    const handleDataUpdate = () => {
      if (searchQuery && searchResult) {
        handleSearch(new Event('submit') as any, true);
      }
    };
    window.addEventListener('herbionyx-data-update', handleDataUpdate);
    return () =>
      window.removeEventListener('herbionyx-data-update', handleDataUpdate);
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
      setSearchResult(result.batch);
    } catch (err) {
      console.error('Search error:', err);
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
          participant: latestEvent.participant,
        }
      );

      const link = document.createElement('a');
      link.href = qrResult;
      link.download = `${batch.batchId}-${batch.currentStatus}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccessNotification(
        `QR code downloaded: ${batch.batchId}-${batch.currentStatus}-QR.png`
      );
    } catch (err) {
      console.error('Error downloading QR:', err);
      showErrorNotification('Failed to download QR code');
    } finally {
      setDownloadingQR(false);
    }
  };

  const showSuccessNotification = (message: string) => {
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
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
    toast.className =
      'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    toast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COLLECTED':
        return 'bg-green-100 text-green-800';
      case 'QUALITY_TESTED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSED':
        return 'bg-purple-100 text-purple-800';
      case 'MANUFACTURED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'COLLECTION':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'QUALITY_TEST':
        return <TestTube className="h-4 w-4 text-blue-600" />;
      case 'PROCESSING':
        return <Cpu className="h-4 w-4 text-purple-600" />;
      case 'MANUFACTURING':
        return <Factory className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderEventDetails = (event: any) => {
    const details: JSX.Element[] = [];
    switch (event.eventType) {
      case 'COLLECTION':
        details.push(
          <div key="collection" className="space-y-3 mt-4">
            <h4 className="font-semibold text-green-800 border-b border-green-200 pb-2">
              Collection Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-green-700">Herb Species:</span>{' '}
                {event.data?.herbSpecies}
              </div>
              <div>
                <span className="font-medium text-green-700">Weight:</span>{' '}
                {event.data?.weight}g
              </div>
              <div>
                <span className="font-medium text-green-700">Quality Grade:</span>{' '}
                {event.data?.qualityGrade}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-green-700">GPS:</span>{' '}
                <span className="font-mono text-xs">
                  {formatCoordinates(
                    event.data?.location?.latitude,
                    event.data?.location?.longitude
                  )}
                </span>
              </div>
            </div>
          </div>
        );
        break;

      case 'QUALITY_TEST':
        details.push(
          <div key="quality" className="space-y-3 mt-4">
            <h4 className="font-semibold text-blue-800 border-b border-blue-200 pb-2">
              Quality Test Results
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-blue-700">Result:</span>{' '}
                {event.data?.testResult}
              </div>
              <div>
                <span className="font-medium text-blue-700">Temperature:</span>{' '}
                {event.data?.temperature}°C
              </div>
              <div className="col-span-2">
                <span className="font-medium text-blue-700">GPS:</span>{' '}
                <span className="font-mono text-xs">
                  {formatCoordinates(
                    event.data?.testLocation?.latitude ??
                      event.data?.location?.latitude,
                    event.data?.testLocation?.longitude ??
                      event.data?.location?.longitude
                  )}
                </span>
              </div>
            </div>
          </div>
        );
        break;

      case 'PROCESSING':
        details.push(
          <div key="processing" className="space-y-3 mt-4">
            <h4 className="font-semibold text-purple-800 border-b border-purple-200 pb-2">
              Processing Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-purple-700">Method:</span>{' '}
                {event.data?.processingMethod}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-purple-700">GPS:</span>{' '}
                <span className="font-mono text-xs">
                  {formatCoordinates(
                    event.data?.location?.latitude,
                    event.data?.location?.longitude
                  )}
                </span>
              </div>
            </div>
          </div>
        );
        break;

      case 'MANUFACTURING':
        details.push(
          <div key="manufacturing" className="space-y-3 mt-4">
            <h4 className="font-semibold text-orange-800 border-b border-orange-200 pb-2">
              Manufacturing Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-orange-700">Product:</span>{' '}
                {event.data?.productType}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-orange-700">GPS:</span>{' '}
                <span className="font-mono text-xs">
                  {formatCoordinates(
                    event.data?.manufacturingLocation?.latitude ??
                      event.data?.location?.latitude,
                    event.data?.manufacturingLocation?.longitude ??
                      event.data?.location?.longitude
                  )}
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
            <p className="text-blue-600">Search by Batch ID or Event ID</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-8 flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Batch ID or Event ID"
            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></div>
            ) : (
              <>
                <Search className="h-5 w-5" /> <span>Track</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {searchResult && (
          <div className="space-y-8">
            {/* Batch Info */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-blue-800">
                  {searchResult.herbSpecies}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                    searchResult.currentStatus
                  )}`}
                >
                  {searchResult.currentStatus}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Batch ID</span>
                  <p className="font-mono">{searchResult.batchId}</p>
                </div>
                <div>
                  <span className="font-medium">Creator</span>
                  <p>{searchResult.creator}</p>
                </div>
                <div>
                  <span className="font-medium">Events</span>
                  <p>{searchResult.events?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Supply Chain Journey</h4>
              <div className="space-y-6">
                {searchResult.events?.map((event: any, index: number) => (
                  <div key={event.eventId} className="relative">
                    {index < searchResult.events.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white border rounded-full flex items-center justify-center shadow-sm">
                        {getEventTypeIcon(event.eventType)}
                      </div>
                      <div className="flex-1 bg-white border rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold">
                            {event.eventType.replace('_', ' ')}
                          </h5>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {event.participant}
                          </div>
                          <div className="flex items-center font-mono text-xs">
                            <QrCode className="h-4 w-4 mr-2" />
                            {event.eventId}
                          </div>
                        </div>
                        {renderEventDetails(event)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTracker;
