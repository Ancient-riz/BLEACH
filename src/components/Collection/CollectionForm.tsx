import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

// ⚡ MOCK SERVICES (replace with real ones when backend is ready)
const blockchainService = {
  initialize: async () => true,
  generateBatchId: () => 'BATCH-' + Date.now(),
  generateEventId: (p: string) => `${p}-${Date.now()}`,
  createBatch: async () => ({ success: true })
};
const ipfsService = {
  uploadFile: async () => ({ success: true, ipfsHash: 'QmFakeHash' }),
  createCollectionMetadata: async () => ({ success: true, data: { ipfsHash: 'QmFakeMeta' } })
};
const qrService = {
  generateCollectionQR: async () => ({ success: true, qrHash: 'QRHash', dataURL: '', trackingUrl: '' })
};

const CollectionForm: React.FC = () => {
  const [formData, setFormData] = useState({
    herbSpecies: '',
    weight: '',
    pricePerUnit: '',
    totalPrice: '',
    zone: '',
    image: null as File | null
  });
  const [location, setLocation] = useState<{ latitude: string; longitude: string } | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrResult, setQrResult] = useState<any>(null);

  // calculate total price whenever weight or price changes
  useEffect(() => {
    if (formData.weight && formData.pricePerUnit) {
      const total =
        parseFloat(formData.weight || '0') * parseFloat(formData.pricePerUnit || '0');
      setFormData((prev) => ({ ...prev, totalPrice: total.toFixed(2) }));
    }
  }, [formData.weight, formData.pricePerUnit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await blockchainService.initialize();
      const batchId = blockchainService.generateBatchId();
      const eventId = blockchainService.generateEventId('COLLECTION');

      // image/ipfs
      let imageHash = null;
      if (formData.image) {
        const up = await ipfsService.uploadFile();
        if (up.success) imageHash = up.ipfsHash;
      }

      const meta = await ipfsService.createCollectionMetadata();
      const qr = await qrService.generateCollectionQR();
      const chain = await blockchainService.createBatch();

      if (!meta.success || !qr.success || !chain.success) {
        throw new Error('Service failure');
      }

      // ✅ include price fields here
      setQrResult({
        batchId,
        eventId,
        herbSpecies: formData.herbSpecies,
        weight: parseFloat(formData.weight),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalPrice: parseFloat(formData.totalPrice),
        location: { zone: formData.zone },
        qr,
        weather
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setQrResult(null);
    setFormData({
      herbSpecies: '',
      weight: '',
      pricePerUnit: '',
      totalPrice: '',
      zone: '',
      image: null
    });
  };

  // ✅ SUCCESS SCREEN
  if (success && qrResult) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">
        <div className="text-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700">Collection Successful!</h2>
          <p className="text-green-600">Recorded on blockchain (mock)</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm bg-green-50 p-4 rounded">
          <div>
            <span className="font-semibold">Batch ID:</span>
            <p className="font-mono">{qrResult.batchId}</p>
          </div>
          <div>
            <span className="font-semibold">Herb Species:</span>
            <p>{qrResult.herbSpecies}</p>
          </div>
          <div>
            <span className="font-semibold">Weight:</span>
            <p>{qrResult.weight} g</p>
          </div>
          <div>
            <span className="font-semibold">Price / Gram:</span>
            <p>₹{qrResult.pricePerUnit}</p>
          </div>
          <div>
            <span className="font-semibold">Total Price:</span>
            <p>₹{qrResult.totalPrice}</p>
          </div>
          <div>
            <span className="font-semibold">Zone:</span>
            <p>{qrResult.location.zone || 'N/A'}</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
        >
          Create New Collection
        </button>
      </div>
    );
  }

  // ✅ FORM SCREEN
  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">New Herb Collection</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Herb Species</label>
          <input
            type="text"
            name="herbSpecies"
            value={formData.herbSpecies}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Weight (g)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Price/Gram (₹)</label>
            <input
              type="number"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Total Price (₹)</label>
          <input
            type="text"
            value={formData.totalPrice}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Zone</label>
          <input
            type="text"
            name="zone"
            value={formData.zone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Create Collection'}
        </button>
      </form>
    </div>
  );
};

export default CollectionForm;
