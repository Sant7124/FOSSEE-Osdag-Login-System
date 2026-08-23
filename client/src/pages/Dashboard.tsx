import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Generic error
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    setIsFetching(true);
    try {
      const response = await api.get('/files');
      if (response.data.status === 'success') {
        setFiles(response.data.data.files);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');
    
    if (!file) return;

    // Validate size (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5MB limit');
      setSelectedFile(null);
      return;
    }

    // Validate extension roughly
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'txt'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      setUploadError(`Invalid file type. Allowed: ${validExtensions.join(', ')}`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/files', formData);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchFiles(); // Refresh list after upload
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId: string, originalName: string) => {
    try {
      const response = await api.get(`/files/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      // Blob errors need special parsing if they contain JSON error messages
      setError('Failed to download file. It might have been deleted.');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/files/${fileId}`);
      // Optimistic update
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <h2>Welcome, {currentUser?.name}</h2>
          <p>{currentUser?.email}</p>
        </div>
        <button className="btn secondary" onClick={logout}>
          Log Out
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="dashboard-content">
        {/* Upload Section */}
        <div className="panel">
          <div className="panel-header">
            <h3>Upload Secure File</h3>
          </div>
          
          <div 
            className="upload-area" 
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <div className="upload-icon">☁️</div>
            <div className="upload-text">Click to select a file</div>
            <div className="upload-subtext">PDF, PNG, JPG, or TXT (Max 5MB)</div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              disabled={isUploading}
            />
          </div>

          {uploadError && <div className="alert error" style={{ marginTop: '1rem' }}>{uploadError}</div>}
          
          {selectedFile && (
            <div className="selected-file">
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{formatSize(selectedFile.size)}</span>
              </div>
              <div className="upload-actions">
                <button 
                  className="btn secondary" 
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    setUploadError('');
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button 
                  className="btn" 
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className="panel">
          <div className="panel-header">
            <h3>Your Secure Files</h3>
          </div>
          
          {isFetching ? (
            <div className="loading-screen" style={{ minHeight: '200px' }}>Loading files...</div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              You haven't uploaded any files yet.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td>{file.originalName}</td>
                      <td>{file.mimeType ? file.mimeType.split('/')[1] || file.mimeType : 'Unknown'}</td>
                      <td>{formatSize(file.size)}</td>
                      <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="file-actions">
                          <button 
                            className="action-btn" 
                            title="Download" 
                            onClick={() => handleDownload(file.id, file.originalName)}
                          >
                            ⬇️
                          </button>
                          <button 
                            className="action-btn delete" 
                            title="Delete" 
                            onClick={() => handleDelete(file.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
