import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Prefixes relative `/api/*` requests with {@link environment.apiBaseUrl} when set (local dev → Django on :8000).
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiBaseUrl;
  if (!base || !req.url.startsWith('/api')) {
    return next(req);
  }
  return next(req.clone({ url: `${base}${req.url}` }));
};
