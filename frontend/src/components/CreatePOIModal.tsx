import React, { useState } from 'react';
import './CreatePOIModal.css';

interface CreatePOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, price?: number) => void;
  latitude: number;
  longitude: number;
}

const CreatePOIModal: React.FC<CreatePOIModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  latitude,
  longitude,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name, description, price ? parseFloat(price) : undefined);
      setName('');
      setDescription('');
      setPrice('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Point of Interest</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter POI name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price (optional)"
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <small>Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}</small>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create POI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePOIModal;
