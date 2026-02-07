import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleBusinessAuth } from '@/hooks/useGoogleBusinessAuth';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useGoogleBusinessAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your Google account...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(error === 'access_denied' 
          ? 'You denied access to your Google account.' 
          : `Google returned an error: ${error}`);
        setTimeout(() => navigate('/dashboard/reviews'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code. Please try again.');
        setTimeout(() => navigate('/dashboard/reviews'), 3000);
        return;
      }

      const success = await handleCallback(code, state);
      
      if (success) {
        setStatus('success');
        setMessage('Successfully connected! Redirecting...');
        setTimeout(() => navigate('/dashboard/reviews'), 2000);
      } else {
        setStatus('error');
        setMessage('Failed to connect. Please try again.');
        setTimeout(() => navigate('/dashboard/reviews'), 3000);
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
            <h2 className="text-xl font-semibold mb-2">Connected!</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
          </>
        )}
        
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default GoogleCallback;