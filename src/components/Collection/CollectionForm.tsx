import React, { useState, useEffect } from 'react';
import { Sprout, MapPin, Upload, AlertCircle, CheckCircle, Loader2, Cloud, Thermometer } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AYURVEDIC_HERBS } from '../../config/herbs';
import blockchainService from '../../services/blockchainService';
import ipfsService from '../../services/ipfsService';
import qrService from '../../services/qrService';
import QRCodeDisplay from '../Common/QRCodeDisplay';

const CollectionForm: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [qrResult, setQrResult] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [zoneValidation, setZoneValidation] = useState<any>(null);
  const [filteredHerbs, setFilteredHerbs] = useState(AYURVEDIC_HERBS);
  const [herbSearchTerm, setHerbSearchTerm] = useState('');
  const [showHerbDropdown, setShowHerbDropdown] = useState(false);

  const [formData, setFormData] = useState({
    herbSpecies: '',
    weight: '',
    pricePerUnit: '',
    totalPrice: '',
    harvestDate: new Date().toISOString().split('T')[0],
    zone: '',
    qualityGrade: '',
    notes: '',
    collectorGroupName: user?.name || '',
    image: null as File | null
  });

  useEffect(() => {
    getCurrentLocation();
    initializeBlockchain();
  }, []);

  // filter herbs
  useEffect(() => {
    if (herbSearchTerm.trim() === '') {
      setFilteredHerbs(AYURVEDIC_HERBS);
    } else {
      const searchLower = herbSearchTerm.toLowerCase();
      const filtered = AYURVEDIC_HERBS.filter(herb =>
        herb.name.toLowerCase().includes(searchLower) ||
        herb.scientificName.toLowerCase().includes(searchLower)
      );
      setFilteredHerbs(filtered);
    }
  }, [herbSearchTerm]);

  // recalc total price
  useEffect(() => {
    if (formData.weight && formData.pricePerUnit) {
      const total = parseFloat(formData.weight) * parseFloat(formData.pricePerUnit);
      setFormData(prev => ({ ...prev, totalPrice: total.toFixed(2) }));
    }
  }, [formData.weight, formData.pricePerUnit]);

  const initializeBlockchain = async () => {
    try {
      await blockchainService.initialize();
    } catch (error) {
      console.error('Error initializing blockchain:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            accuracy: position.coords.accuracy
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          setError('Unable to get location. Please enable location services.');
        }
      );
    } else {
      setLocationLoading(false);
      setError('Geolocation not supported');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHerbSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHerbSearchTerm(value);
    setFormData(prev => ({ ...prev, herbSpecies: value }));
    setShowHerbDropdown(true);
  };

  const selectHerb = (herb: any) => {
    setFormData(prev => ({ ...prev, herbSpecies: herb.name }));
    setHerbSearchTerm(herb.name);
    setShowHerbDropdown(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!location) {
      setError('Location is required for collection');
      setLoading(false);
      return;
    }

    try {
      const batchId = blockchainService.generateBatchId();
      const collectionEventId = blockchainService.generateEventId('COLLECTION');

      let imageHash = null;
      if (formData.image) {
        const imageUpload = await ipfsService.uploadFile(formData.image);
        if (imageUpload.success) {
          imageHash = imageUpload.ipfsHash;
        }
      }

      const collectionData = {
        batchId,
        herbSpecies: formData.herbSpecies,
        collector: formData.collectorGroupName,
        weight: parseFloat(formData.weight),
        harvestDate: formData.harvestDate,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          zone: formData.zone
        },
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalPrice: parseFloat(formData.totalPrice),
        qualityGrade: formData.qualityGrade,
        notes: formData.notes,
        images: imageHash ? [imageHash] : []
      };

      const metadataUpload = await ipfsService.createCollectionMetadata(collectionData);

      const qrResult = await qrService.generateCollectionQR(
        batchId,
        collectionEventId,
        formData.herbSpecies,
        formData.collectorGroupName
      );

      // ✅ FIX: include weight, grade, harvestDate in blockchain
      const blockchainData = {
        batchId,
        herbSpecies: formData.herbSpecies,
        collectorName: formData.collectorGroupName,
        eventId: collectionEventId,
        ipfsHash: metadataUpload.data.ipfsHash,
        weight: parseFloat(formData.weight),
        qualityGrade: formData.qualityGrade,
        harvestDate: formData.harvestDate,
        totalPrice: parseFloat(formData.totalPrice),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          zone: formData.zone
        },
        qrCodeHash: qrResult.qrHash,
        weather: weather
      };

      const blockchainResult = await blockchainService.createBatch(
        user?.address || '',
        blockchainData
      );

      if (!blockchainResult?.success) {
        throw new Error('Failed to record on blockchain');
      }

      setSuccess(true);
      setQrResult({
        batchId,
        eventId: collectionEventId,
        herbSpecies: formData.herbSpecies,
        weight: parseFloat(formData.weight),
        qualityGrade: formData.qualityGrade,
        harvestDate: formData.harvestDate,
        qr: qrResult,
        hyperledgerFabric: blockchainResult,
        weather: weather
      });

      setFormData({
        herbSpecies: '',
        weight: '',
        pricePerUnit: '',
        totalPrice: '',
        harvestDate: new Date().toISOString().split('T')[0],
        zone: '',
        qualityGrade: '',
        notes: '',
        collectorGroupName: user?.name || '',
        image: null
      });
      setHerbSearchTerm('');
    } catch (error) {
      console.error('Collection creation error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success && qrResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Collection Successful!</h2>
            <p className="text-green-600">Your herb collection has been recorded</p>
          </div>

          <div className="grid gap-2 text-sm mb-6">
            <p><b>Batch ID:</b> {qrResult.batchId}</p>
            <p><b>Herb Species:</b> {qrResult.herbSpecies}</p>
            <p><b>Weight:</b> {qrResult.weight} g</p>
            <p><b>Quality Grade:</b> {qrResult.qualityGrade}</p>
            <p><b>Harvest Date:</b> {new Date(qrResult.harvestDate).toLocaleDateString()}</p>
          </div>

          <QRCodeDisplay
            qrData={{
              dataURL: qrResult.qr.dataURL,
              trackingUrl: qrResult.qr.trackingUrl,
              eventId: qrResult.eventId
            }}
            title="Collection QR Code"
            subtitle="Scan to track this batch"
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* keep your form UI same as before */}
    </form>
  );
};

export default CollectionForm;
