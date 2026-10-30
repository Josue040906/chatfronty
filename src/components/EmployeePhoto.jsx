import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../api/client';

function isProtectedEmployeePhoto(source) {
  return typeof source === 'string'
    && source.startsWith(`${API_BASE_URL}/uploads/employes/`);
}

export default function EmployeePhoto({ src, onError, ...props }) {
  const [loadedImage, setLoadedImage] = useState({ source: '', url: '' });
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const protectedImage = isProtectedEmployeePhoto(src);

  useEffect(() => {
    if (!src || !protectedImage) {
      return undefined;
    }

    const controller = new AbortController();
    let objectUrl = '';

    fetch(src, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Photo indisponible (${response.status}).`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
          throw new Error('Le serveur n’a pas renvoyé une image.');
        }
        return response.blob();
      })
      .then((image) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(image);
          setLoadedImage({ source: src, url: objectUrl });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadedImage({ source: src, url: '' });
          onErrorRef.current?.();
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [protectedImage, src]);

  const imageSource = protectedImage
    ? loadedImage.source === src ? loadedImage.url : ''
    : src;
  return imageSource ? (
    <img {...props} src={imageSource} onError={onError} />
  ) : null;
}
