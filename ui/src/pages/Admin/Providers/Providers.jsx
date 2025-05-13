import React, { useState, useEffect } from 'react';
import providerService from '../../../services/provider.service';
import ProviderCard from '../../../components/admin/ProviderCard';
import ProviderForm from '../../../components/admin/ProviderForm';
import Spinner from '../../../components/common/Spinner';
import EmptyState from '../../../components/common/EmptyState';
import ErrorState from '../../../components/common/ErrorState';
import { toast } from '../../../components/feedback/ToastContainer';
import './Providers.scss';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [addingInProgress, setAddingInProgress] = useState(false);

  // Fetch providers on component mount
  useEffect(() => {
    fetchProviders();
  }, []);

  // Function to fetch providers
  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await providerService.getProviders();

      // Debug data
      console.log('Providers data:', data);
      console.log('Is array:', Array.isArray(data));

      // Ensure providers is always an array
      if (Array.isArray(data)) {
        setProviders(data);
      } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
        // Handle case where API returns { data: [...] }
        setProviders(data.data);
      } else {
        console.warn('API returned invalid data format for providers');
        setProviders([]);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new provider
  const handleAddProvider = async (providerData) => {
    try {
      setAddingInProgress(true);
      const newProvider = await providerService.addProvider(providerData);
      setProviders([...providers, newProvider]);
      setIsAddingProvider(false);
      toast.success('Provider added successfully');
    } catch (err) {
      console.error('Error adding provider:', err);
      toast.error(err.response?.data?.message || 'Failed to add provider');
    } finally {
      setAddingInProgress(false);
    }
  };

  // Function to delete a provider
  const handleDeleteProvider = async (providerId) => {
    try {
      await providerService.deleteProvider(providerId);
      setProviders(providers.filter(provider => provider.id !== providerId));
      toast.success('Provider đã được xóa thành công');
    } catch (err) {
      console.error('Error deleting provider:', err);

      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Không thể xóa provider';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }

      toast.error(errorMessage);
    }
  };

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="providers__loading">
          <Spinner size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorState
          title="Failed to load providers"
          message="There was an error fetching the provider configurations. Please try again."
          error={error}
          retryAction={fetchProviders}
        />
      );
    }

    if (providers.length === 0 && !isAddingProvider) {
      return (
        <EmptyState
          title="No providers configured"
          message="Add a cloud provider to start managing your virtual machines."
          actionButton={
            <button onClick={() => setIsAddingProvider(true)} className="btn btn--primary">
              Add Provider
            </button>
          }
        />
      );
    }

    return (
      <>
        {isAddingProvider ? (
          <ProviderForm
            onSubmit={handleAddProvider}
            onCancel={() => setIsAddingProvider(false)}
            loading={addingInProgress}
          />
        ) : (
          <>
            <div className="providers__grid">
              {providers.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onDelete={handleDeleteProvider}
                />
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="providers">
      <div className="providers__header">
        <h1 className="providers__title">Cloud Providers</h1>
        {!isAddingProvider && providers.length > 0 && (
          <div className="providers__actions">
            <button
              onClick={() => setIsAddingProvider(true)}
              className="btn btn--primary"
            >
              Add Provider
            </button>
          </div>
        )}
      </div>

      <div className="providers__content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Providers;