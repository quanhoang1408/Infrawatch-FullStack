import React from 'react';
import { ProviderIcon } from '../vm';
import './ProviderCard.scss';

const ProviderCard = ({ provider, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa provider "${provider.name}"? Nếu có máy ảo đang sử dụng provider này, bạn sẽ cần xóa các máy ảo đó trước.`)) {
      onDelete(provider.id);
    }
  };

  return (
    <div className="provider-card">
      <div className="provider-card__header">
        <div className="provider-card__icon">
          <ProviderIcon provider={provider.type} size="lg" />
        </div>
        <div className="provider-card__info">
          <h3 className="provider-card__name">{provider.name}</h3>
          <div className="provider-card__type">{provider.type.toUpperCase()}</div>
        </div>
        <div className="provider-card__actions">
          <button
            className="provider-card__action provider-card__action--danger"
            onClick={handleDelete}
            title="Delete Provider"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="provider-card__details">
        <div className="provider-card__detail">
          <span className="provider-card__detail-label">Added:</span>
          <span className="provider-card__detail-value">
            {provider.createdAt ? formatDate(provider.createdAt) : 'Unknown'}
          </span>
        </div>

        {provider.type === 'aws' && provider.region && (
          <div className="provider-card__detail">
            <span className="provider-card__detail-label">Region:</span>
            <span className="provider-card__detail-value">{provider.region}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderCard;