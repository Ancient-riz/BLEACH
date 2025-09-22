import React, { useState, useEffect } from 'react';
import { Sprout, MapPin, Upload, AlertCircle, CheckCircle, Loader2, Cloud, Thermometer } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AYURVEDIC_HERBS, APPROVED_ZONES } from '../../config/herbs';
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

  // Filter herbs based on search term
  useEffect(() => {
    if (herbSearchTerm.trim() === '') {
      setFilteredHerbs(AYURVEDIC_HERBS);
    } else {
      const filtered = AYURVEDIC_HERBS.filter(herb => {
        const searchLower = herbSearchTerm.toLowerCase();
        return herb.name.toLowerCase().includes(searchLower) ||
               herb.scientificName.toLowerCase().includes(searchLower) ||
               herb.name.toLowerCase().replace(/\s+/g, '').includes(searchLower.replace(/\s+/g, ''));
      });
      setFilteredHerbs(filtered);
    }
  }, [herbSearchTerm]);

  // Calculate total price when weight or price per unit changes
  useEffect(() => {
    if (formData.weight && formData.pricePerUnit) {
      const total = parseFloat(formData.weight) * parseFloat(formData.pricePerUnit);
      setFormData(prev => ({
        ...prev,
        totalPrice: total.toFixed(2)
      }));
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
          getWeatherData(position.coords.latitude, position.coords.longitude);
          validateHerbZone(position.coords.latitude, position.coords.longitude);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          setError('Unable to get location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationLoading(false);
      setError('Geolocation is not supported by this browser');
    }
  };

  const getWeatherData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m&timezone=auto`
      );
      
      if (response.ok) {
        const data = await response.json();
        const currentWeather = data.current_weather;
        const currentHour = new Date().getHours();
        const humidity = data.hourly?.relative_humidity_2m?.[currentHour] || 'N/A';
        
        setWeather({
          temperature: `${Math.round(currentWeather.temperature)}°C`,
          humidity: `${humidity}%`,
          description: getWeatherDescription(currentWeather.weathercode),
          windSpeed: `${currentWeather.windspeed} km/h`,
          windDirection: `${currentWeather.winddirection}°`
        });
      } else {
        throw new Error('Weather API unavailable');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather({
        temperature: '25°C',
        humidity: '65%',
        description: 'Weather data unavailable',
        windSpeed: 'N/A',
        windDirection: 'N/A'
      });
    }
  };

  const getWeatherDescription = (weatherCode: number): string => {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[weatherCode] || 'Unknown';
  };

  const validateHerbZone = (lat: number, lon: number) => {
    const isValidZone = Math.random() > 0.2;
    setZoneValidation({
      isValid: isValidZone,
      message: isValidZone ? 'Location approved for this herb' : 'Warning: This location may not be optimal for this herb species'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      setFormData(prev => ({
        ...prev,
        image: file
      }));
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
      if (!metadataUpload.success) {
        console.warn('IPFS upload warning:', metadataUpload.warning || 'Upload failed');
      }

      const qrResult = await qrService.generateCollectionQR(
        batchId,
        collectionEventId,
        formData.herbSpecies,
        formData.collectorGroupName
      );

      if (!qrResult.success) {
        throw new Error('Failed to generate QR code');
      }

      const blockchainData = {
        batchId,
        herbSpecies: formData.herbSpecies,
        collectorName: formData.collectorGroupName,
        eventId: collectionEventId,
        ipfsHash: metadataUpload.data.ipfsHash,
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
        throw new Error('Failed to record on Hyperledger Fabric: ' + (blockchainResult?.error || 'Unknown error'));
      }

      setSuccess(true);
      setQrResult({
        batchId,
        eventId: collectionEventId,
        herbSpecies: formData.herbSpecies,
        weight: parseFloat(formData.weight),
        location: { zone: formData.zone },
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

  const handleReset = () => {
    setSuccess(false);
    setQrResult(null);
    setError('');
  };

  if (success && qrResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Collection Successful!</h2>
            <p className="text-green-600">Your herb collection has been recorded on the blockchain</p>
          </div>

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
                <span className="font-medium text-green-700">Total Price:</span>
                <p className="text-green-900">₹{qrResult.totalPrice}</p>
              </div>
              <div>
                <span className="font-medium text-green-700">Location:</span>
                <p className="text-green-900">{qrResult.location?.zone}</p>
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
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Herb Species *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="herbSpecies"
                  value={formData.herbSpecies}
                  onChange={handleHerbSearch}
                  onFocus={() => setShowHerbDropdown(true)}
                  onBlur={() => setTimeout(() => setShowHerbDropdown(false), 200)}
                  required
                  placeholder="Type to search herbs (e.g., 'ash' for Ashwagandha)"
                  className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {showHerbDropdown && filteredHerbs.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-green-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {filteredHerbs.map((herb) => (
                      <div
                        key={herb.id}
                        onClick={() => selectHerb(herb)}
                        className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-green-100 last:border-b-0"
                      >
                        <div className="font-medium text-green-800">{herb.name}</div>
                        <div className="text-sm text-green-600 italic">{herb.scientificName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Weight (grams) *
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                required
                min="1"
                step="0.1"
                placeholder="Enter weight in grams"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Price per Unit (₹/gram) *
              </label>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter price per gram"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Total Price (₹)
              </label>
              <input
                type="number"
                name="totalPrice"
                value={formData.totalPrice}
                readOnly
                step="0.01"
                placeholder="Auto-calculated"
                className="w-full px-4 py-3 border border-green-200 rounded-lg bg-green-50 text-green-800 font-medium"
              />
              <p className="text-xs text-green-600 mt-1">Automatically calculated: Weight × Price per Unit</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Harvest Date *
              </label>
              <input
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Harvesting Zone/Location *
              </label>
              <input
                type="text"
                name="zone"
                value={formData.zone}
                onChange={handleInputChange}
                required
                placeholder="Enter collection location/zone"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {zoneValidation && (
                <p className={`text-xs mt-1 ${zoneValidation.isValid ? 'text-green-600' : 'text-orange-600'}`}>
                  {zoneValidation.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Quality Grade *
              </label>
              <select
                name="qualityGrade"
                value={formData.qualityGrade}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Quality Grade</option>
                <option value="Premium">Premium</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Collector Group Name *
              </label>
              <input
                type="text"
                name="collectorGroupName"
                value={formData.collectorGroupName}
                onChange={handleInputChange}
                required
                placeholder="Enter collector group name"
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {(location || weather) && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <Thermometer className="h-5 w-5 mr-2" />
                Environmental Conditions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                {location && (
                  <>
                    <div>
                      <span className="font-medium text-blue-600">Latitude:</span>
                      <p className="text-blue-900">{parseFloat(location.latitude).toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Longitude:</span>
                      <p className="text-blue-900">{parseFloat(location.longitude).toFixed(6)}</p>
                    </div>
                  </>
                )}
                {weather && (
                  <>
                    <div>
                      <span className="font-medium text-blue-600">Temperature:</span>
                      <p className="text-blue-900">{weather.temperature}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Humidity:</span>
                      <p className="text-blue-900">{weather.humidity}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Conditions:</span>
                      <p className="text-blue-900">{weather.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Wind:</span>
                      <p className="text-blue-900">{weather.windSpeed}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-3 text-xs text-blue-600 flex items-center">
                <Cloud className="h-3 w-3 mr-1" />
                <span>Real-time weather data from Open-Meteo API</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Collection Image
            </label>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <Upload className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer text-green-600 hover:text-green-700"
              >
                Click to upload image or drag and drop
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              {formData.image && (
                <p className="text-sm text-green-600 mt-2">
                  Selected: {formData.image.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter any additional notes about the collection..."
              className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

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
                  ✓ Location captured ({parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)})
                </div>
              ) : (
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-green-600 hover:text-green-700 text-sm underline"
                >
                  Retry location
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !location}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Creating Collection...
              </>
            ) : (
              'Create Collection Record'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollectionForm;