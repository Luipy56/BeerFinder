import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ViewItemDetailsModal from '../components/ViewItemDetailsModal';
import EditItemModal from '../components/EditItemModal';
import DeleteItemModal from '../components/DeleteItemModal';
import ItemService from '../services/itemService';
import { Item } from '../types/poi';
import { DEFAULT_BEER_LOGO_PATH } from '../utils/constants';
import { formatPrice } from '../utils/format';
import { getFlavorLabel } from '../utils/formatFlavor';
import './ItemsPage.css';

const ItemsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('itemsViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ItemService.getAllItems();
      setAllItems(data);
      setItems(data);
    } catch (error: any) {
      console.error('Error loading items:', error);
      showError(error.response?.data?.detail || t('pages.items.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setItems(allItems);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allItems.filter((item) => {
      // Search by name
      if (item.name?.toLowerCase().includes(query)) return true;
      
      // Search by brand
      if (item.brand?.toLowerCase().includes(query)) return true;
      
      // Search by flavor
      if (item.flavor_type?.toLowerCase().includes(query)) return true;

      // Search by volumen
      if (item.volumen?.toLowerCase().includes(query)) return true;
      
      // Search by price
      if (item.typical_price !== null && item.typical_price !== undefined) {
        if (item.typical_price.toString().includes(query)) return true;
      }
      
      // Search by percentage
      if (item.percentage !== null && item.percentage !== undefined) {
        if (item.percentage.toString().includes(query)) return true;
      }
      
      return false;
    });
    
    setItems(filtered);
  }, [searchQuery, allItems]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadItems();
  }, [isAuthenticated, navigate, loadItems]);

  useEffect(() => {
    localStorage.setItem('itemsViewMode', viewMode);
  }, [viewMode]);

  const handleViewItem = (item: Item) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleEditItem = () => {
    if (selectedItem && user?.is_admin) {
      setIsViewModalOpen(false);
      setIsEditModalOpen(true);
    }
  };

  const handleItemUpdated = () => {
    loadItems();
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleOpenDeleteItemModal = () => {
    setIsEditModalOpen(false);
    setIsDeleteItemModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem?.id) return;
    await ItemService.deleteItem(selectedItem.id);
    setIsDeleteItemModalOpen(false);
    setSelectedItem(null);
    loadItems();
    showSuccess(t('pages.items.itemDeleted'));
  };

  const getThumbnailUrl = (thumbnail: string | null | undefined): string => {
    if (thumbnail) {
      return `data:image/png;base64,${thumbnail}`;
    }
    return DEFAULT_BEER_LOGO_PATH;
  };

  if (loading) {
    return (
      <div className="items-page">
        <Header />
        <div className="items-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p className="items-loading-text">{t('pages.items.loading')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="items-page">
      <Header />
      <div className="items-container">
        <div className="items-header">
          <h1 className="items-title">{t('pages.items.title')}</h1>
          <p className="items-subtitle">{t('pages.items.subtitle')}</p>
          <div className="items-search-container">
            <input
              type="text"
              className="items-search-input"
              placeholder={t('pages.items.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="items-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label={t('common.gridView')}
              title={t('common.gridView')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label={t('common.listView')}
              title={t('common.listView')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div className={viewMode === 'grid' ? 'items-grid' : 'items-list'}>
          {items.length === 0 ? (
            <div className="items-empty">
              <p>{t('pages.items.noItems')}</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`item-card item-card-clickable ${viewMode === 'list' ? 'item-card-list' : ''}`}
                onClick={() => handleViewItem(item)}
              >
                <div className="item-card-thumbnail">
                  <img
                    src={getThumbnailUrl(item.thumbnail)}
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_BEER_LOGO_PATH;
                    }}
                  />
                </div>
                <div className="item-card-content">
                  <h3 className="item-card-name">{item.name}</h3>
                  {item.brand && (
                    <div className="item-card-brand">
                      <span className="item-card-brand-label">{t('pages.items.brand')}</span>
                      <span className="item-card-brand-value">{item.brand}</span>
                    </div>
                  )}
                  {(item.flavor_type || item.volumen) && (
                    <div className="item-card-flavor">
                      <span className="item-card-flavor-label">{t(item.volumen ? 'pages.items.flavorVolumen' : 'pages.items.flavor')}</span>
                      <span className="item-card-flavor-value">
                        {[item.flavor_type && getFlavorLabel(item.flavor_type, t), item.volumen].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  )}
                  {item.description && (
                    <p className="item-card-description">{item.description}</p>
                  )}
                  <div className="item-card-details">
                    {item.typical_price && (
                      <div className="item-card-price">
                        <span className="item-card-price-label">{t('pages.items.typicalPrice')}</span>
                        <span className="item-card-price-value">{formatPrice(item.typical_price)}</span>
                      </div>
                    )}
                    {item.percentage !== null && item.percentage !== undefined && (
                      <div className="item-card-percentage">
                        <span className="item-card-percentage-label">{t('pages.items.percentage')}</span>
                        <span className="item-card-percentage-value">{item.percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedItem && (
        <>
          <ViewItemDetailsModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onEdit={handleEditItem}
          />
          <EditItemModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onItemUpdated={handleItemUpdated}
            onRequestDelete={user?.is_admin ? handleOpenDeleteItemModal : undefined}
          />
          <DeleteItemModal
            isOpen={isDeleteItemModalOpen}
            onClose={() => {
              setIsDeleteItemModalOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onConfirm={handleDeleteItem}
          />
        </>
      )}
      <Footer />
    </div>
  );
};

export default ItemsPage;
