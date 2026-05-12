import { useState, useEffect, useRef, useCallback } from 'react';
import { Habit, WeeklyChallenge } from '../types';

export interface AppData {
  habits: Habit[];
  points: number;
  weeklyChallenge: WeeklyChallenge | null;
  timestamp: number;
}

const CLIENT_ID = '561357148109-h9jvtvark5evfh9kmqb3feavp5fu2bbm.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const FILENAME = 'habit_lab_data.json';

export type SyncStatus = 'Offline' | 'Syncing...' | 'Synced' | 'Error';

export function useGoogleDriveSync(
  currentData: Omit<AppData, 'timestamp'>,
  onRemoteDataUpdate: (data: Omit<AppData, 'timestamp'>) => void
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('Offline');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);
  const currentDataRef = useRef(currentData);
  const fileIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const lastUploadedTimestampRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  // Keep ref up to date
  useEffect(() => {
    currentDataRef.current = currentData;
  }, [currentData]);

  const loadGapiClient = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }, []);

  const handleAuthResult = useCallback(async (tokenResponse: google.accounts.oauth2.TokenResponse) => {
    if (tokenResponse && tokenResponse.access_token) {
      setIsSignedIn(true);
      await syncDriveFile();
    }
  }, []);

  useEffect(() => {
    // Wait for scripts to load
    const checkScripts = setInterval(() => {
      if (window.gapi && window.google) {
        clearInterval(checkScripts);
        
        loadGapiClient().then(() => {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: handleAuthResult,
          });
          setIsInitializing(false);
        }).catch((e) => {
          console.error("Failed to initialize GAPI client", e);
          setSyncStatus('Error');
          setIsInitializing(false);
        });
      }
    }, 100);

    return () => clearInterval(checkScripts);
  }, [loadGapiClient, handleAuthResult]);

  const signIn = useCallback(() => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken();
    }
  }, []);

  const syncDriveFile = async () => {
    if (!gapi.client.getToken()) return;
    
    setSyncStatus('Syncing...');
    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${FILENAME}' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name, modifiedTime)',
      });

      const files = response.result.files;
      if (files && files.length > 0) {
        // File exists, download it
        const file = files[0];
        fileIdRef.current = file.id!;
        
        const fileContentRes = await gapi.client.drive.files.get({
          fileId: file.id!,
          alt: 'media',
        });
        
        const remoteData: AppData = typeof fileContentRes.body === 'string' ? JSON.parse(fileContentRes.body) : fileContentRes.result;
        
        if (remoteData) {
           onRemoteDataUpdate(remoteData);
           lastUploadedTimestampRef.current = remoteData.timestamp || Date.now();
        }
        
      } else {
        // Create initial file
        await uploadToDrive(true);
      }
      setSyncStatus('Synced');
      isFirstLoadRef.current = false;
    } catch (e) {
      console.error('Error in initial sync:', e);
      setSyncStatus('Error');
    }
  };

  const uploadToDrive = async (isNew = false) => {
    if (!gapi.client.getToken()) return;
    
    const token = gapi.client.getToken().access_token;
    const metadata = {
      name: FILENAME,
      mimeType: 'application/json',
    };
    
    const dataToUpload: AppData = {
      ...currentDataRef.current,
      timestamp: Date.now(),
    };

    const fileContent = JSON.stringify(dataToUpload);
    const file = new Blob([fileContent], { type: 'application/json' });
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    try {
      const fetchParams = {
        method: isNew ? 'POST' : 'PATCH',
        headers: new Headers({ 'Authorization': 'Bearer ' + token }),
        body: form,
      };

      const url = isNew 
        ? 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
        : `https://www.googleapis.com/upload/drive/v3/files/${fileIdRef.current}?uploadType=multipart`;

      const req = await fetch(url, fetchParams);
      const res = await req.json();
      
      if (isNew) {
        fileIdRef.current = res.id;
      }
      
      lastUploadedTimestampRef.current = dataToUpload.timestamp;
      setSyncStatus('Synced');
    } catch (err) {
      console.error("Failed to upload data to Drive", err);
      setSyncStatus('Error');
    }
  };

  // Debounced uploading
  useEffect(() => {
    // Skip on first mount / before first load from remote
    if (isFirstLoadRef.current || !isSignedIn) return;

    setSyncStatus('Syncing...');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
       uploadToDrive(false);
    }, 10000); // 10 seconds

    return () => {
      if (debounceTimerRef.current) {
         clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentData]); // Depend on actual data to check changes

  return { syncStatus, isSignedIn, signIn, isInitializing };
}
