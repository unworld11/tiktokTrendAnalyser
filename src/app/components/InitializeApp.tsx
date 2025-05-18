"use client";

import { useEffect } from 'react';

export default function InitializeApp() {
  useEffect(() => {
    // Initialize directories
    const initApp = async () => {
      try {
        await fetch('/api/create-directories');
        console.log('App directories initialized');
      } catch (error) {
        console.error('Failed to initialize app directories:', error);
      }
    };
    
    initApp();
  }, []);
  
  // Return null as this is just a utility component
  return null;
} 