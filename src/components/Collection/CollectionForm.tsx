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

  // Filter herbs as user types
  useEffect(() => {
    if (herbSearchTerm.trim() === '') {
      setFilteredHerbs(AYURVEDIC_HERBS);
    } else {
      const searchLower = herbSearchTerm.toLowerCase();
      setFilteredHerbs(
        AYURVEDIC_HERBS.filter(
          herb =>
            herb.name.toLowerCase().includes(searchLower) ||
            herb.scientificName.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [herbSearchTerm]);

  // Auto-calc total price
  useEffect(() => {
    if (formData.weight && formData.pricePerUnit) {
      const total = parseFloat(formData.weight) * parseFloat(formData.pricePerUnit);
      setFormData(prev => ({ ...prev, totalPrice: total.toFixed(2) }));
    }
  }, [formData.weight, formData.pricePerUnit]);

  const initializeBlockchain = async () => {
    try {
      await blockchainService.initialize();
    } catch (err) {
      console.error('Blockchain init error:', err);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude.toString(),
            longitude: pos.coords.longitude.toString()
          });
          setLocationLoading(false);
        },
        (err) => {
          console.error('Location error:', err);
          setError('Unable to get location. Please enable location services.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError('Geolocation not supported');
      setLocationLoading(false);
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
    if (file) setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!location) {
      setError('Location is required');
      setLoading(false);
      return;
    }

    try {
      const batchId = blockchainService.generateBatchId();
      const eventId = blockchainService.generateEventId('COLLECTION');

      let imageHash = null;
      if (formData.image) {
        const upload = await ipfsService.uploadFile(formData.image);
        if (upload.success) imageHash = upload.ipfsHash;
      }

      const metadataUpload = await ipfsService.createCollectionMetadata({
        batchId,
        herbSpecies: formData.herbSpecies,
        collector: formData.collectorGroupName,
        weight: parseFloat(formData.weight),
        harvestDate: formData.harvestDate,
        location,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalPrice: parseFloat(formData.totalPrice),
        qualityGrade: formData.qualityGrade,
        notes: formData.notes,
        images: imageHash ? [imageHash] : []
      });

      const qr = await qrService.generateCollectionQR(batchId, eventId, formData.herbSpecies, formData.collectorGroupName);
      const chain = await blockchainService.createBatch(user?.address || '', {
        batchId,
        herbSpecies: formData.herbSpecies,
        collectorName: formData.collectorGroupName,
        eventId,
        ipfsHash: metadataUpload.data?.ipfsHash,
        location,
        qrCodeHash: qr.qrHash
      });

      if (!chain.success) throw new Error(chain.error || 'Blockchain error');

      setSuccess(true);
      setQrResult({
        batchId,
        eventId,
        herbSpecies: formData.herbSpecies,
        weight: parseFloat(formData.weight),
        zone: formData.zone,
        qr
      });

      // Reset form
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
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setQrResult(null);
    setError('');
  };

  // ✅ Success Screen (PRICE REMOVED)
  if (success && qrResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Collection Successful!</h2>
            <p className="text-green-600">Your herb collection has been recorded on the blockchain</p>
          </div>

          {/* ✅ Removed Total Price from details */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Batch ID:</span>
                <p className="text-green-900 font-mono">{qrResult.batchId}</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Herb Species:</span>
                <p className="text-green-900">{qrResult.herbSpecies}</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Weight:</span>
                <p className="text-green-900">{qrResult.weight}g</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Zone:</span>
                <p className="text-green-900">{qrResult.zone || 'N/A'}</p>
              </div>
            </div>
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

          <button
            onClick={handleReset}
            className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
          >
            Create New Collection
          </button>
        </div>
      </div>
    );
  }

  // ---------- FORM UI ----------
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-800">Collector Group</h2>
            <p className="text-green-600">Record herb collection details with location validation</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Herb Species */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Herb Species *</label>
              <div className="relative">
                <input
                  type="text"
                  name="herbSpecies"
                  value={formData.herbSpecies}
                  onChange={handleHerbSearch}
                  onFocus={() => setShowHerbDropdown(true)}
                  onBlur={() => setTimeout(() => setShowHerbDropdown(false), 200)}
                  required
                  className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                {showHerbDropdown && filteredHerbs.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-green-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredHerbs.map((herb) => (
                      <div
                        key={herb.id}
                        onClick={() => selectHerb(herb)}
                        className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-green-100 last:border-b-0"
                      >
                        <div className="font-medium text-green-800">{herb.name}</div>
                        <div className="text-sm text-green-600 italic">{herb.scientificName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Weight (grams) *</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                required
                min="1"
                step="0.1"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Price per Unit (₹/g) *</label>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Total Price (only in form) */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Total Price (₹)</label>
              <input
                type="number"
                name="totalPrice"
                value={formData.totalPrice}
                readOnly
                step="0.01"
                className="w-full px-4 py-3 border border-green-200 rounded-lg bg-green-50 text-green-800 font-medium"
              />
            </div>

            {/* Harvest Date */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Harvest Date *</label>
              <input
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Zone */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Zone *</label>
              <input
                type="text"
                name="zone"
                value={formData.zone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Quality Grade *</label>
              <select
                name="qualityGrade"
                value={formData.qualityGrade}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select</option>
                <option value="Premium">Premium</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            {/* Collector */}
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Collector Group *</label>
              <input
                type="text"
                name="collectorGroupName"
                value={formData.collectorGroupName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Collection Image</label>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer text-green-600 hover:text-green-700">
                Click to upload image
              </label>
              {formData.image && (
                <p className="text-sm text-green-600 mt-2">Selected: {formData.image.name}</p>
              )}
            </div>
          </div>

          {/* Location Status */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-700 font-medium">Location Status</span>
              </div>
              {locationLoading ? (
                <div className="flex items-center text-green-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Getting location...</span>
                </div>
              ) : location ? (
                <div className="text-green-600 text-sm">
                  ✓ Captured ({parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)})
                </div>
              ) : (
                <button
                  type="button"
                 
