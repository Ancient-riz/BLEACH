import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  QrCode,
  Download,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import qrService from '../../services/qrService';

const ActiveBatches: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [downloadingQR, setDownloadingQR] = useState<string | null>(null);

  useEffect(() => {
    // Load mock ONE PIECE batches
    fetchActiveBatches();

    // simulate periodic refresh
    const interval = setInterval(fetchActiveBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBatches = async () => {
    try {
      // Mock ONE PIECE batches
      const mockBatches = [
        {
          batchId: 'OP-001',
          herbSpecies: 'ONE PIECE – Gum-Gum Fruit',
          currentStatus: 'COLLECTED',
          creator: 'Monkey D. Luffy',
          eventCount: 2,
          lastUpdated: new Date().toISOString(),
          events: [
            {
              eventId: 'EVT-1',
              eventType: 'COLLECTED',
              participant: 'Monkey D. Luffy',
              organization: 'Straw Hat Pirates',
              timestamp: new Date().toISOString(),
              data: { location: 'East Blue' }
            }
          ]
        },
        {
          batchId: 'OP-002',
          herbSpecies: 'ONE PIECE – Three Sword Style Steel',
          currentStatus: 'QUALITY_TESTED',
          creator: 'Roronoa Zoro',
          eventCount: 3,
          lastUpdated: new Date().toISOString(),
          events: [
            {
              eventId: 'EVT-2',
              eventType: 'COLLECTED',
              participant: 'Tashigi',
              organization: 'Marines',
              timestamp: new Date().toISOString(),
              data: { location: 'Shimotsuki Village' }
            },
            {
              eventId: 'EVT-3',
              eventType: 'QUALITY_TESTED',
              participant: 'Roronoa Zoro',
              organization: 'Straw Hat Pirates',
              timestamp: new Date().toISOString(),
              data: { swords: 3 }
            }
          ]
        },
        {
          batchId: 'OP-003',
          herbSpecies: 'ONE PIECE – All Blue Ingredients',
          currentStatus: 'PROCESSED',
          creator: 'Vinsmoke Sanji',
          eventCount: 4,
          lastUpdated: new Date().toISOString(),
          events: [
            {
              eventId: 'EVT-4',
              eventType: 'COLLECTED',
              participant: 'Sanji',
              organization: 'Baratie',
              timestamp: new Date().toISOString(),
              data: { dish: 'Seafood Feast' }
            },
            {
              eventId: 'EVT-5',
              eventType: 'QUALITY_TESTED',
              participant: 'Nami',
              organization: 'Straw Hat Pirates',
              timestamp: new Date().toISOString(),
              data: { weatherCheck: 'Clear' }
            },
            {
              eventId: 'EVT-6',
              eventType: 'PROCESSED',
              participant: 'Sanji',
              organization: 'Baratie',
              timestamp: new Date().toISOString(),
              data: { processed: 'Cooked Ingredients' }
            }
          ]
        }
      ];

      setBatches(mockBatches);
    } catch (error) {
      console.error('Error fetching mock batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COLLECTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'QUALITY_TESTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COLLECTED': return <CheckCircle className="h-4 w-4" />;
      case 'QUALITY_TESTED': return <CheckCircle className="h-4 w-4" />;
      case 'PROCESSED': return <CheckCircle className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getNextStep = (status: string) => {
    switch (status) {
      case 'COLLECTED': return 'Ready for Quality Testing';
      case 'QUALITY_TESTED': return 'Ready for Processing';
      case 'PROCESSED': return 'Ready for Manufacturing';
      case 'MANUFACTURED': return 'Supply Chain Complete';
      default: return 'In Progress';
    }
  };

  const handleDownloadQR = async (batch: any) => {
    setDownloadingQR(batch.batchId);
    try {
      const latestEvent = batch.events[batch.events.length - 1];
      const qrResult = await qrService.generatePrintableQR(
        batch.batchId,
        latestEvent.eventId,
        {
          herbSpecies: batch.herbSpecies,
          currentStage: batch.currentStatus,
          participant: latestEvent.participant
        }
      );

      const link = document.createElement('a');
      link.href = qrResult;
      link.download = `${batch.batchId}-${batch.currentStatus}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR:', error);
    } finally {
      setDownloadingQR(null);
    }
  };

  const canUserAccess = (batch: any) => {
    if (!user) return false;
    if (user.role === 5 || user.role === 6) return true; // admin + consumer
    switch (batch.currentStatus) {
      case 'COLLECTED': return user.role === 2;
      case 'QUALITY_TESTED': return user.role === 3;
      case 'PROCESSED': return user.role === 4;
      default: return true;
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (filter === 'all') return true;
    if (filter === 'accessible') return canUserAccess(batch);
    return batch.currentStatus.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading active ONE PIECE batches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800">ONE PIECE Active Batches</h2>
              <p className="text-green-600">Mock Straw Hat supply chain in progress</p>
            </div>
          </div>
        </div>

        {/* Render cards (logic unchanged, just uses mock batches) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => (
            <div key={batch.batchId} className="bg-white border-2 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(batch.currentStatus)}`}>
                  {getStatusIcon(batch.currentStatus)}
                  <span className="ml-1">{batch.currentStatus.replace('_', ' ')}</span>
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{batch.herbSpecies}</h3>
              <p className="text-sm text-gray-600 font-mono">{batch.batchId}</p>
              <p className="text-sm text-gray-600 mt-2">Creator: {batch.creator}</p>
              <p className="text-sm text-gray-600">Events: {batch.eventCount}</p>
              <p className="text-sm text-gray-600">Next: {getNextStep(batch.currentStatus)}</p>

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleDownloadQR(batch)}
                  disabled={downloadingQR === batch.batchId}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  {downloadingQR === batch.batchId ? 'Downloading...' : 'Download QR'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveBatches;
