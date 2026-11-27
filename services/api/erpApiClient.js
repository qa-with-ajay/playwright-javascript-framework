/**
 * Small API client for ERP tests. Reuses Playwright's APIRequestContext so
 * authenticated browser cookies are available when the page context is passed.
 */
export class ErpApiClient {
  constructor(request, baseURL) {
    this.request = request;
    this.baseURL = baseURL;
  }

  url(path) {
    return new URL(path, this.baseURL).toString();
  }

  get(path, options = {}) {
    return this.request.get(this.url(path), options);
  }

  post(path, data, options = {}) {
    return this.request.post(this.url(path), { ...options, data });
  }

  put(path, data, options = {}) {
    return this.request.put(this.url(path), { ...options, data });
  }

  patch(path, data, options = {}) {
    return this.request.patch(this.url(path), { ...options, data });
  }

  delete(path, options = {}) {
    return this.request.delete(this.url(path), options);
  }
}
